"""
tests/test_location.py — Phase 4 Backend Tests
Validates:
1. determine_hemisphere: X < 0 -> Left, X > 0 -> Right, |X| <= 5 -> Midline
2. determine_primary_plane: axial vs sagittal vs coronal
3. query_atlas: known frontal coordinate returns cortical / frontal label
4. find_nearby_structures: returns nearby structures or ['Not Mapped']
5. GET /api/location endpoint via FastAPI TestClient
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient

from main import app
from modules.tumor_location import (
    determine_hemisphere,
    determine_primary_plane,
    derive_location,
    register_to_mni,
)
from modules.atlas_mapping import (
    query_atlas,
    find_nearby_structures,
    AtlasHit,
)

client = TestClient(app)


def test_hemisphere_derivation():
    """X < -5 -> Left, X > +5 -> Right, within [-5, 5] -> Midline."""
    assert determine_hemisphere(-14.2) == "Left"
    assert determine_hemisphere(-35.0) == "Left"
    assert determine_hemisphere(25.0) == "Right"
    assert determine_hemisphere(48.5) == "Right"
    assert determine_hemisphere(0.0) == "Midline"
    assert determine_hemisphere(2.5) == "Midline"
    assert determine_hemisphere(-3.0) == "Midline"


def test_known_frontal_mni_coordinate_returns_frontal_label():
    """Known frontal lobe coordinates (-40, 30, 38) should return Middle Frontal Gyrus or Frontal area."""
    hits = query_atlas((-40.0, 30.0, 38.0), min_prob_threshold=0.25)
    assert len(hits) > 0
    hit_names = [h.region_name for h in hits]
    # Hits should include Middle Frontal Gyrus or Cerebral Cortex
    assert any("Frontal" in name or "Cortex" in name for name in hit_names)


def test_out_of_bounds_nearby_structures():
    """Far out of bounds coordinates should return ['Not Mapped']."""
    nearby = find_nearby_structures((500.0, 500.0, 500.0), radius_mm=10.0)
    assert nearby == ["Not Mapped"]


def test_primary_plane_axial_coronal_sagittal():
    """Validate primary plane detects the longest axis of tumor extent."""
    # Axial dominant (Z dimension largest)
    mask_axial = np.zeros((20, 20, 50), dtype=np.uint8)
    mask_axial[5:15, 5:15, 5:45] = 1
    assert determine_primary_plane(mask_axial) == "Axial"

    # Coronal dominant (Y dimension largest)
    mask_coronal = np.zeros((20, 60, 20), dtype=np.uint8)
    mask_coronal[5:15, 5:55, 5:15] = 1
    assert determine_primary_plane(mask_coronal) == "Coronal"

    # Sagittal dominant (X dimension largest)
    mask_sagittal = np.zeros((60, 20, 20), dtype=np.uint8)
    mask_sagittal[5:55, 5:15, 5:15] = 1
    assert determine_primary_plane(mask_sagittal) == "Sagittal"


def test_derive_location_structure():
    """derive_location returns a complete TumorLocation dataclass."""
    dummy_mask = np.zeros((30, 30, 30), dtype=np.uint8)
    dummy_mask[10:20, 10:20, 10:20] = 1
    affine = np.diag([1.0, 1.0, 1.0, 1.0])

    loc = derive_location(
        centroid_mm=(15.0, 15.0, 15.0),
        affine=affine,
        mask_data=dummy_mask,
        spacing=(1.0, 1.0, 1.0),
    )
    assert loc.region_name is not None
    assert isinstance(loc.region_probability, float)
    assert loc.hemisphere in ["Left", "Right", "Midline"]
    assert loc.primary_plane in ["Axial", "Coronal", "Sagittal"]
    assert len(loc.mni_coords) == 3
    assert loc.volume_cm3 > 0
    assert isinstance(loc.nearby_structures, list)


def test_api_location_endpoint_demo_case():
    """GET /api/location?caseId=demo-brats-001 returns correct JSON schema."""
    resp = client.get("/api/location?caseId=demo-brats-001")
    assert resp.status_code == 200
    data = resp.json()

    assert "regionName" in data
    assert "regionProbability" in data
    assert "hemisphere" in data
    assert "primaryPlane" in data
    assert "mniCoords" in data
    assert "volumeCm3" in data
    assert "nearbyStructures" in data

    assert data["hemisphere"] in ["Left", "Right", "Midline"]
    assert data["primaryPlane"] in ["Axial", "Coronal", "Sagittal"]
    assert len(data["mniCoords"]) == 3
    assert isinstance(data["nearbyStructures"], list)
    assert data["volumeCm3"] > 0


def test_api_location_endpoint_not_found():
    """GET /api/location with invalid caseId returns 404."""
    resp = client.get("/api/location?caseId=non-existent-case-id-12345")
    assert resp.status_code == 404

