"""
routers/reconstruct.py — Phase 2
Extracts 3D surface meshes from stored NIfTI files for a given caseId
using marching cubes. Returns vertex and face indices for the brain and tumor.
"""

import os
from typing import List, Tuple, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import compute_centroid_mm
from modules.reconstruction import extract_brain_surface, extract_tumor_surface

router = APIRouter(tags=["reconstruct"])

UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
)


class ReconstructRequest(BaseModel):
    caseId: str


class ReconstructResponse(BaseModel):
    brainVertices: List[List[float]]
    brainFaces: List[List[int]]
    tumorVertices: List[List[float]]
    tumorFaces: List[List[int]]
    centroidMm: Tuple[float, float, float]


@router.post(
    "/reconstruct",
    response_model=ReconstructResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 3D surface meshes for brain and tumor",
)
async def reconstruct_case(req: ReconstructRequest):
    case_folder = os.path.join(UPLOAD_DIR, req.caseId)
    mri_path = os.path.join(case_folder, "mri.nii.gz")
    mask_path = os.path.join(case_folder, "mask.nii.gz")

    if not os.path.exists(mri_path) or not os.path.exists(mask_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID '{req.caseId}' not found. Upload MRI and mask files first.",
        )

    try:
        mri_vol = load_nifti(mri_path)
        mask_vol = load_nifti(mask_path)

        # Surface extraction with marching cubes
        brain_mesh = extract_brain_surface(mri_vol.data, mri_vol.spacing)
        tumor_mesh = extract_tumor_surface(mask_vol.data, mask_vol.spacing)

        # Centroid coordinates
        centroid = compute_centroid_mm(mask_vol.data, mask_vol.affine)

        return ReconstructResponse(
            brainVertices=brain_mesh["vertices"],
            brainFaces=brain_mesh["faces"],
            tumorVertices=tumor_mesh["vertices"],
            tumorFaces=tumor_mesh["faces"],
            centroidMm=centroid,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Surface reconstruction error: {str(exc)}",
        )
