import io
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
from app.database.connection import get_db
from app.utils.logger import get_logger
from app.services.pdf_generator import generate_report_pdf

logger = get_logger("app.api.reports")
router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
async def list_reports(db = Depends(get_db)):
    """
    Retrieves list of all generated database interview evaluation reports.
    """
    logger.info("Listing all generated database reports")
    
    interviews = list(db["interviews"].find({"report": {"$exists": True}}).sort("_id", -1))
    
    reports_list = []
    for item in interviews:
        r = item["report"]
        candidate = db["candidates"].find_one({"_id": item["candidate_id"]})
        job = db["jobs"].find_one({"_id": item["job_id"]})
        
        candidate_name = candidate["name"] if candidate else "N/A"
        role_title = job["role"] if job else "N/A"
        
        created_at_val = r.get("created_at")
        reports_list.append({
            "id": r["id"],
            "interview_id": item["_id"],
            "candidate_name": candidate_name,
            "role_title": role_title,
            "score": r.get("overall_score"),
            "recommendation": r.get("recommendation") or ("Strong Hire" if (r.get("overall_score") or 0) >= 8.0 else "Hire" if (r.get("overall_score") or 0) >= 6.0 else "No Hire"),
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None
        })
        
    return {
        "success": True,
        "reports": reports_list
    }

@router.get("/interview/{interview_id}")
async def get_report_by_interview(interview_id: int, db = Depends(get_db)):
    """
    Retrieves full evaluation report content and Q&A list for a given interview ID.
    """
    logger.info(f"Retrieving database report for Interview ID: {interview_id}")
    
    interview = db["interviews"].find_one({"_id": interview_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    report = interview.get("report")
    if not report:
        raise HTTPException(status_code=404, detail="Evaluation report not found yet for this interview")
        
    candidate = db["candidates"].find_one({"_id": interview["candidate_id"]})
    job = db["jobs"].find_one({"_id": interview["job_id"]})
    
    qa_records = interview.get("questions_answers", [])
    
    return {
        "success": True,
        "report": {
            "id": report["id"],
            "interview_id": interview["_id"],
            "candidate_name": candidate["name"] if candidate else "N/A",
            "candidate_email": candidate.get("email", "N/A") if candidate else "N/A",
            "role_title": job["role"] if job else "N/A",
            "score": report.get("overall_score"),
            "recommendation": report.get("recommendation") or ("Strong Hire" if (report.get("overall_score") or 0) >= 8.0 else "Hire" if (report.get("overall_score") or 0) >= 6.0 else "No Hire"),
            "summary": report.get("summary_evaluation"),
            "strengths": report.get("strengths") or [],
            "weaknesses": report.get("weaknesses") or [],
            "resume_consistency_status": report.get("resume_consistency_status"),
            "resume_consistency_details": report.get("resume_consistency_details"),
            "communication_metrics": report.get("communication_metrics") or {"wpm": 0, "filler_words_count": 0, "grammar_score": "N/A"},
            "questions_answers": [
                {
                    "id": qa.get("id"),
                    "question_text": qa.get("question_text"),
                    "answer_text": qa.get("answer_text"),
                    "round_classification": qa.get("round_classification"),
                    "score": qa.get("score"),
                    "feedback": qa.get("feedback")
                }
                for qa in qa_records
            ]
        }
    }

@router.get("/{report_id}")
async def get_report(report_id: int, db = Depends(get_db)):
    """
    Retrieves full evaluation report content and Q&A list by Report ID.
    """
    logger.info(f"Retrieving database report for Report ID: {report_id}")
    
    interview = db["interviews"].find_one({"report.id": report_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Evaluation report not found")
        
    report = interview["report"]
    candidate = db["candidates"].find_one({"_id": interview["candidate_id"]})
    job = db["jobs"].find_one({"_id": interview["job_id"]})
    
    qa_records = interview.get("questions_answers", [])
    
    return {
        "success": True,
        "report": {
            "id": report["id"],
            "interview_id": interview["_id"],
            "candidate_name": candidate["name"] if candidate else "N/A",
            "candidate_email": candidate.get("email", "N/A") if candidate else "N/A",
            "role_title": job["role"] if job else "N/A",
            "score": report.get("overall_score"),
            "recommendation": report.get("recommendation") or ("Strong Hire" if (report.get("overall_score") or 0) >= 8.0 else "Hire" if (report.get("overall_score") or 0) >= 6.0 else "No Hire"),
            "summary": report.get("summary_evaluation"),
            "strengths": report.get("strengths") or [],
            "weaknesses": report.get("weaknesses") or [],
            "resume_consistency_status": report.get("resume_consistency_status"),
            "resume_consistency_details": report.get("resume_consistency_details"),
            "communication_metrics": report.get("communication_metrics") or {"wpm": 0, "filler_words_count": 0, "grammar_score": "N/A"},
            "questions_answers": [
                {
                    "id": qa.get("id"),
                    "question_text": qa.get("question_text"),
                    "answer_text": qa.get("answer_text"),
                    "round_classification": qa.get("round_classification"),
                    "score": qa.get("score"),
                    "feedback": qa.get("feedback")
                }
                for qa in qa_records
            ]
        }
    }

@router.get("/{report_id}/download")
async def download_report_pdf(report_id: int, db = Depends(get_db)):
    """
    Downloads the evaluation report as a dynamic ReportLab PDF compiled in-memory.
    """
    logger.info(f"Report download requested for Report ID: {report_id}")
    
    interview = db["interviews"].find_one({"report.id": report_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Evaluation report not found")
        
    report = interview["report"]
    candidate = db["candidates"].find_one({"_id": interview["candidate_id"]})
    job = db["jobs"].find_one({"_id": interview["job_id"]})
    
    qa_records = interview.get("questions_answers", [])
    
    # Format payload
    report_data = {
        "candidate_name": candidate["name"] if candidate else "N/A",
        "candidate_email": candidate.get("email", "N/A") if candidate else "N/A",
        "role_title": job["role"] if job else "N/A",
        "score": report.get("overall_score"),
        "recommendation": report.get("recommendation") or ("Strong Hire" if (report.get("overall_score") or 0) >= 8.0 else "Hire" if (report.get("overall_score") or 0) >= 6.0 else "No Hire"),
        "summary": report.get("summary_evaluation"),
        "strengths": report.get("strengths") or [],
        "weaknesses": report.get("weaknesses") or [],
        "resume_consistency_status": report.get("resume_consistency_status"),
        "resume_consistency_details": report.get("resume_consistency_details"),
        "communication_metrics": report.get("communication_metrics") or {"wpm": 0, "filler_words_count": 0, "grammar_score": "N/A"},
        "questions_answers": [
            {
                "round_classification": qa.get("round_classification"),
                "score": qa.get("score"),
                "question_text": qa.get("question_text"),
                "answer_text": qa.get("answer_text"),
                "feedback": qa.get("feedback")
            }
            for qa in qa_records
        ]
    }
    
    try:
        pdf_bytes = generate_report_pdf(report_data)
    except Exception as e:
        logger.error(f"Failed to generate report PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
        
    headers = {
        'Content-Disposition': f'attachment; filename="interview_report_{report_id}.pdf"'
    }
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
