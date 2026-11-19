"""
tests/test_quiz.py — Phase 5 Backend Tests
Validates:
1. generate_questions returns exactly 5 questions
2. Categories cover all 5 required domains (lobe, hemisphere, plane, meaning, volume)
3. Each question has exactly 4 options and a valid correct_index
4. Correct option matches correct_index in each question
5. GET /api/quiz?caseId=demo-brats-001 endpoint returns 200 and matches JSON schema
6. GET /api/quiz with invalid caseId returns 404
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from modules.tumor_location import TumorLocation
from modules.quiz_generator import generate_questions

client = TestClient(app)


@pytest.fixture
def sample_location():
    return TumorLocation(
        region_name="Frontal Pole",
        region_probability=0.85,
        hemisphere="Left",
        primary_plane="Axial",
        mni_coords=(-14.2, 33.1, 48.5),
        volume_cm3=23.4,
        nearby_structures=["Motor Cortex", "Broca's Area", "Internal Capsule"],
    )


def test_generate_questions_count_and_categories(sample_location):
    """Ensure exactly 5 questions are generated covering each category."""
    questions = generate_questions(sample_location)
    assert len(questions) == 5

    categories = [q.category for q in questions]
    expected_categories = ["lobe", "hemisphere", "plane", "meaning", "volume"]
    assert set(categories) == set(expected_categories)


def test_questions_options_and_correct_index(sample_location):
    """Ensure each question has 4 options and valid correct index."""
    questions = generate_questions(sample_location)
    for q in questions:
        assert len(q.options) == 4
        assert 0 <= q.correct_index < 4
        assert len(set(q.options)) == 4, f"Options in Q{q.id} must be unique"
        # Option at correct_index must be a non-empty string
        assert isinstance(q.options[q.correct_index], str)
        assert len(q.options[q.correct_index].strip()) > 0
        assert len(q.explanation.strip()) > 0


def test_grounded_answers_traceability(sample_location):
    """Validate answers are directly traceable to sample_location attributes."""
    questions = generate_questions(sample_location)
    q_dict = {q.category: q for q in questions}

    # Lobe question correct answer
    assert "Frontal Lobe" in q_dict["lobe"].options[q_dict["lobe"].correct_index]

    # Hemisphere question correct answer
    assert "Left Hemisphere" in q_dict["hemisphere"].options[q_dict["hemisphere"].correct_index]

    # Plane question correct answer
    assert "Axial" in q_dict["plane"].options[q_dict["plane"].correct_index]

    # Volume question correct answer
    assert "23.4" in q_dict["volume"].options[q_dict["volume"].correct_index]


def test_api_quiz_endpoint_demo_case():
    """GET /api/quiz?caseId=demo-brats-001 returns HTTP 200 and 5 valid questions."""
    resp = client.get("/api/quiz?caseId=demo-brats-001")
    assert resp.status_code == 200
    data = resp.json()

    assert "questions" in data
    assert len(data["questions"]) == 5

    for q in data["questions"]:
        assert "id" in q
        assert "category" in q
        assert "stem" in q
        assert "options" in q
        assert "correctIndex" in q
        assert "explanation" in q
        assert len(q["options"]) == 4
        assert 0 <= q["correctIndex"] < 4


def test_api_quiz_endpoint_not_found():
    """GET /api/quiz with invalid caseId returns 404."""
    resp = client.get("/api/quiz?caseId=non-existent-case-id-123")
    assert resp.status_code == 404

