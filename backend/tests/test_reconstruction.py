"""
tests/test_reconstruction.py — Phase 2
Validates:
1. extract_brain_surface returns non-empty vertex array
2. extract_tumor_surface returns fewer vertices than brain
3. Centroid is center-of-mass (not bounding-box midpoint)
4. Shape and affine mismatches raise 422
"""

import os
import sys
import numpy as np
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from modules.tumor_segmentation import (
    validate_mask,
    compute_centroid_mm,
    compute_volume_cm3,
)
from modules.reconstruction import extract_brain_surface, extract_tumor_surface

client = TestClient(app)


def test_centroid_is_center_of_mass_not_bounding_box():
    """
    Test that centroid is weighted center-of-mass and not simple bounding-box midpoint.
    Create an L-shaped or asymmetric cluster where center-of-mass differs from midpoint.
    """
    mask = np.zeros((20, 20, 20), dtype=np.uint8)
    # Bounding box is [2, 10] along axis 0 -> midpoint is (2+10)/2 = 6.0
    # Put 9 voxels at index 2 and only 1 voxel at index 10
    mask[2, 5, 5] = 1
    mask[2, 5, 6] = 1
    mask[2, 5, 7] = 1
    mask[2, 6, 5] = 1
    mask[2, 6, 6] = 1
    mask[2, 6, 7] = 1
    mask[2, 7, 5] = 1
    mask[2, 7, 6] = 1
    mask[2, 7, 7] = 1
    mask[10, 5, 5] = 1  # single voxel at far end

    affine = np.eye(4)
    centroid = compute_centroid_mm(mask, affine)

    # 10 voxels total: (9 * 2 + 1 * 10) / 10 = 28 / 10 = 2.8
    # Bounding-box midpoint would be (2 + 10) / 2 = 6.0
    assert abs(centroid[0] - 2.8) < 1e-2
    assert abs(centroid[0] - 6.0) > 2.0


def test_volume_calculation():
    """Test volume calculation: 1000 voxels of 1x1x1 mm spacing = 1.0 cm³."""
    mask = np.zeros((20, 20, 20), dtype=np.uint8)
    mask[:10, :10, :10] = 1  # 10 * 10 * 10 = 1000 voxels
    volume = compute_volume_cm3(mask, (1.0, 1.0, 1.0))
    assert volume == 1.0


def test_extract_surfaces_vertex_counts():
    """
    extract_brain_surface returns non-empty vertex array.
    extract_tumor_surface returns fewer vertices than brain.
    """
    # Synthetic brain: large sphere
    z, y, x = np.ogrid[:40, :40, :40]
    brain_vol = ((x - 20)**2 + (y - 20)**2 + (z - 20)**2 <= 15**2).astype(float) * 100.0

    # Synthetic tumor: small sphere inside
    tumor_mask = ((x - 25)**2 + (y - 20)**2 + (z - 20)**2 <= 4**2).astype(np.uint8)

    brain_mesh = extract_brain_surface(brain_vol, (1.0, 1.0, 1.0))
    tumor_mesh = extract_tumor_surface(tumor_mask, (1.0, 1.0, 1.0))

    assert len(brain_mesh["vertices"]) > 0
    assert len(tumor_mesh["vertices"]) > 0
    assert len(tumor_mesh["vertices"]) < len(brain_mesh["vertices"])


def test_geometry_validation_errors():
    """Mismatched shapes or affines must raise ValueError."""
    affine1 = np.eye(4)
    affine2 = np.eye(4)
    affine2[0, 3] = 50.0  # shifted origin

    # Shape mismatch
    with pytest.raises(ValueError, match="Shape mismatch"):
        validate_mask(affine1, affine1, (240, 240, 155), (120, 120, 80))

    # Affine mismatch
    with pytest.raises(ValueError, match="Affine matrix mismatch"):
        validate_mask(affine1, affine2, (240, 240, 155), (240, 240, 155))


def test_upload_and_reconstruct_endpoints():
    """
    End-to-end integration test with sample Decathlon BraTS files.
    """
    image_path = "/Users/saivardhany/Desktop/MINI PROJECT /data/images/BRATS_001.nii.gz"
    label_path = "/Users/saivardhany/Desktop/MINI PROJECT /data/labels/BRATS_001.nii.gz"

    if not os.path.exists(image_path) or not os.path.exists(label_path):
        pytest.skip("BraTS data not found")

    with open(image_path, "rb") as f_img, open(label_path, "rb") as f_lbl:
        upload_resp = client.post(
            "/api/upload",
            files={
                "mri_file": ("BRATS_001.nii.gz", f_img, "application/gzip"),
                "mask_file": ("BRATS_001.nii.gz", f_lbl, "application/gzip"),
            },
        )

    assert upload_resp.status_code == 200
    data = upload_resp.json()
    assert "caseId" in data
    assert data["mriShape"] == [240, 240, 155]
    assert data["volumeCm3"] > 0
    assert len(data["maskLabels"]) > 0
    case_id = data["caseId"]

    # Now reconstruct the 3D surface mesh
    rec_resp = client.post("/api/reconstruct", json={"caseId": case_id})
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert len(rec_data["brainVertices"]) > 0
    assert len(rec_data["tumorVertices"]) > 0
    assert len(rec_data["centroidMm"]) == 3

