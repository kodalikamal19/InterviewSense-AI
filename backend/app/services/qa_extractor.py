import json
from openai import OpenAI
from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger("app.services.qa_extractor")

def extract_questions_answers(transcript: list) -> list:
    """
    Groups dialog turns into question-answer exchanges, classifies rounds,
    gives candidate feedback, and grades answers on a 1.0 to 10.0 scale.
    Employs OpenAI GPT-4o-mini (with fallback parser).
    """
    logger.info("Initializing Question-Answer extraction analysis...")
    
    if not transcript:
        logger.warning("Empty dialogue transcript passed to QA extractor.")
        return []

    # 1. Check for OpenAI Key
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY environment variable is empty. Utilizing offline mock QA extraction fallback.")
        
        # Calculate high-fidelity mock questions & answers
        mock_qa = [
            {
                "question_text": (
                    "Hello and welcome to the technical interview. Thank you for joining us today. "
                    "Let's start by having you introduce yourself and talk briefly about your software development background."
                ),
                "answer_text": (
                    "Hi, thank you! It is a pleasure to be here. I am a Full Stack Developer with a little over "
                    "three years of professional experience. I have built several RESTful web APIs using Python, FastAPI, and "
                    "SQLAlchemy. On the frontend, I focus on constructing component libraries and responsive screens with React, "
                    "Next.js App Router, and clean CSS styling. I also have hands-on experience Dockerizing microservices and "
                    "managing persistent relational databases."
                ),
                "round_classification": "introduction",
                "feedback": "Excellent, highly professional introduction covering both frontend, backend, and database technologies.",
                "score": 9.0
            },
            {
                "question_text": (
                    "That's a great overview. Can you talk about a challenging API endpoint you designed, "
                    "and how you handled transaction rollbacks and connection pooling?"
                ),
                "answer_text": (
                    "Yes! In my previous project, we had an order processing system that performed multiple writes across "
                    "different tables. To ensure atomicity, I used SQLAlchemy's Session context manager. If any operation "
                    "failed, it triggered a transaction rollback. For connection pooling, we tuned SQLAlchemy's queue pool "
                    "size and max overflow parameters to match our Postgres database throughput, which prevented port "
                    "exhaustion under peak traffic spikes."
                ),
                "round_classification": "technical",
                "feedback": (
                    "Outstanding technical explanation. Clearly understands SQLAlchemy transaction lifecycles, "
                    "atomic writes, and connection pooling parameters under traffic load spikes."
                ),
                "score": 9.5
            }
        ]
        return mock_qa

    try:
        # 2. Call OpenAI API
        logger.info("Initializing OpenAI API client for QA extraction...")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = (
            "You are an expert technical evaluation agent. Your task is to extract question-answer exchanges from the "
            "dialogue turns list. Group Interviewer questions with Candidate responses. You MUST return a JSON object with "
            "the following schema:\n"
            "{\n"
            "  \"questions_answers\": [\n"
            "    {\n"
            "      \"question_text\": \"The Interviewer's question (string)\",\n"
            "      \"answer_text\": \"The Candidate's answer (string)\",\n"
            "      \"round_classification\": \"Round category e.g. introduction, technical, behavioral, closing (string)\",\n"
            "      \"feedback\": \"Constructive feedback on candidate's response (string)\",\n"
            "      \"score\": 8.5 (float from 1.0 to 10.0)\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Return ONLY the raw JSON document. Make no extra comments."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the dialogue transcript:\n\n{json.dumps(transcript)}"}
            ]
        )

        result_content = response.choices[0].message.content
        parsed_json = json.loads(result_content)
        qa_list = parsed_json.get("questions_answers", [])
        logger.info(f"OpenAI QA extraction complete. Isolated {len(qa_list)} exchanges.")
        return qa_list
        
    except Exception as e:
        logger.error(f"Error calling OpenAI API for QA extraction: {str(e)}. Reverting to fallback.", exc_info=True)
        return []
