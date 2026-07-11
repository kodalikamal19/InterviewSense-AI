from datetime import datetime

def test_get_report_endpoints(client, db):
    """
    Creates a full mock assessment layout inside MongoDB and checks reports endpoints.
    """
    # 1. Populate database records
    db["candidates"].insert_one({
        "_id": 1,
        "name": "Test Candidate",
        "email": "test@candidate.com",
        "created_at": datetime.utcnow()
    })
    
    db["jobs"].insert_one({
        "_id": 1,
        "role": "Python Developer",
        "parsed_skills": {"required": ["FastAPI"], "preferred": []},
        "parsed_requirements": {"experience": "2 years", "responsibilities": []},
        "created_at": datetime.utcnow()
    })
    
    report_doc = {
        "id": 1,
        "overall_score": 9.0,
        "summary_evaluation": "Excellent candidate performance.",
        "strengths": ["FastAPI skills"],
        "weaknesses": ["None"],
        "resume_consistency_status": "Consistent",
        "resume_consistency_details": "Aligns perfectly",
        "communication_metrics": {"wpm": 120, "filler_words_count": 2, "grammar_score": "10/10"},
        "created_at": datetime.utcnow()
    }
    
    db["interviews"].insert_one({
        "_id": 1,
        "candidate_id": 1,
        "job_id": 1,
        "status": "analyzed",
        "report": report_doc,
        "created_at": datetime.utcnow()
    })
    
    # 2. Test get report by interview ID
    res1 = client.get("/api/reports/interview/1")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    assert data1["report"]["score"] == 9.0
    assert data1["report"]["candidate_name"] == "Test Candidate"
    assert data1["report"]["resume_consistency_status"] == "Consistent"
    assert data1["report"]["communication_metrics"]["wpm"] == 120
    
    # 3. Test get report by report ID
    res2 = client.get("/api/reports/1")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert data2["report"]["id"] == 1
    
    # 4. Test download report PDF (ReportLab validation)
    res3 = client.get("/api/reports/1/download")
    assert res3.status_code == 200
    assert res3.headers["content-type"] == "application/pdf"
    assert len(res3.content) > 1000 # Verify PDF compiled binary bytes are streamed
