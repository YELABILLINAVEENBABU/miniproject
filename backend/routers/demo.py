"""
routers/demo.py — Demo cases provider
Provides pre-loaded Medical Segmentation Decathlon cases (e.g. BRATS_001)
with Supabase Cloud query and local dataset fallback.
"""

import os
import re
import shutil
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from dotenv import load_dotenv

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import (
    compute_centroid_mm,
    compute_volume_cm3,
    get_mask_labels,
)
from routers.upload import CaseSummaryResponse, UPLOAD_DIR

# Load env variables for Supabase
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")))

router = APIRouter(tags=["demo"])

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_IMAGES_DIR = os.path.join(ROOT_DIR, "data", "images")
DATA_LABELS_DIR = os.path.join(ROOT_DIR, "data", "labels")

# Optional Supabase client init
supabase_client = None
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if SUPABASE_URL and SUPABASE_KEY and "your_supabase" not in SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase client initialization notice: {e}")


class DemoPresetInfo(BaseModel):
    demoId: str
    title: str
    description: str
    imageFile: str
    labelFile: str
    imageUrl: Optional[str] = None
    labelUrl: Optional[str] = None


def get_all_dataset_cases() -> List[DemoPresetInfo]:
    """
    Fetch cases from Supabase if available; otherwise scan local data/images and data/labels.
    """
    if supabase_client:
        try:
            res = (
                supabase_client.table("cases")
                .select("*")
                .order("case_number", desc=False)
                .execute()
            )
            if res.data and len(res.data) > 0:
                cases = []
                for row in res.data:
                    case_num = str(row.get("case_number", "")).zfill(3)
                    filename = f"BRATS_{case_num}.nii.gz"
                    cases.append(
                        DemoPresetInfo(
                            demoId=row.get("case_id", f"demo-brats-{case_num}"),
                            title=row.get("title", f"BraTS Case {case_num}"),
                            description=row.get(
                                "description",
                                f"BraTS Case {case_num} (NIfTI 4D MRI + Ground Truth Mask).",
                            ),
                            imageFile=filename,
                            labelFile=filename,
                            imageUrl=row.get("image_url"),
                            labelUrl=row.get("label_url"),
                        )
                    )
                return cases
        except Exception as e:
            print(f"Supabase query fallback to local: {e}")

    # Fallback to local files
    if not os.path.exists(DATA_IMAGES_DIR) or not os.path.exists(DATA_LABELS_DIR):
        return []

    image_files = set(os.listdir(DATA_IMAGES_DIR))
    label_files = set(os.listdir(DATA_LABELS_DIR))
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
                    description=f"BraTS Case {case_num} (NIfTI 4D MRI + Ground Truth Mask).",
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
            c
            for c in all_cases
            if query_str in c.demoId.lower()
            or query_str in c.title.lower()
            or query_str in c.description.lower()
        ]
    return all_cases[offset : offset + limit]


@router.post(
    "/demo/load/{demo_id}",
    response_model=CaseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize and activate any dataset case by demo_id",
)
async def load_demo_case(demo_id: str):
    all_cases = get_all_dataset_cases()
    preset = next((p for p in all_cases if p.demoId == demo_id), None)

    if not preset:
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

    # If local source files exist, copy them
    if not os.path.exists(dest_mri) or not os.path.exists(dest_mask):
        src_mri = os.path.join(DATA_IMAGES_DIR, preset.imageFile)
        src_mask = os.path.join(DATA_LABELS_DIR, preset.labelFile)

        if os.path.exists(src_mri) and os.path.exists(src_mask):
            shutil.copyfile(src_mri, dest_mri)
            shutil.copyfile(src_mask, dest_mask)
        elif supabase_client and preset.imageFile:
            # Download from Supabase Storage if missing locally
            try:
                img_data = supabase_client.storage.from_("mri-images").download(preset.imageFile)
                with open(dest_mri, "wb") as f:
                    f.write(img_data)
                mask_data = supabase_client.storage.from_("tumor-labels").download(preset.labelFile)
                with open(dest_mask, "wb") as f:
                    f.write(mask_data)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Could not download files from Supabase storage: {e}",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset files for {preset.title} not found on disk or Supabase.",
            )

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
