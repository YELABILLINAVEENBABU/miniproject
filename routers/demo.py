"""
routers/demo.py — Demo cases provider
Provides pre-loaded Medical Segmentation Decathlon cases (BRATS_001 … BRATS_484)
so users can immediately demonstrate the 3D visualization, location explainer,
and quiz without manually uploading large NIfTI files.
"""

import os
import re
import shutil
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import (
    compute_centroid_mm,
    compute_volume_cm3,
    get_mask_labels,
)
from routers.upload import CaseSummaryResponse, UPLOAD_DIR

router = APIRouter(tags=["demo"])

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_IMAGES_DIR = os.path.join(ROOT_DIR, "data", "images")
DATA_LABELS_DIR = os.path.join(ROOT_DIR, "data", "labels")


class DemoPresetInfo(BaseModel):
    demoId: str
    title: str
    description: str
    imageFile: str
    labelFile: str


def get_all_dataset_cases() -> List[DemoPresetInfo]:
    """Scan data/images and data/labels to index all available BraTS cases."""
    if not os.path.exists(DATA_IMAGES_DIR) or not os.path.exists(DATA_LABELS_DIR):
        return []

    image_files = set(os.listdir(DATA_IMAGES_DIR))
    label_files = set(os.listdir(DATA_LABELS_DIR))

    # Match files like BRATS_001.nii.gz
    pattern = re.compile(r"^BRATS_(\d+)\.nii\.gz$")
    cases: List[DemoPresetInfo] = []

    for img in sorted(image_files):
        match = pattern.match(img)
        if match and img in label_files:
            case_num = match.group(1)
            cases.append(
                DemoPresetInfo(
                    demoId=f"demo-brats-{case_num}",
                    title=f"BraTS Case {case_num}",
                    description=f"Medical Segmentation Decathlon BraTS case {case_num} (NIfTI 4D MRI + Ground Truth Mask).",
                    imageFile=img,
                    labelFile=img,
                )
            )
    return cases


@router.get(
    "/demo/cases",
    response_model=List[DemoPresetInfo],
    summary="List available dataset cases with optional search query",
)
async def list_demo_cases(
    q: Optional[str] = Query(None, description="Search query e.g. '001', 'BraTS Case 10'"),
    limit: int = Query(500, description="Max cases to return (default 500)"),
    offset: int = Query(0, description="Offset for pagination"),
):
    all_cases = get_all_dataset_cases()
    if q:
        query_str = q.strip().lower()
        all_cases = [
            c for c in all_cases
            if query_str in c.demoId.lower() or query_str in c.title.lower() or query_str in c.description.lower()
        ]
    return all_cases[offset : offset + limit]


@router.post(
    "/demo/load/{demo_id}",
    response_model=CaseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize and activate any dataset case by demo_id",
)
async def load_demo_case(demo_id: str):
    # Parse demoId e.g. demo-brats-001 or directly BRATS_001
    all_cases = get_all_dataset_cases()
    preset = next((p for p in all_cases if p.demoId == demo_id), None)

    if not preset:
        # Check if demo_id matches BRATS_XXX format directly
        clean_num_match = re.search(r"(\d+)", demo_id)
        if clean_num_match:
            padded_id = f"demo-brats-{clean_num_match.group(1).zfill(3)}"
            preset = next((p for p in all_cases if p.demoId == padded_id), None)

    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID '{demo_id}' not found in dataset.",
        )

    case_folder = os.path.join(UPLOAD_DIR, preset.demoId)
    os.makedirs(case_folder, exist_ok=True)

    dest_mri = os.path.join(case_folder, "mri.nii.gz")
    dest_mask = os.path.join(case_folder, "mask.nii.gz")

    # Copy from dataset if not already copied
    if not os.path.exists(dest_mri) or not os.path.exists(dest_mask):
        src_mri = os.path.join(DATA_IMAGES_DIR, preset.imageFile)
        src_mask = os.path.join(DATA_LABELS_DIR, preset.labelFile)

        if not os.path.exists(src_mri) or not os.path.exists(src_mask):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset files for {preset.title} not found on disk.",
            )

        shutil.copyfile(src_mri, dest_mri)
        shutil.copyfile(src_mask, dest_mask)

    mri_vol = load_nifti(dest_mri)
    mask_vol = load_nifti(dest_mask)

    centroid = compute_centroid_mm(mask_vol.data, mask_vol.affine)
    volume_cm3 = compute_volume_cm3(mask_vol.data, mask_vol.spacing)
    labels = get_mask_labels(mask_vol.data)

    return CaseSummaryResponse(
        caseId=preset.demoId,
        mriShape=mri_vol.shape,
        spacing=mri_vol.spacing,
        maskLabels=labels,
        volumeCm3=volume_cm3,
        centroidMm=centroid,
    )
