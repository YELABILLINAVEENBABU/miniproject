"""
routers/upload.py — Phase 2
Handles multipart/form-data upload of MRI and segmentation mask NIfTI files.
Validates file formats, shapes, and affine matrices.
Saves files under data/uploads/{case_id}/ and returns case summary metadata.
"""

import os
import uuid
from typing import List, Tuple
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import (
    validate_mask,
    compute_centroid_mm,
    compute_volume_cm3,
    get_mask_labels,
)

router = APIRouter(tags=["upload"])

# Directory to store uploaded cases
UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


class CaseSummaryResponse(BaseModel):
    caseId: str
    mriShape: Tuple[int, int, int]
    spacing: Tuple[float, float, float]
    maskLabels: List[int]
    volumeCm3: float
    centroidMm: Tuple[float, float, float]


@router.post(
    "/upload",
    response_model=CaseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload MRI volume and tumor mask pair",
)
async def upload_case(
    mri_file: UploadFile = File(..., description="NIfTI MRI volume (.nii or .nii.gz)"),
    mask_file: UploadFile = File(..., description="NIfTI tumor mask (.nii or .nii.gz)"),
):
    # Validate file extension
    for file_obj in (mri_file, mask_file):
        filename = file_obj.filename or ""
        if not (filename.endswith(".nii") or filename.endswith(".nii.gz")):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid file format: '{filename}'. Must be .nii or .nii.gz NIfTI format.",
            )

    case_id = str(uuid.uuid4())
    case_folder = os.path.join(UPLOAD_DIR, case_id)
    os.makedirs(case_folder, exist_ok=True)

    mri_path = os.path.join(case_folder, "mri.nii.gz")
    mask_path = os.path.join(case_folder, "mask.nii.gz")

    try:
        # Write uploaded contents to disk
        mri_bytes = await mri_file.read()
        mask_bytes = await mask_file.read()

        with open(mri_path, "wb") as f:
            f.write(mri_bytes)

        with open(mask_path, "wb") as f:
            f.write(mask_bytes)

        # Load and parse NIfTI geometry with NiBabel
        mri_vol = load_nifti(mri_path)
        mask_vol = load_nifti(mask_path)

        # Validate geometric pairing
        try:
            validate_mask(
                mri_affine=mri_vol.affine,
                mask_affine=mask_vol.affine,
                mri_shape=mri_vol.shape,
                mask_shape=mask_vol.shape,
            )
        except ValueError as val_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(val_err),
            )

        # Compute case metrics
        centroid = compute_centroid_mm(mask_vol.data, mask_vol.affine)
        volume_cm3 = compute_volume_cm3(mask_vol.data, mask_vol.spacing)
        labels = get_mask_labels(mask_vol.data)

        return CaseSummaryResponse(
            caseId=case_id,
            mriShape=mri_vol.shape,
            spacing=mri_vol.spacing,
            maskLabels=labels,
            volumeCm3=volume_cm3,
            centroidMm=centroid,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing NIfTI files: {str(exc)}",
        )
