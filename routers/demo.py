"""
routers/demo.py — Demo cases provider
Provides pre-loaded Medical Segmentation Decathlon cases (e.g. BRATS_001)
so users can immediately demonstrate the 3D visualization, location explainer,
and quiz without manually uploading large NIfTI files.
"""

import os
import shutil
from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import (
    compute_centroid_mm,
    compute_volume_cm3,
    get_mask_labels,
)
from routers.upload import CaseSummaryResponse, UPLOAD_DIR

router = APIRouter(tags=["demo"])

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_IMAGES_DIR = os.path.join(ROOT_DIR, "data", "images")
DATA_LABELS_DIR = os.path.join(ROOT_DIR, "data", "labels")

DEMO_PRESETS = [
    {
        "demoId": "demo-brats-001",
        "title": "BraTS Case 001 (Glioblastoma Multiforme)",
        "description": "High-grade glioma with extensive peritumoral edema, necrotic core, and active enhancing rim.",
        "imageFile": "BRATS_001.nii.gz",
        "labelFile": "BRATS_001.nii.gz",
    },
    {
        "demoId": "demo-brats-002",
        "title": "BraTS Case 002 (Frontal Lobe Lesion)",
        "description": "Secondary frontal resection candidate with distinct non-enhancing and enhancing boundaries.",
        "imageFile": "BRATS_002.nii.gz",
        "labelFile": "BRATS_002.nii.gz",
    },
]


class DemoPresetInfo(BaseModel):
    demoId: str
    title: str
    description: str


@router.get("/demo/cases", response_model=List[DemoPresetInfo], summary="List available demo presets")
async def list_demo_cases():
    return [
        DemoPresetInfo(
            demoId=p["demoId"],
            title=p["title"],
            description=p["description"],
        )
        for p in DEMO_PRESETS
    ]


@router.post(
    "/demo/load/{demo_id}",
    response_model=CaseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize and activate a pre-bundled demo MRI case",
)
async def load_demo_case(demo_id: str):
    preset = next((p for p in DEMO_PRESETS if p["demoId"] == demo_id), None)
    if not preset:
        # Default to first preset if unknown ID
        preset = DEMO_PRESETS[0]

    case_folder = os.path.join(UPLOAD_DIR, preset["demoId"])
    os.makedirs(case_folder, exist_ok=True)

    dest_mri = os.path.join(case_folder, "mri.nii.gz")
    dest_mask = os.path.join(case_folder, "mask.nii.gz")

    # Copy from dataset if not already copied
    if not os.path.exists(dest_mri) or not os.path.exists(dest_mask):
        src_mri = os.path.join(DATA_IMAGES_DIR, preset["imageFile"])
        src_mask = os.path.join(DATA_LABELS_DIR, preset["labelFile"])

        if not os.path.exists(src_mri) or not os.path.exists(src_mask):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demo sample NIfTI files not found in dataset folder.",
            )

        shutil.copyfile(src_mri, dest_mri)
        shutil.copyfile(src_mask, dest_mask)

    mri_vol = load_nifti(dest_mri)
    mask_vol = load_nifti(dest_mask)

    centroid = compute_centroid_mm(mask_vol.data, mask_vol.affine)
    volume_cm3 = compute_volume_cm3(mask_vol.data, mask_vol.spacing)
    labels = get_mask_labels(mask_vol.data)

    return CaseSummaryResponse(
        caseId=preset["demoId"],
        mriShape=mri_vol.shape,
        spacing=mri_vol.spacing,
        maskLabels=labels,
        volumeCm3=volume_cm3,
        centroidMm=centroid,
    )

