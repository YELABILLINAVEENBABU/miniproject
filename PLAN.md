# BrainTumor 3D — Implementation Plan

**Folder:** `MINI PROJECT/` ← this is the repo root  
**App name:** BrainTumor 3D — Interactive Brain MRI Visualization and Anatomical Learning Platform  
**Architecture:** FastAPI (Python backend) + React + TypeScript + Vite (frontend)  
**3D Viewer:** NiiVue (medical-grade WebGL volumetric renderer)  
**Type:** University Mini-Project  
**Duration:** 6 weeks  
**Status:** Phase 1 — Environment Setup

---

## 1. Project Summary

| Feature | Description |
|---------|-------------|
| **Tumor Location Explainer** | Student uploads MRI + mask → NiiVue renders real volumetric brain → student clicks tumor → FastAPI returns atlas-mapped location, hemisphere, volume, nearby structures |
| **Interactive Learning Quiz** | 5 multiple-choice questions grounded in the loaded case; immediate feedback + explanations + score |

**Chosen environment:**
- IDE: VS Code
- OS: macOS
- Dataset: Medical Segmentation Decathlon (Task01 Brain Tumour)

---

## 2. Full Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND  React + TypeScript + Vite  (localhost:5173)              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │ NiiVueViewer │  │  Page Components  │  │  QuizQuestion /       │ │
│  │ 3D + MPR     │  │  Sidebar router   │  │  QuizResults          │ │
│  └──────────────┘  └──────────────────┘  └───────────────────────┘ │
│                          │  fetch() / FormData                      │
└──────────────────────────┼──────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND  FastAPI + Uvicorn  (localhost:8000)                       │
│                                                                     │
│  POST /api/upload        ← receive + validate NIfTI files           │
│  POST /api/reconstruct   ← extract surface mesh + centroid          │
│  GET  /api/location      ← atlas-mapped tumor location              │
│  GET  /api/quiz          ← generate 5 MCQ questions                 │
│  GET  /api/health        ← server status check                      │
│                                                                     │
│  nibabel · numpy · scikit-image · simpleitk · nilearn               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend

| Technology | Version | Role |
|-----------|---------|------|
| Python | 3.11+ | Primary language |
| FastAPI | ≥ 0.111 | REST API framework |
| Uvicorn | ≥ 0.29 | ASGI server |
| NiBabel | ≥ 5.2 | NIfTI loading and affine parsing |
| NumPy | ≥ 1.26 | Voxel array processing |
| scikit-image | ≥ 0.22 | Marching cubes surface extraction |
| SimpleITK | ≥ 2.3 | Image geometry and MNI registration |
| nilearn | ≥ 0.10 | Harvard-Oxford atlas lookup |
| python-multipart | ≥ 0.0.9 | File upload handling in FastAPI |
| pytest | ≥ 8.0 | Unit testing |

### Frontend

| Technology | Version | Role |
|-----------|---------|------|
| React | 19 | UI framework |
| TypeScript | 5+ | Type-safe development |
| Vite | 6+ | Dev server and build tool |
| NiiVue | ≥ 0.44 | Medical volumetric 3D + MPR rendering |
| Tailwind CSS | ≥ 3.4 | Utility-first styling |

---

## 4. API Contract

All backend routes return JSON. Frontend communicates only via these endpoints.

### `GET /api/health`
```json
{ "status": "online", "atlasLoaded": true }
```

### `POST /api/upload`
- **Body:** `multipart/form-data` — `mri_file`, `mask_file`
- **Returns:**
```json
{
  "caseId": "uuid-string",
  "mriShape": [240, 240, 155],
  "spacing": [1.0, 1.0, 1.0],
  "maskLabels": [1, 2, 3],
  "volumeCm3": 23.4
}
```
- **Errors:** `422` if dimensions or affine mismatch

### `POST /api/reconstruct`
- **Body:** `{ "caseId": "uuid" }`
- **Returns:** Mesh vertex/face arrays + centroid for NiiVue overlay
```json
{
  "brainVertices": [...],
  "brainFaces": [...],
  "tumorVertices": [...],
  "tumorFaces": [...],
  "centroidMm": [-14.2, 33.1, 48.5]
}
```

### `GET /api/location?caseId=uuid`
- **Returns:**
```json
{
  "regionName": "Frontal Lobe",
  "regionProbability": 0.78,
  "hemisphere": "Left",
  "primaryPlane": "Axial",
  "mniCoords": [-14.2, 33.1, 48.5],
  "volumeCm3": 23.4,
  "nearbyStructures": ["Motor Cortex", "Broca's Area", "Internal Capsule"]
}
```

