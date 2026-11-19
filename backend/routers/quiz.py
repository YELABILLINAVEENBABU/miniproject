"""
routers/quiz.py — Phase 5
GET /api/quiz?caseId=uuid
Returns 5 multiple-choice questions grounded in the loaded case's TumorLocation metrics.
"""

import os
from typing import List
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from modules.mri_loader import load_nifti
from modules.tumor_segmentation import compute_centroid_mm, compute_volume_cm3
from modules.tumor_location import derive_location
from modules.quiz_generator import generate_questions
from routers.upload import UPLOAD_DIR

router = APIRouter(tags=["quiz"])


class QuestionResponse(BaseModel):
    id: int
    category: str
    stem: str
    options: List[str]
    correctIndex: int
    explanation: str


class QuizResponse(BaseModel):
    questions: List[QuestionResponse]


@router.get(
    "/quiz",
    response_model=QuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 5 multiple-choice questions grounded in the active case",
)
async def get_quiz(
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

        questions = generate_questions(loc)

        return QuizResponse(
            questions=[
                QuestionResponse(
                    id=q.id,
                    category=q.category,
                    stem=q.stem,
                    options=q.options,
                    correctIndex=q.correct_index,
                    explanation=q.explanation,
                )
                for q in questions
            ]
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating case quiz: {str(exc)}",
        )
