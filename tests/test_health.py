"""
tests/test_health.py — Phase 1
Verifies that GET /api/health returns {"status": "online"}.
"""
import sys
import os

# Allow running from the backend/ directory or from the repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_status_online():
    """Health endpoint must return status: online."""
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "online"


def test_health_has_atlas_loaded_field():
    """Health endpoint must include atlasLoaded boolean field."""
    response = client.get("/api/health")
    body = response.json()
    assert "atlasLoaded" in body
    assert isinstance(body["atlasLoaded"], bool)