### `GET /api/quiz?caseId=uuid`
- **Returns:**
```json
{
  "questions": [
    {
      "id": 1,
      "category": "lobe",
      "stem": "In which brain lobe is the highlighted tumor located?",
      "options": ["Frontal Lobe", "Temporal Lobe", "Parietal Lobe", "Occipital Lobe"],
      "correctIndex": 0,
      "explanation": "The tumor centroid maps to the Frontal Lobe at MNI coordinates (–14, 33, 48)."
    }
  ]
}
```

---

## 5. Phased Implementation Plan

---

### Phase 1 — Environment Setup *(Week 1)*

**Goal:** Both servers running; health check passes; atlas confirmed loadable.

#### Backend Tasks
- [x] Create `backend/` folder structure
- [x] Write `backend/requirements.txt`
- [x] `pip install -r requirements.txt` succeeds
- [x] Write `backend/main.py` with:
  - FastAPI app instance
  - CORS middleware allowing `http://localhost:5173`
  - `GET /api/health` returning `{ "status": "online", "atlasLoaded": true }`
- [x] `uvicorn main:app --reload` starts without error
- [x] Download Harvard-Oxford atlas NIfTI + XML files → `backend/data/atlas/`
- [x] Confirm atlas loads with nilearn/nibabel in a test script

#### Frontend Tasks
- [x] `npm create vite@latest frontend -- --template react-ts`
- [x] `npm install` inside `frontend/`
- [x] `npm install niivue tailwindcss`
- [x] Configure Tailwind CSS
- [x] Create placeholder pages: `Dashboard.tsx`, `UploadMRI.tsx`, `Visualization.tsx`, `TumorLocation.tsx`, `LearningQuiz.tsx`
- [x] Create `Sidebar.tsx` with navigation links to all 5 pages
- [x] Wire pages into `App.tsx` with React Router
- [x] `npm run dev` runs at `localhost:5173` and shows sidebar

#### Deliverable
`GET http://localhost:8000/api/health` returns `{"status":"online"}`. Frontend shows sidebar with 5 navigable placeholder pages.

---

### Phase 2 — NIfTI Loading, Validation & Surface Extraction *(Week 2)*

**Goal:** Backend can receive NIfTI files, validate them, and return mesh data.

#### Backend Tasks
- [x] Complete `modules/mri_loader.py`:
  - Load `.nii` / `.nii.gz` with NiBabel
  - Extract affine, spacing, shape, and voxel data
  - Return `MriVolume` dataclass
- [x] Complete `modules/tumor_segmentation.py`:
  - Load segmentation mask
  - Validate shape and affine match MRI (`np.allclose(vol.affine, mask.affine)`)
  - Compute centroid as voxel center-of-mass of nonzero voxels
  - Apply affine → world mm centroid
  - Compute volume: `voxel_count × (sx × sy × sz)` → mm³ → cm³
- [x] Complete `modules/reconstruction.py`:
  - Downsample MRI to max 128³
  - Apply `skimage.measure.marching_cubes()` on brain (thresholded) → `(vertices, faces)`
  - Apply `marching_cubes()` on mask → `(vertices, faces)`
- [x] Wire `routers/upload.py` → `POST /api/upload`
  - Accept `multipart/form-data`
  - Save files to `data/uploads/`
  - Run validation; return case summary JSON or `422`
- [x] Wire `routers/reconstruct.py` → `POST /api/reconstruct`
  - Run marching cubes on saved files
  - Return mesh JSON
- [x] Write `tests/test_reconstruction.py`:
  - `extract_brain_surface` returns non-empty vertex array
  - `extract_tumor_surface` returns fewer vertices than brain
  - Centroid is center-of-mass (not bounding-box midpoint)

#### Frontend Tasks
- [x] Build `UploadMRI.tsx`:
  - Two file inputs: MRI volume + segmentation mask
  - On submit → `POST /api/upload` with FormData
  - Show success (case summary) or error message
  - Store `caseId` in React context / localStorage

#### Deliverable
`POST /api/upload` returns correct case summary. `POST /api/reconstruct` returns mesh JSON. `pytest tests/test_reconstruction.py` passes.

---

### Phase 3 — 3D Volumetric Visualization *(Week 3)*

**Goal:** Real medical-grade brain + tumor rendering visible in the browser.

#### Frontend Tasks
- [x] Create `NiiVueViewer.tsx`:
  - Wrap NiiVue WebGL canvas in a React component
  - Load MRI NIfTI volume from backend blob URL or base64
  - Load segmentation mask as an overlay (red colormap, adjustable opacity)
  - Enable NiiVue MPR mode: Axial + Coronal + Sagittal + 3D quad layout
  - Add 3D rotation controls (mouse drag, orientation presets, continuous 360° spin)
  - Expose `onVoxelClick` callback returning world coordinates when user clicks
