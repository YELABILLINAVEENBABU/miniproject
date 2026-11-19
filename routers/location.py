"""
routers/location.py — Phase 4
GET /api/location?caseId=uuid
Returns atlas-mapped tumor location, hemisphere, primary imaging plane,
volume, and nearby structures for a given case.
"""

import os
from typing import List, Tuple
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import compute_centroid_mm, compute_volume_cm3
from modules.tumor_location import derive_location
from routers.upload import UPLOAD_DIR

router = APIRouter(tags=["location"])


class TumorLocationResponse(BaseModel):
    regionName: str
    regionProbability: float
    hemisphere: str
    primaryPlane: str
    mniCoords: Tuple[float, float, float]
    volumeCm3: float
    nearbyStructures: List[str]


@router.get(
    "/location",
    response_model=TumorLocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get atlas-mapped anatomical location of the tumor",
)
async def get_tumor_location(
    caseId: str = Query(..., description="Uploaded case ID or demo ID (e.g. demo-brats-001)"),
):
    case_folder = os.path.join(UPLOAD_DIR, caseId)
    if not os.path.exists(case_folder):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID '{caseId}' not found. Please upload a case or load a demo case first.",
        )

    mask_path = os.path.join(case_folder, "mask.nii.gz")
    if not os.path.exists(mask_path):
        # Fallback to mask.nii
        mask_path = os.path.join(case_folder, "mask.nii")
        if not os.path.exists(mask_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tumor segmentation mask not found for case '{caseId}'.",
            )

    try:
        mask_vol = load_nifti(mask_path)
        centroid_mm = compute_centroid_mm(mask_vol.data, mask_vol.affine)
        volume_cm3 = compute_volume_cm3(mask_vol.data, mask_vol.spacing)

        loc = derive_location(
            centroid_mm=centroid_mm,
            affine=mask_vol.affine,
            mask_data=mask_vol.data,
            spacing=mask_vol.spacing,
            volume_cm3=volume_cm3,
        )

        return TumorLocationResponse(
            regionName=loc.region_name,
            regionProbability=loc.region_probability,
            hemisphere=loc.hemisphere,
            primaryPlane=loc.primary_plane,
            mniCoords=loc.mni_coords,
            volumeCm3=loc.volume_cm3,
            nearbyStructures=loc.nearby_structures,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing tumor location: {str(exc)}",
        )
