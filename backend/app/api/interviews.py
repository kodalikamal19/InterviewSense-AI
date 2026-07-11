from fastapi import APIRouter, UploadFile, File, Form, Depends, BackgroundTasks
from datetime import datetime
from app.database.connection import get_db, get_next_sequence_value, db as global_db
from app.services.whisper_service import transcribe_audio
from app.services.diarization_service import diarize_transcript
from app.services.report_generator import generate_evaluation_report
from app.services.qa_extractor import extract_questions_answers
from app.utils.file_helper import save_uploaded_file, ALLOWED_AUDIO_EXTENSIONS
from app.utils.exceptions import EntityNotFoundError, InvalidFileError
from app.utils.logger import get_logger

logger = get_logger("app.api.interviews")
router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("/create")
async def create_interview(
    candidate_id: int = Form(..., description="The ID of the candidate"),
    job_id: int = Form(..., description="The ID of the job"),
    db = Depends(get_db)
):
    """
    Creates a new interview session record in MongoDB linking candidate_id and job_id.
    """
    logger.info(f"Creating database interview session. Candidate ID: {candidate_id}, Job ID: {job_id}")
    
    # Verify candidate exists
    candidate = db["candidates"].find_one({"_id": candidate_id})
    if not candidate:
        logger.warning(f"Candidate ID {candidate_id} not found when creating interview.")
        raise EntityNotFoundError(message=f"Candidate with ID {candidate_id} not found")
        
    # Verify job description exists
    job = db["jobs"].find_one({"_id": job_id})
    if not job:
        logger.warning(f"Job ID {job_id} not found when creating interview.")
        raise EntityNotFoundError(message=f"Job Description with ID {job_id} not found")

    try:
        interview_id = get_next_sequence_value("interviews")
        interview_doc = {
            "_id": interview_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "status": "created",
            "audio_path": None,
            "created_at": datetime.utcnow()
        }
        db["interviews"].insert_one(interview_doc)
        logger.info(f"Successfully created interview record in DB. Interview ID: {interview_id}")
        
        return {
            "success": True,
            "message": "Interview session created successfully",
            "interview": {
                "id": interview_id,
                "candidate_id": candidate_id,
                "job_id": job_id,
                "status": "created",
                "created_at": interview_doc["created_at"].isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create interview record: {str(e)}", exc_info=True)
        raise InvalidFileError(message=f"Failed to create interview session: {str(e)}")

@router.post("/{interview_id}/upload-audio")
async def upload_audio(
    interview_id: int,
    file: UploadFile = File(..., description="Recorded audio file (.wav, .mp3, .webm)"),
    db = Depends(get_db)
):
    """
    Uploads audio file for an interview session and updates state in DB.
    """
    logger.info(f"Received audio upload request for Interview: {interview_id}, File: {file.filename}")
    
    interview = db["interviews"].find_one({"_id": interview_id})
    if not interview:
        logger.warning(f"Interview ID {interview_id} not found for audio upload.")
        raise EntityNotFoundError(message=f"Interview with ID {interview_id} not found")
        
    # Save file to disk
    saved_path = save_uploaded_file(file, "audio", ALLOWED_AUDIO_EXTENSIONS)
    
    try:
        db["interviews"].update_one(
            {"_id": interview_id},
            {
                "$set": {
                    "audio_path": saved_path,
                    "status": "recorded"
                }
            }
        )
        logger.info(f"Successfully updated audio path for Interview ID {interview_id}")
        
        return {
            "success": True,
            "message": "Interview audio uploaded successfully",
            "interview_id": interview_id,
            "audio_path": saved_path,
            "status": "recorded"
        }
    except Exception as e:
        logger.error(f"Failed to update audio path: {str(e)}")
        raise InvalidFileError(message=f"Database transaction failed: {str(e)}")

# Background tasks workers
async def run_transcription_task(interview_id: int):
    """
    Background worker doing transcription, speaker isolation,
    and writing transcript records to MongoDB.
    """
    logger.info(f"[Background] Starting transcription pipeline for Interview ID: {interview_id}")
    try:
        # 1. Fetch interview details
        interview = global_db["interviews"].find_one({"_id": interview_id})
        if not interview:
            logger.error(f"[Background] Interview ID {interview_id} not found inside background task.")
            return

        if not interview.get("audio_path"):
            logger.error(f"[Background] No audio path found for Interview ID {interview_id}.")
            return

        # 2. Run Whisper speech-to-text
        raw_text = transcribe_audio(interview["audio_path"])
        
        # 3. Run speaker diarization
        diarized_segments = diarize_transcript(raw_text)
        
        # 4. Extract question-answer pairs
        qa_list = extract_questions_answers(diarized_segments)
        
        # 5. Build question-answer subdocuments
        qa_records = []
        for qa in qa_list:
            qa_id = get_next_sequence_value("question_answers")
            qa_records.append({
                "id": qa_id,
                "question_text": qa.get("question_text"),
                "answer_text": qa.get("answer_text"),
                "round_classification": qa.get("round_classification"),
                "score": qa.get("score"),
                "feedback": qa.get("feedback")
            })

        # 6. Update interview document with transcript and Q&A details
        global_db["interviews"].update_one(
            {"_id": interview_id},
            {
                "$set": {
                    "transcript": {
                        "raw_text": raw_text,
                        "diarized_segments": diarized_segments
                    },
                    "questions_answers": qa_records,
                    "status": "transcribed"
                }
            }
        )
        logger.info(f"[Background] Successfully completed transcription for Interview ID: {interview_id}")
        
    except Exception as e:
        logger.error(f"[Background] Exception occurred in Whisper transcription pipeline for ID {interview_id}: {str(e)}", exc_info=True)

async def run_analysis_task(interview_id: int):
    """
    Background worker generating report metrics and writing evaluations.
    """
    logger.info(f"[Background] Starting evaluation report pipeline for Interview ID: {interview_id}")
    try:
        # 1. Fetch interview details along with candidate resume and job criteria
        interview = global_db["interviews"].find_one({"_id": interview_id})
        if not interview:
            logger.error(f"[Background] Interview ID {interview_id} not found in background task.")
            return

        candidate = global_db["candidates"].find_one({"_id": interview["candidate_id"]})
        job = global_db["jobs"].find_one({"_id": interview["job_id"]})

        resume_data = {}
        if candidate and candidate.get("resume"):
            resume_data = {
                "skills": candidate["resume"].get("parsed_skills", []),
                "experience": candidate["resume"].get("parsed_experience", {}),
                "education": candidate["resume"].get("parsed_education", "")
            }

        jd_data = {}
        if job:
            jd_data = {
                "role": job["role"],
                "skills": job.get("parsed_skills", {}),
                "requirements": job.get("parsed_requirements", {})
            }

        transcript_list = []
        if interview.get("transcript") and interview["transcript"].get("diarized_segments"):
            transcript_list = interview["transcript"]["diarized_segments"]

        # 2. Call generator service
        report_payload = generate_evaluation_report(resume_data, jd_data, transcript_list)

        # 3. Create database report subdocument
        report_id = get_next_sequence_value("reports")
        report_doc = {
            "id": report_id,
            "overall_score": report_payload.get("overall_score", 7.0),
            "summary_evaluation": report_payload.get("summary", ""),
            "strengths": report_payload.get("strengths", []),
            "weaknesses": report_payload.get("weaknesses", []),
            "resume_consistency_status": report_payload.get("resume_consistency_status"),
            "resume_consistency_details": report_payload.get("resume_consistency_details"),
            "communication_metrics": report_payload.get("communication_metrics") or {"wpm": 0, "filler_words_count": 0, "grammar_score": "N/A"},
            "created_at": datetime.utcnow()
        }

        # 4. Save to interview document and update status
        global_db["interviews"].update_one(
            {"_id": interview_id},
            {
                "$set": {
                    "report": report_doc,
                    "status": "analyzed"
                }
            }
        )
        logger.info(f"[Background] Successfully completed evaluation report for Interview ID: {interview_id}")

    except Exception as e:
        logger.error(f"[Background] Exception occurred in evaluation report task for ID {interview_id}: {str(e)}", exc_info=True)

@router.post("/{interview_id}/transcribe")
async def transcribe_interview(
    interview_id: int,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """
    Triggers Whisper transcription in the background and updates interview status.
    """
    logger.info(f"Triggered transcription for Interview: {interview_id}")
    
    interview = db["interviews"].find_one({"_id": interview_id})
    if not interview:
        raise EntityNotFoundError(message=f"Interview with ID {interview_id} not found")
        
    try:
        db["interviews"].update_one(
            {"_id": interview_id},
            {"$set": {"status": "transcribing"}}
        )
        
        background_tasks.add_task(run_transcription_task, interview_id)
        
        return {
            "success": True,
            "message": "Transcription task scheduled in background",
            "interview_id": interview_id,
            "status": "transcribing"
        }
    except Exception as e:
        raise InvalidFileError(message=f"Database update failed: {str(e)}")

@router.post("/{interview_id}/analyze")
async def analyze_interview(
    interview_id: int,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """
    Triggers AI report analysis in the background and updates interview status.
    """
    logger.info(f"Triggered analysis for Interview: {interview_id}")
    
    interview = db["interviews"].find_one({"_id": interview_id})
    if not interview:
        raise EntityNotFoundError(message=f"Interview with ID {interview_id} not found")
        
    try:
        db["interviews"].update_one(
            {"_id": interview_id},
            {"$set": {"status": "analyzing"}}
        )
        
        background_tasks.add_task(run_analysis_task, interview_id)
        
        return {
            "success": True,
            "message": "AI analysis task scheduled in background",
            "interview_id": interview_id,
            "status": "analyzing"
        }
    except Exception as e:
        raise InvalidFileError(message=f"Database update failed: {str(e)}")

@router.get("/stats")
async def get_interview_stats(db = Depends(get_db)):
    """
    Computes total numbers of candidates, jobs, interviews, and the average evaluation score.
    """
    logger.info("Computing interview dashboard statistics")
    try:
        total_candidates = db["candidates"].count_documents({})
        total_jobs = db["jobs"].count_documents({})
        total_interviews = db["interviews"].count_documents({})
        
        # Calculate average score from reports
        avg_score = 0.0
        interviews_with_reports = list(db["interviews"].find({"report": {"$exists": True}}))
        if interviews_with_reports:
            scores = [
                i["report"]["overall_score"] 
                for i in interviews_with_reports 
                if i.get("report") and i["report"].get("overall_score") is not None
            ]
            if scores:
                avg_score = round(sum(scores) / len(scores), 1)
        
        return {
            "success": True,
            "stats": {
                "candidates": total_candidates,
                "jobs": total_jobs,
                "interviews": total_interviews,
                "avg_score": avg_score
            }
        }
    except Exception as e:
        logger.error(f"Error computing dashboard statistics: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"Failed to compute statistics: {str(e)}"
        }

@router.get("")
async def list_interviews(db = Depends(get_db)):
    """
    Retrieves all interview slots with their linked candidate, job, and report metrics.
    """
    logger.info("Retrieving all interview sessions list")
    try:
        interviews = list(db["interviews"].find().sort("_id", -1))
        
        interviews_list = []
        for item in interviews:
            score = None
            if item.get("report"):
                score = item["report"].get("overall_score")
                
            candidate = db["candidates"].find_one({"_id": item["candidate_id"]})
            job = db["jobs"].find_one({"_id": item["job_id"]})
            
            created_at_val = item.get("created_at")
            interviews_list.append({
                "id": item["_id"],
                "status": item["status"],
                "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None,
                "candidate": {
                    "id": candidate["_id"] if candidate else None,
                    "name": candidate["name"] if candidate else "N/A",
                    "email": candidate.get("email", "N/A")
                } if candidate else None,
                "job": {
                    "id": job["_id"] if job else None,
                    "role": job["role"] if job else "N/A"
                } if job else None,
                "score": score
            })
            
        return {
            "success": True,
            "interviews": interviews_list
        }
    except Exception as e:
        logger.error(f"Error listing interviews: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"Failed to list interviews: {str(e)}"
        }

@router.get("/{interview_id}")
async def get_interview(interview_id: int, db = Depends(get_db)):
    """
    Retrieves the status, candidate/job references, and transcripts of an interview.
    """
    logger.info(f"Retrieving interview details for ID: {interview_id}")
    interview = db["interviews"].find_one({"_id": interview_id})
    
    if not interview:
        raise EntityNotFoundError(message=f"Interview with ID {interview_id} not found")
        
    candidate = db["candidates"].find_one({"_id": interview["candidate_id"]})
    job = db["jobs"].find_one({"_id": interview["job_id"]})
    
    transcript_data = []
    
    if interview.get("transcript"):
        t = interview["transcript"]
        if t.get("diarized_segments"):
            transcript_data = t["diarized_segments"]
        elif t.get("raw_text"):
            transcript_data = [
                {
                    "speaker": "Raw Transcript",
                    "text": t["raw_text"],
                    "timestamp": "00:00"
                }
            ]
    else:
        # Mock dialogue data for skeleton return
        transcript_data = [
            {
                "speaker": "Interviewer",
                "text": "Tell me about your experience with FastAPI.",
                "timestamp": "00:10"
            },
            {
                "speaker": "Candidate",
                "text": "I have been building microservices with FastAPI for the past two years. I love its speed and automatic documentation features.",
                "timestamp": "00:15"
            }
        ]
        
    created_at_val = interview.get("created_at")
    return {
        "success": True,
        "interview": {
            "id": interview["_id"],
            "candidate": {
                "id": candidate["_id"] if candidate else None,
                "name": candidate["name"] if candidate else "N/A",
                "email": candidate.get("email", "N/A")
            } if candidate else None,
            "job": {
                "id": job["_id"] if job else None,
                "role": job["role"] if job else "N/A"
            } if job else None,
            "status": interview["status"],
            "audio_path": interview.get("audio_path"),
            "transcript": transcript_data,
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None
        }
    }
