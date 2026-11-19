"""
BrainTumor 3D — FastAPI Backend Entry Point
============================================
Runs with:  uvicorn main:app --reload --port 8000
Docs at:    http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.upload import router as upload_router
from routers.reconstruct import router as reconstruct_router
from routers.files import router as files_router
from routers.demo import router as demo_router
from routers.location import router as location_router
from routers.quiz import router as quiz_router

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="BrainTumor 3D API",
    description=(
        "Educational Brain MRI Visualization and Anatomical Learning Platform. "
        "EDUCATIONAL USE ONLY — NOT A CLINICAL OR DIAGNOSTIC TOOL."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server on port 5173
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(upload_router, prefix="/api")
app.include_router(reconstruct_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(location_router, prefix="/api")
app.include_router(quiz_router, prefix="/api")

# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["health"])
async def health_check() -> dict:
    """
    Returns server status.
    ``atlasLoaded`` will be ``true`` once nilearn has cached the
    Harvard-Oxford atlas in ``data/atlas/``.
    """
    atlas_loaded = _check_atlas()
    return {"status": "online", "atlasLoaded": atlas_loaded}


def _check_atlas() -> bool:
    """Return True if the Harvard-Oxford atlas has been cached or extracted."""
    import os
    atlas_file = os.path.join(
        os.path.dirname(__file__),
        "data", "atlas", "data", "atlases", "HarvardOxford",
        "HarvardOxford-cort-maxprob-thr25-2mm.nii.gz"
    )
    if os.path.exists(atlas_file):
        return True
    try:
        from nilearn import datasets  # noqa: PLC0415
        _ = datasets.fetch_atlas_harvard_oxford.__doc__
        return True
    except Exception:
        return False
