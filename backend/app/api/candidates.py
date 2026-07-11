from fastapi import APIRouter, UploadFile, File, Form, Depends
from datetime import datetime
from app.database.connection import get_db, get_next_sequence_value
from app.services.resume_parser import parse_resume
from app.utils.file_helper import save_uploaded_file, ALLOWED_RESUME_EXTENSIONS
from app.utils.exceptions import EntityNotFoundError, InvalidFileError
from app.utils.logger import get_logger

logger = get_logger("app.api.candidates")
router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("/upload-resume")
async def upload_resume(
    name: str = Form(..., description="The name of the candidate"),
    file: UploadFile = File(..., description="Resume PDF or DOCX file"),
    db = Depends(get_db)
):
    """
    Endpoint to upload and parse a candidate's resume, saving candidate and resume records to MongoDB.
    """
    logger.info(f"Received resume upload request for Candidate: {name}, File: {file.filename}")
    
    # 1. Save the file to local upload directory
    saved_path = save_uploaded_file(file, "resumes", ALLOWED_RESUME_EXTENSIONS)
    
    # 2. Parse the resume (AI or regex fallback)
    parsed_data = parse_resume(saved_path)
    
    try:
        email = parsed_data.get("email")
        candidate = None
        if email:
            candidate = db["candidates"].find_one({"email": email})
            
        experience_payload = {
            "summary": parsed_data.get("experience"),
            "projects": parsed_data.get("projects", []),
            "certifications": parsed_data.get("certifications", [])
        }
        
        resume_id = get_next_sequence_value("resumes")
        resume_doc = {
            "id": resume_id,
            "file_path": saved_path,
            "parsed_skills": parsed_data.get("skills", []),
            "parsed_experience": experience_payload,
            "parsed_education": parsed_data.get("education", "")
        }
        
        if candidate:
            logger.info(f"Candidate with email {email} already exists. Updating name and resume.")
            db["candidates"].update_one(
                {"_id": candidate["_id"]},
                {
                    "$set": {
                        "name": name,
                        "resume": resume_doc
                    }
                }
            )
            candidate_id = candidate["_id"]
        else:
            candidate_id = get_next_sequence_value("candidates")
            candidate_doc = {
                "_id": candidate_id,
                "name": name,
                "email": email,
                "created_at": datetime.utcnow(),
                "resume": resume_doc
            }
            db["candidates"].insert_one(candidate_doc)
            
        logger.info(f"Successfully saved candidate and resume record to DB. Candidate ID: {candidate_id}")
        
        return {
            "success": True,
            "message": "Resume uploaded and parsed successfully",
            "candidate": {
                "id": candidate_id,
                "name": name,
                "email": email,
                "resume_id": resume_id,
                "parsed_data": {
                    "skills": resume_doc["parsed_skills"],
                    "experience": resume_doc["parsed_experience"],
                    "education": resume_doc["parsed_education"]
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to commit database transaction for candidate {name}: {str(e)}", exc_info=True)
        raise InvalidFileError(message=f"Database transaction failed: {str(e)}")

@router.get("")
async def list_candidates(db = Depends(get_db)):
    """
    Retrieves all candidates from the database.
    """
    logger.info("Listing all database candidates")
    candidates = list(db["candidates"].find().sort("_id", -1))
    
    result_list = []
    for c in candidates:
        created_at_val = c.get("created_at")
        result_list.append({
            "id": c["_id"],
            "name": c["name"],
            "email": c.get("email"),
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None,
            "has_resume": c.get("resume") is not None
        })
        
    return {
        "success": True,
        "candidates": result_list
    }

@router.get("/{candidate_id}")
async def get_candidate(candidate_id: int, db = Depends(get_db)):
    """
    Retrieves a single candidate and their parsed resume details by candidate ID.
    """
    logger.info(f"Retrieving candidate details for ID: {candidate_id}")
    candidate = db["candidates"].find_one({"_id": candidate_id})
    
    if not candidate:
        logger.warning(f"Candidate ID {candidate_id} not found in database.")
        raise EntityNotFoundError(message=f"Candidate with ID {candidate_id} not found")
        
    resume_data = None
    if candidate.get("resume"):
        r = candidate["resume"]
        resume_data = {
            "id": r.get("id"),
            "file_path": r.get("file_path"),
            "parsed_skills": r.get("parsed_skills"),
            "parsed_experience": r.get("parsed_experience"),
            "parsed_education": r.get("parsed_education")
        }
        
    created_at_val = candidate.get("created_at")
    return {
        "success": True,
        "candidate": {
            "id": candidate["_id"],
            "name": candidate["name"],
            "email": candidate.get("email"),
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None,
            "resume": resume_data
        }
    }
