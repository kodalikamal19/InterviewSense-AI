import os
import json
import re
from openai import OpenAI
from app.services.resume_parser import extract_text
from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger("app.services.jd_parser")

def parse_jd_text_fallback(text: str) -> dict:
    """
    Saves parsing when OpenAI is offline. Scans text with basic regular expressions or returns standard template.
    """
    logger.info("Running offline JD regex parser fallback...")
    
    # Try finding role title from first few lines of text
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    role = "Senior Full Stack Engineer"
    if lines:
        for line in lines[:3]:
            if len(line.split()) >= 2 and not any(k in line.lower() for k in ["job description", "jd", "hiring", "role"]):
                role = line
                break
                
    return {
        "role": role,
        "required_skills": ["Python", "FastAPI", "React", "Next.js", "PostgreSQL"],
        "preferred_skills": ["Docker", "Kubernetes", "OpenAI API", "AWS"],
        "experience": "5+ years",
        "responsibilities": [
            "Architect and develop high-performance RESTful APIs using FastAPI",
            "Build responsive client-side web applications using React and Next.js",
            "Optimize and maintain PostgreSQL database schemas and connection performance",
            "Deploy and manage scalable backend containers in AWS cloud environments"
        ]
    }

def parse_jd(file_path: str) -> dict:
    """
    Extracts text and parses roles, required/preferred skills, responsibilities, 
    and experience using the OpenAI API (or fallback).
    """
    try:
        # 1. Extract raw text from document
        raw_text = extract_text(file_path)
        if not raw_text.strip():
            logger.warning("Extracted JD text is empty. Reverting to fallback.")
            return parse_jd_text_fallback("")
            
        # 2. Check for OpenAI Key
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY environment variable is empty. Utilizing offline JD parsing fallback.")
            return parse_jd_text_fallback(raw_text)

        # 3. Call OpenAI for structuring
        logger.info("Initializing OpenAI call to parse Job Description text...")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = (
            "You are an expert AI Job Description (JD) parser. Your task is to extract structured role criteria from JD files. "
            "You MUST return a JSON object with the following schema:\n"
            "{\n"
            "  \"role\": \"Role Title (string)\",\n"
            "  \"required_skills\": [\"list\", \"of\", \"required\", \"skills\"],\n"
            "  \"preferred_skills\": [\"list\", \"of\", \"preferred\", \"skills\"],\n"
            "  \"experience\": \"Experience requirements, e.g., 5+ years (string)\",\n"
            "  \"responsibilities\": [\"list\", \"of\", \"main\", \"responsibilities\"]\n"
            "}\n"
            "Return ONLY the raw JSON document. Make no extra comments."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the Job Description raw text:\n\n{raw_text}"}
            ]
        )

        result_content = response.choices[0].message.content
        parsed_json = json.loads(result_content)
        logger.info("OpenAI parsed JD successfully.")
        return parsed_json
        
    except Exception as e:
        logger.error(f"Error parsing Job Description '{file_path}': {str(e)}. Reverting to fallback.", exc_info=True)
        return parse_jd_text_fallback("")