- [x] Build `Visualization.tsx`:
  - Render `<NiiVueViewer />` full-width
  - On tumor click → show right-side info panel with centroid coordinates, hemisphere, volume
  - Add "View Full Location →" button routing to Tumor Location page
- [x] Build `Dashboard.tsx`:
  - Executive Overview & Case Analytics Hub
  - Clinical telemetry cards: tumor volume (cm³), MNI centroid, voxel dimensions & spacing
  - Interactive 1-click Demo Case Selector (BraTS 001/002)
  - System status & atlas engine health monitor
  - Student learning scorecard summary badge

#### Deliverable
Real volumetric MRI brain visible in browser with segmentation mask overlaid in red. All 3 MPR slice views and 3D view rendered by NiiVue. Clicking the mask overlay triggers an info panel.

---

### Phase 4 — Anatomical Location Explainer *(Week 4)*

**Goal:** Backend atlas mapping + full Location page in frontend.

#### Backend Tasks
- [x] Complete `modules/atlas_mapping.py`:
  - Load Harvard-Oxford Cortical + Subcortical atlases via nilearn
  - `query_atlas(mni_coords) → list[AtlasHit]`:
    - Convert MNI mm → atlas voxel index via atlas affine inverse
    - Return hits with probability ≥ 25%, sorted descending
  - `find_nearby_structures(mni_coords, radius_mm=10) → list[str]`:
    - Return structure names within radius
    - Label unmapped structures as `"Not Mapped"`
- [x] Complete `modules/tumor_location.py`:
  - Register tumor centroid from native MRI → MNI152 space (SimpleITK)
  - Hemisphere: MNI X < –5 = Left · X > +5 = Right · within ±5 = Midline
  - Primary plane: longest tumor axis direction
  - Return `TumorLocation` dataclass
- [x] Wire `routers/location.py` → `GET /api/location?caseId=uuid`
  - Run atlas mapping + location derivation
  - Return full location JSON
- [x] Write `tests/test_location.py`:
  - X < 0 → hemisphere = "Left"
  - X > 0 → hemisphere = "Right"
  - Known frontal-lobe MNI coord → frontal label returned

#### Frontend Tasks
- [x] Build `LocationPanel.tsx`:
  - Cards for: region name, hemisphere, primary plane, MNI coordinates, volume, nearby structures
  - Educational explanation paragraph for the identified lobe
- [x] Build `TumorLocation.tsx`:
  - Fetch `GET /api/location?caseId=...` on mount
  - Render `<LocationPanel />` with fetched data
  - "Take the Quiz →" button

#### Deliverable
Tumor Location page shows atlas-mapped region, hemisphere, coordinates, volume, and nearby structures. `pytest tests/test_location.py` passes.

---

### Phase 5 — Interactive Learning Quiz *(Week 5)*

**Goal:** Fully functional scored quiz grounded in the loaded case.

#### Backend Tasks
- [x] Complete `modules/quiz_generator.py`:
  - `generate_questions(location: TumorLocation) → list[Question]`
  - Exactly 5 questions, one per category:

    | # | Category | Correct Answer Source |
    |---|----------|-----------------------|
    | 1 | `lobe` | Atlas region label |
    | 2 | `hemisphere` | MNI X-coordinate sign |
    | 3 | `plane` | `primary_plane` attribute |
    | 4 | `meaning` | Fixed educational label |
    | 5 | `volume` | `volume_cm3` rounded |

  - Distractors: adjacent atlas regions, plausible volumes, opposite hemisphere
- [x] Wire `routers/quiz.py` → `GET /api/quiz?caseId=uuid`
  - Call `generate_questions`; return question list JSON

#### Frontend Tasks
- [x] Build `QuizQuestion.tsx`:
  - Display question stem + 4 radio button options
  - Submit → show ✅ correct / ❌ incorrect immediately
  - Reveal explanation text below answer
- [x] Build `QuizResults.tsx`:
  - Final score (e.g. 4/5 — 80% — PASS ≥ 70%)
  - Full answer review: each question with correct answer highlighted
  - Try Again button (reshuffles options order)
- [x] Build `LearningQuiz.tsx`:
  - Fetch `GET /api/quiz?caseId=...` on mount
  - Progress bar: Q1/5 → Q2/5 → …
  - Render `<QuizQuestion />` one at a time
  - On completion render `<QuizResults />`

#### Deliverable
Quiz generates 5 grounded questions from the loaded case. All answers traceable to case data. Scoring correct. Explanations shown per question.

---

### Phase 6 — Testing, Polish & Documentation *(Week 6)*

**Goal:** Polished, tested, and demonstrable project.

