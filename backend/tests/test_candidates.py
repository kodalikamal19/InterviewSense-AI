import io
from datetime import datetime

def test_list_candidates(client, db):
    """
    Tests querying candidates list via HTTP GET.
    """
    # Direct MongoDB seed
    db["candidates"].insert_one({
        "_id": 1,
        "name": "Bob Programmer",
        "email": "bob@example.com",
        "created_at": datetime.utcnow()
    })
    
    # Query candidates list
    response = client.get("/api/candidates")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["candidates"]) >= 1
    
    names = [c["name"] for c in data["candidates"]]
    assert "Bob Programmer" in names

def test_get_candidate_by_id(client, db):
    """
    Tests querying single candidate profile details.
    """
    # Direct MongoDB seed
    db["candidates"].insert_one({
        "_id": 2,
        "name": "Charlie Coder",
        "email": "charlie@example.com",
        "created_at": datetime.utcnow()
    })
    
    response = client.get("/api/candidates/2")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["candidate"]["name"] == "Charlie Coder"
    assert data["candidate"]["email"] == "charlie@example.com"

def test_upload_resume_api(client):
    """
    Tests upload resume endpoint with name Form parameters and file uploads.
    """
    file_content = b"Candidate Name: Alice Developer\nSkills: FastAPI, NextJS, Python"
    file_bytes = io.BytesIO(file_content)
    
    response = client.post(
        "/api/candidates/upload-resume",
        data={"name": "Alice Developer"},
        files={"file": ("resume.pdf", file_bytes, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["candidate"]["name"] == "Alice Developer"
    assert "resume_id" in data["candidate"]
