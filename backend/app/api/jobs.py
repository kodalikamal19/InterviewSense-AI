from fastapi import APIRouter, UploadFile, File, Form, Depends
from datetime import datetime
from app.database.connection import get_db, get_next_sequence_value
from app.services.jd_parser import parse_jd
from app.utils.file_helper import save_uploaded_file, ALLOWED_RESUME_EXTENSIONS
from app.utils.exceptions import EntityNotFoundError, InvalidFileError
from app.utils.logger import get_logger

logger = get_logger("app.api.jobs")
router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/upload-jd")
async def upload_jd(
    role: str = Form(..., description="The title/role of the job"),
    file: UploadFile = File(..., description="Job Description document (PDF or DOCX)"),
    db = Depends(get_db)
):
    """
    Endpoint to upload and parse a Job Description, saving details to MongoDB.
    """
    logger.info(f"Received Job Description upload request for Role: {role}, File: {file.filename}")
    
    # 1. Save the file to local uploads directory
    saved_path = save_uploaded_file(file, "jds", ALLOWED_RESUME_EXTENSIONS)
    
    # 2. Parse JD text (AI or regex fallback)
    parsed_data = parse_jd(saved_path)
    
    try:
        # 3. Create the Job database record
        skills_payload = {
            "required": parsed_data.get("required_skills", []),
            "preferred": parsed_data.get("preferred_skills", [])
        }
        
        requirements_payload = {
            "experience": parsed_data.get("experience", ""),
            "responsibilities": parsed_data.get("responsibilities", [])
        }
        
        job_id = get_next_sequence_value("jobs")
        job_doc = {
            "_id": job_id,
            "role": role,
            "raw_jd_path": saved_path,
            "parsed_skills": skills_payload,
            "parsed_requirements": requirements_payload,
            "created_at": datetime.utcnow()
        }
        
        db["jobs"].insert_one(job_doc)
        logger.info(f"Successfully saved Job Description record to DB. Job ID: {job_id}")
        
        return {
            "success": True,
            "message": "Job Description uploaded and parsed successfully",
            "job": {
                "id": job_id,
                "role": role,
                "jd_path": saved_path,
                "parsed_data": {
                    "required_skills": skills_payload["required"],
                    "preferred_skills": skills_payload["preferred"],
                    "experience": requirements_payload["experience"],
                    "responsibilities": requirements_payload["responsibilities"]
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to save Job {role} to MongoDB: {str(e)}", exc_info=True)
        raise InvalidFileError(message=f"Database transaction failed: {str(e)}")

@router.get("")
async def list_jobs(db = Depends(get_db)):
    """
    Retrieves all jobs from the database.
    """
    logger.info("Listing all database jobs")
    jobs = list(db["jobs"].find().sort("_id", -1))
    
    result_list = []
    for j in jobs:
        created_at_val = j.get("created_at")
        result_list.append({
            "id": j["_id"],
            "role": j["role"],
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None
        })
        
    return {
        "success": True,
        "jobs": result_list
    }

@router.get("/{job_id}")
async def get_job(job_id: int, db = Depends(get_db)):
    """
    Retrieves a single job and its parsed requirements details by job ID.
    """
    logger.info(f"Retrieving job details for ID: {job_id}")
    job = db["jobs"].find_one({"_id": job_id})
    
    if not job:
        logger.warning(f"Job ID {job_id} not found in database.")
        raise EntityNotFoundError(message=f"Job description with ID {job_id} not found")
        
    created_at_val = job.get("created_at")
    skills = job.get("parsed_skills", {})
    reqs = job.get("parsed_requirements", {})
    
    return {
        "success": True,
        "job": {
            "id": job["_id"],
            "role": job["role"],
            "jd_path": job["raw_jd_path"],
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val) if created_at_val else None,
            "parsed_data": {
                "required_skills": skills.get("required", []),
                "preferred_skills": skills.get("preferred", []),
                "experience": reqs.get("experience", ""),
                "responsibilities": reqs.get("responsibilities", [])
            }
        }
    }