#### Tasks
- [x] `pytest backend/tests/ -v` → all tests pass (19/19 passing)
- [x] TypeScript build: `npm run build` → no errors (0 build errors)
- [x] End-to-end walkthrough: upload → 3D view → location → quiz → results
- [x] Add Tailwind polish: consistent colors, medical-tech dark theme, readable typography
- [x] Update README with completed phases and run instructions

---

## 6. Data Flow Summary

```
1. User selects MRI + mask files in UploadMRI.tsx
      ↓
2. Frontend: POST /api/upload (FormData)
      ↓
3. Backend: nibabel loads files → validates shape/affine → returns caseId + summary
      ↓
4. Frontend stores caseId → routes to Visualization.tsx
      ↓
5. Frontend: POST /api/reconstruct (caseId)
      ↓
6. Backend: marching cubes → returns mesh JSON
      ↓
7. NiiVueViewer loads NIfTI blob + mask overlay → renders volumetric brain
      ↓
8. User clicks tumor → frontend: GET /api/location (caseId)
      ↓
9. Backend: centroid → MNI registration → atlas query → returns TumorLocation JSON
      ↓
10. LocationPanel.tsx renders region, hemisphere, volume, nearby structures
      ↓
11. User navigates to quiz → frontend: GET /api/quiz (caseId)
      ↓
12. Backend: generate_questions(location) → returns 5 questions
      ↓
13. LearningQuiz.tsx renders questions → user answers → QuizResults.tsx shows score
```

---

## 7. Shared TypeScript Types

```typescript
// frontend/src/types/medical.ts

export interface CaseSummary {
  caseId: string;
  mriShape: [number, number, number];
  spacing: [number, number, number];
  maskLabels: number[];
  volumeCm3: number;
}

export interface TumorLocation {
  regionName: string;
  regionProbability: number;
  hemisphere: 'Left' | 'Right' | 'Midline';
  primaryPlane: 'Axial' | 'Coronal' | 'Sagittal';
  mniCoords: [number, number, number];
  volumeCm3: number;
  nearbyStructures: string[];
}

export interface Question {
  id: number;
  category: 'lobe' | 'hemisphere' | 'plane' | 'meaning' | 'volume';
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
```

---

## 8. Evaluation Criteria

| Criterion | Verification |
|-----------|-------------|
| **3D Reconstruction** | Volumetric rendering matches MRI geometry |
| **Tumor Visualization** | Mask overlay aligns with MPR slices |
| **Location Explainer** | Atlas label correct for the loaded case |
| **Quiz** | 5 questions from case data; scoring accurate |
| **Usability** | Student completes workflow unaided |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| NiiVue React integration complexity | Medium | High | Use official `@niivue/niivue` npm package; isolate in `NiiVueViewer.tsx` |
| SimpleITK MNI registration inaccurate | Medium | High | Label output "approximate" if confidence low; fallback to voxel-space mapping |
| CORS errors between frontend and backend | Low | Medium | Add FastAPI `CORSMiddleware` allowing `localhost:5173` from day 1 |
| Large NIfTI file slowing upload | Medium | Medium | Cap upload size at 256 MB; downsample to 128³ for rendering only |
| marching_cubes mesh holes | Low | Low | Apply Gaussian smoothing to mask before surface extraction |

---

## 10. Execution Checklist

### Week 1
- [x] `uvicorn main:app --reload` starts at port 8000
- [x] `GET /api/health` returns `{"status":"online"}`
- [x] `npm run dev` starts React app at port 5173
- [x] Sidebar with 5 pages renders in browser
- [x] Atlas files in `backend/data/atlas/`

### Week 2
- [x] `POST /api/upload` returns case summary JSON
- [x] `POST /api/upload` returns 422 on mismatched mask
- [x] `POST /api/reconstruct` returns mesh JSON
- [x] `pytest tests/test_reconstruction.py` passes

### Week 3
- [x] NiiVue renders real MRI brain in browser
- [x] Segmentation mask overlaid in red
- [x] Axial / Coronal / Sagittal MPR slices visible
- [x] Full 3D rotation controls (mouse drag, orientation presets, continuous 360° spin)
- [x] Dashboard Case Analytics & Telemetry Hub implemented (Option 2)

### Week 4
- [ ] `GET /api/location` returns correct region for a known test case
- [ ] Location page renders all fields
- [ ] `pytest tests/test_location.py` passes

### Week 5
- [ ] `GET /api/quiz` returns 5 questions with 4 options each
- [ ] Quiz page renders one question at a time
- [ ] Final results page shows score and answer review

### Week 6
- [ ] `pytest backend/tests/ -v` all pass
- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] Screenshots of all 5 pages taken
- [ ] Demo recording complete
- [ ] Peer usability test passed

---

*Last updated: November 2026*
