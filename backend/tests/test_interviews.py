from datetime import datetime

def test_interview_workflows(client, db):
    """
    Tests creating, retrieving, listing, and query statistics of interview sessions.
    """
    # 1. Populate prerequisites in MongoDB
    db["candidates"].insert_one({
        "_id": 1,
        "name": "Dev Tester",
        "email": "dev@tester.com",
        "created_at": datetime.utcnow()
    })
    
    db["jobs"].insert_one({
        "_id": 1,
        "role": "Go Developer",
        "parsed_skills": {"required": ["Go"], "preferred": []},
        "parsed_requirements": {"experience": "3 years", "responsibilities": []},
        "created_at": datetime.utcnow()
    })
    
    # 2. Test create interview via Form parameters
    create_res = client.post(
        "/api/interviews/create",
        data={"candidate_id": 1, "job_id": 1}
    )
    assert create_res.status_code == 200
    create_data = create_res.json()
    assert create_data["success"] is True
    assert create_data["interview"]["status"] == "created"
    interview_id = create_data["interview"]["id"]
    
    # 3. Test list interviews GET route
    list_res = client.get("/api/interviews")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["success"] is True
    assert len(list_data["interviews"]) >= 1
    
    # 4. Test query interview details GET route
    detail_res = client.get(f"/api/interviews/{interview_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["success"] is True
    assert detail_data["interview"]["id"] == interview_id
    assert detail_data["interview"]["candidate"]["name"] == "Dev Tester"
    
    # 5. Test stats queries endpoint
    stats_res = client.get("/api/interviews/stats")
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["success"] is True
    assert stats_data["stats"]["candidates"] >= 1
    assert stats_data["stats"]["jobs"] >= 1
    assert stats_data["stats"]["interviews"] >= 1
