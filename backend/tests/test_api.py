import os
import tempfile
from pathlib import Path

# Use an isolated test database before importing the app.
_tmp = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp.name) / 'test.db'}"

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def sample():
    return {"customer_name": "Alex Example", "email": "alex@example.com", "loan_type": "Home Loan", "amount": 450000, "notes": "Fictional sample"}

def test_create_list_search_and_update(client, sample):
    created = client.post("/api/enquiries", json=sample)
    assert created.status_code == 201
    item = created.json()
    assert item["status"] == "New"
    assert any(e["id"] == item["id"] for e in client.get("/api/enquiries?search=alex").json())
    assert not any(e["id"] == item["id"] for e in client.get("/api/enquiries?search=nomatch").json())
    changed = client.patch(f"/api/enquiries/{item['id']}/status", json={"status": "Contacted"})
    assert changed.status_code == 200
    assert changed.json()["status"] == "Contacted"

def test_validation_and_missing_record(client, sample):
    assert client.post("/api/enquiries", json={**sample, "amount": -1}).status_code == 422
    assert client.post("/api/enquiries", json={**sample, "email": "not-an-email"}).status_code == 422
    assert client.patch("/api/enquiries/999999/status", json={"status": "Approved"}).status_code == 404
    assert client.patch("/api/enquiries/999999/status", json={"status": "Unknown"}).status_code == 422
