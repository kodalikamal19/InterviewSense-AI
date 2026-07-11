# REST API Documentation

This guide describes all REST API routes, request payloads, and structured JSON return formats exposed by the FastAPI backend server.

---

## 1. Candidate APIs

### Upload and Parse Resume
- **Route**: `POST /api/candidates/upload-resume`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `name`: string (e.g. "Alice Developer")
  - `file`: File upload (.pdf, .docx)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Resume uploaded and parsed successfully",
    "candidate": {
      "id": 1,
      "name": "Alice Developer",
      "email": "alice@example.com",
      "resume_id": 1,
      "parsed_data": {
        "skills": ["Python", "FastAPI"],
        "experience": {"summary": "2 years developing APIs", "projects": []},
        "education": "BS Computer Science"
      }
    }
  }
  ```

### List Candidates
- **Route**: `GET /api/candidates`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "candidates": [
      {
        "id": 1,
        "name": "Alice Developer",
        "email": "alice@example.com",
        "has_resume": true
      }
    ]
  }
  ```

---

## 2. Job APIs

### Upload and Parse Job Description
- **Route**: `POST /api/jobs/upload`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: File upload (.txt, .pdf, .docx)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Job Description uploaded and parsed successfully",
    "job": {
      "id": 1,
      "role": "Python Developer",
      "skills": ["Python", "FastAPI"],
      "requirements": ["2+ years experience"]
    }
  }
  ```

---

## 3. Interview APIs

### Create Interview Slot
- **Route**: `POST /api/interviews/create`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Request Body**:
  - `candidate_id`: integer
  - `job_id`: integer
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Interview session created successfully",
    "interview": {
      "id": 1,
      "candidate_id": 1,
      "job_id": 1,
      "status": "created"
    }
  }
  ```

### Upload Live Recording Audio
- **Route**: `POST /api/interviews/{id}/upload-audio`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: File upload (.wav, .mp3, .webm)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Interview audio uploaded successfully",
    "interview_id": 1,
    "status": "recorded"
  }
  ```

### Trigger Background Analysis
- **Route**: `POST /api/interviews/{id}/analyze`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "AI analysis task scheduled in background",
    "interview_id": 1,
    "status": "analyzing"
  }
  ```

### Dashboard Statistics
- **Route**: `GET /api/interviews/stats`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "stats": {
      "candidates": 12,
      "jobs": 4,
      "interviews": 15,
      "avg_score": 8.2
    }
  }
  ```

---

## 4. Evaluation Report APIs

### Query Report by Interview ID
- **Route**: `GET /api/reports/interview/{interview_id}`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "report": {
      "id": 1,
      "score": 8.5,
      "recommendation": "Strong Hire",
      "summary": "AI performance summary description...",
      "strengths": ["FastAPI expert"],
      "weaknesses": ["Basic AWS Orchestration"],
      "resume_consistency_status": "Consistent",
      "resume_consistency_details": "Dialogue claims align with resume logs.",
      "communication_metrics": {"wpm": 135, "filler_words_count": 4, "grammar_score": "9/10"}
    }
  }
  ```

### Download Compiled PDF Report
- **Route**: `GET /api/reports/{id}/download`
- **Response (200 OK)**: Streams raw binary application/pdf attachment.
