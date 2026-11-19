"""
routers/files.py — Phase 3
Serves uploaded NIfTI volume and mask files as binary streams
with explicit .nii.gz extensions in the URL so WebGL/NiiVue can determine file format.
"""

import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

router = APIRouter(tags=["files"])

UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
)


@router.get(
    "/files/{case_id}/mri.nii.gz",
    summary="Download MRI NIfTI volume for NiiVue viewer",
)
@router.get(
    "/files/{case_id}/mri",
    include_in_schema=False,
)
async def get_mri_file(case_id: str):
    file_path = os.path.join(UPLOAD_DIR, case_id, "mri.nii.gz")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MRI file not found for case '{case_id}'",
        )
    return FileResponse(
        file_path,
        media_type="application/gzip",
        filename=f"case_{case_id}_mri.nii.gz",
    )


@router.get(
    "/files/{case_id}/mask.nii.gz",
    summary="Download Tumor Mask NIfTI volume for NiiVue viewer",
)
@router.get(
    "/files/{case_id}/mask",
    include_in_schema=False,
)
async def get_mask_file(case_id: str):
    file_path = os.path.join(UPLOAD_DIR, case_id, "mask.nii.gz")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mask file not found for case '{case_id}'",
        )
    return FileResponse(
        file_path,
        media_type="application/gzip",
        filename=f"case_{case_id}_mask.nii.gz",
    )
