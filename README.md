<div align="center">

# 🧠 BrainTumor 3D

### An Interactive Brain MRI Visualization and Anatomical Learning Platform

*Upload · Reconstruct · Explore · Learn · Quiz*

---

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![NiiVue](https://img.shields.io/badge/NiiVue-Medical_3D-e11d48?style=flat-square)
![NiBabel](https://img.shields.io/badge/NiBabel-MRI_IO-4ade80?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Completed-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-19%2F19%20Passing-brightgreen?style=flat-square)

</div>

---

> [!IMPORTANT]
> **EDUCATIONAL USE ONLY — NOT A CLINICAL OR DIAGNOSTIC TOOL**
>
> BrainTumor 3D is a student mini-project for learning neuroanatomy and understanding MRI-based tumor localization. It does **not** diagnose tumors, recommend treatment, train AI models, or perform surgical planning. All tumor segmentation masks must be expert-provided. Anatomical location is only reported when supported by atlas registration and validated spatial coordinates.

---

## 📋 Table of Contents

- [Project Objective](#-project-objective)
- [The Two Main Features](#-the-two-main-features)
- [Application Workflow](#-application-workflow)
- [Application Screens](#-application-screens)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Getting Started](#-getting-started)
- [Dataset](#-dataset)
- [Evaluation Criteria](#-evaluation-criteria)
- [Project Scope](#-project-scope)
- [Development Roadmap](#-development-roadmap)

---

## 🎯 Project Objective

To develop an **educational platform** that:

1. Reconstructs brain MRI scans into medically-standard interactive 3D volumetric visualizations
2. Explains the **anatomical location** of segmented tumors using a registered brain atlas
3. Assesses student understanding through an **interactive quiz** grounded in the loaded case

---

## ✨ The Two Main Features

### Feature 1 — Tumor Location Explainer *(Primary)*

The student uploads a brain MRI volume. The backend processes the NIfTI file and its matching expert-provided tumor segmentation mask, reconstructing both into a real volumetric 3D visualization rendered in the browser. The tumor is highlighted. When the student clicks the tumor, an educational information panel appears.

**Information displayed on click:**

| Field | Example |
|-------|---------|
| Tumor Location | Frontal Lobe |
| Hemisphere | Left Hemisphere |
| Anatomical Plane | Axial / Coronal / Sagittal |
| Spatial Coordinates | X: –14 mm, Y: +33 mm, Z: +48 mm |
| Tumor Volume | 23.4 cm³ (calculated from segmentation) |
| Nearby Structures | Motor Cortex, Broca's Area, Internal Capsule |

> [!NOTE]
> The anatomical region is determined using a **registered brain atlas** (Harvard-Oxford) and validated spatial coordinates — never guessed from visual appearance.

---

### Feature 2 — Interactive Student Learning Quiz *(Secondary)*

After exploring the 3D model, students take a short quiz. All questions are **grounded in the loaded case data** — not AI-generated guesses.

**Example questions:**

- In which brain lobe is the highlighted tumor located?
- Is the tumor in the left or right hemisphere?
- Which MRI plane are you currently viewing?
- What does the highlighted red region represent?
- What is the approximate segmented tumor volume?

**Quiz functionality:**

| Feature | Description |
|---------|-------------|
| Format | Multiple-choice — 4 options per question |
| Feedback | Immediate — correct / incorrect shown after each answer |
| Explanations | Educational explanation revealed per question |
| Scoring | Running score + final result with pass/fail |
| Results | Full review with correct answers highlighted |

---

## 🔄 Application Workflow

```
STEP 1 ── Upload MRI Dataset
           Upload NIfTI MRI volume + matching tumor segmentation mask
              ↓
STEP 2 ── 3D Reconstruction  (Backend)
           FastAPI processes NIfTI → returns mesh data + atlas mapping
              ↓
STEP 3 ── 3D Visualization  (Frontend)
           NiiVue renders medical-grade volumetric brain + tumor overlay
              ↓
STEP 4 ── Tumor Location Explainer
           Click tumor → atlas-mapped location, hemisphere, coordinates, volume
              ↓
STEP 5 ── Interactive Learning Quiz
           Answer 5 MCQ questions grounded in the loaded case
              ↓
STEP 6 ── Learning Results
           Score, correct answers, and explanations
```

---

## 🖥️ Application Screens

The application uses a **sidebar navigation layout** with Dashboard as the default landing page.

```
┌──────────────────────┬──────────────────────────────────────────────────┐
│   SIDEBAR            │              MAIN CONTENT                        │
│                      │                                                  │
│  🏠 Dashboard        │  Active page renders here                        │
│  📁 Upload MRI       │                                                  │
│  🧠 3D Visualization │                                                  │
│  📍 Tumor Location   │                                                  │
│  📝 Learning Quiz    │                                                  │
└──────────────────────┴──────────────────────────────────────────────────┘
```

| Page | Purpose |
|------|---------|
| **Dashboard** | Executive Case Overview & Analytics Hub: active case telemetry, clinical metrics (lesion volume, hemisphere, MNI centroid), quiz scorecard, demo case switcher, and system status |
| **Upload MRI** | Upload NIfTI volume + segmentation mask; validate file pairing |
| **3D Visualization** | Medical-grade volumetric 3D brain + tumor overlay; MPR slice views |
| **Tumor Location** | Hemisphere, anatomical region, coordinates, volume, nearby structures |
| **Learning Quiz** | MCQ questions, instant feedback, score, and explanations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│   React + TypeScript + Vite  (port 5173)                       │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│   │  NiiVue.js  │  │  React Pages │  │  Quiz Component    │   │
│   │  3D + MPR   │  │  Sidebar Nav │  │  MCQ + Scoring     │   │
│   └─────────────┘  └──────────────┘  └────────────────────┘   │
│              │  fetch() REST API calls  │                       │
└──────────────┼──────────────────────────┼───────────────────────┘
               ↓                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND  (port 8000)                   │
│                                                                 │
│   POST /api/upload        ← NIfTI upload + validation           │
│   POST /api/reconstruct   ← Surface mesh generation             │
│   GET  /api/location      ← Atlas-mapped tumor location         │
│   GET  /api/quiz          ← Question generation                 │
│   GET  /api/health        ← Server status                       │
│                                                                 │
│   nibabel · numpy · scikit-image · simpleitk · nilearn          │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**
Frontend uploads the NIfTI files → FastAPI processes them in Python → returns structured JSON → React renders the 3D viewer, location panel, and quiz from that JSON.

---

## 🛠️ Technology Stack

### Backend

| Technology | Version | Role |
|-----------|---------|------|
| **Python** | 3.11+ | Primary language |
| **FastAPI** | ≥ 0.111 | REST API framework |
| **Uvicorn** | ≥ 0.29 | ASGI server |
| **NiBabel** | ≥ 5.2 | NIfTI MRI file loading and affine parsing |
| **NumPy** | ≥ 1.26 | Voxel array processing |
| **scikit-image** | ≥ 0.22 | Marching cubes 3D surface extraction |
| **SimpleITK** | ≥ 2.3 | Image geometry and MNI space registration |
| **nilearn** | ≥ 0.10 | Harvard-Oxford atlas access and label lookup |
| **pytest** | ≥ 8.0 | Unit testing |

### Frontend

| Technology | Version | Role |
|-----------|---------|------|
| **React** | 19 | UI component framework |
| **TypeScript** | 5+ | Type-safe development |
| **Vite** | 6+ | Build tool and dev server |
| **NiiVue** | ≥ 0.44 | Medical-grade volumetric 3D brain and MPR slice rendering |
| **Tailwind CSS** | ≥ 3.4 | Styling |

> [!NOTE]
> **Why NiiVue?** NiiVue is a WebGL-based neuroimaging viewer built specifically for medical NIfTI data. It renders real volumetric brain texture with proper intensity windowing, Axial/Coronal/Sagittal MPR slices, and segmentation overlays — the same standard used in clinical research tools like 3D Slicer and Papaya. This is real voxel-based volume rendering, not coloured mesh approximations.

---

## 📁 Project Folder Structure

```
MINI PROJECT/                       # ← repo root (this folder)
│
├── README.md
├── PLAN.md
│
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # FastAPI app entry point, CORS, routes
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── routers/
│   │   ├── upload.py               # POST /api/upload
│   │   ├── reconstruct.py          # POST /api/reconstruct
│   │   ├── location.py             # GET  /api/location
│   │   └── quiz.py                 # GET  /api/quiz
│   │
│   ├── modules/
│   │   ├── mri_loader.py           # NiBabel NIfTI loading and affine parsing
│   │   ├── reconstruction.py       # scikit-image marching cubes surface extraction
│   │   ├── tumor_segmentation.py   # Mask validation, centroid, volume
│   │   ├── tumor_location.py       # Centroid → MNI space → hemisphere + plane
│   │   ├── atlas_mapping.py        # Harvard-Oxford atlas label lookup
│   │   └── quiz_generator.py       # Question generation and scoring
│   │
│   └── tests/
│       ├── test_reconstruction.py
│       └── test_location.py
│
├── frontend/                       # React + TypeScript + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   │
│   └── src/
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # Sidebar router
│       ├── index.css               # Global styles (Tailwind)
│       │
│       ├── pages/
│       │   ├── Dashboard.tsx       # Welcome + navigation cards
│       │   ├── UploadMRI.tsx       # File upload form
│       │   ├── Visualization.tsx   # NiiVue 3D viewer + MPR slices
│       │   ├── TumorLocation.tsx   # Anatomical location panel
│       │   └── LearningQuiz.tsx    # MCQ quiz and results
│       │
│       ├── components/
│       │   ├── Sidebar.tsx         # Navigation sidebar
│       │   ├── NiiVueViewer.tsx    # NiiVue WebGL wrapper component
│       │   ├── LocationPanel.tsx   # Tumor location info card
│       │   ├── QuizQuestion.tsx    # Single question with options
│       │   └── QuizResults.tsx     # Score and answer review
│       │
│       └── types/
│           └── medical.ts          # Shared TypeScript types
│
└── data/                           # Dataset (not committed to git)
    ├── images/                     # 484 MRI volumes  (BRATS_001.nii.gz … )
    ├── labels/                     # 484 tumor masks  (BRATS_001.nii.gz … )
    ├── atlas/                      # Harvard-Oxford atlas (auto-downloaded by nilearn)
    ├── uploads/                    # Temp storage for user-uploaded files via app
    └── dataset.json                # Decathlon metadata
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** with pip
- **Node.js 20+** with npm

### 1. Open the Project

```bash
cd "MINI PROJECT"
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend API: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Navigation & Layout Design
- **Global Sidebar**: Primary navigation bar providing instant access across all functional sections (`Dashboard`, `Upload MRI`, `3D Visualization`, `Tumor Location`, `Learning Quiz`).
- **Dashboard as Analytics & Overview Hub**: Rather than duplicating navigation links, the Dashboard serves as an Executive Case Telemetry Center displaying:
  - Active case clinical geometry & voxel metrics (volume in $\text{cm}^3$, spatial dimensions, voxel spacing)
  - Physical MNI152 centroid coordinates & hemisphere detection
  - Instant 1-click Demo Case Selector
  - Learning scorecard summary and system backend status

### 4. Interactive 3D Viewing & Navigation
- **3D Rotation Controls**: Free mouse drag in 3D mode, directional stepping (`Left`, `Right`, `Top`, `Base`), preset anatomical views (`Anterior`, `Posterior`, `Lateral`), and a continuous `360° Spin` presentation mode.
- **Pre-Loaded Demo Data**: 1-click loading of Medical Segmentation Decathlon BraTS cases directly from the dashboard and upload screens for instant demonstration.
- **NIfTI Binary Streaming**: Automatic format resolution (`.nii.gz`) for WebGL volumetric textures and lesion mask overlays.

### 5. Brain Atlas

No manual download needed. `nilearn` auto-downloads the Harvard-Oxford atlas on first run and caches it in `data/atlas/` automatically.

### 5. Brain Atlas

No manual download needed. `nilearn` auto-downloads the Harvard-Oxford atlas on first run and caches it in `data/atlas/` automatically.

### 6. Dataset

Already extracted and ready at:

```
data/images/    ← 484 MRI volumes  (BRATS_001.nii.gz … BRATS_484.nii.gz)
data/labels/    ← 484 tumor masks  (BRATS_001.nii.gz … BRATS_484.nii.gz)
```

The backend reads directly from these paths. No additional setup needed.

---

## 📦 Dataset

### Medical Segmentation Decathlon — Task01 Brain Tumour ✅ Already downloaded

| Property | Details |
|----------|---------|
| Format | NIfTI `.nii.gz` |
| Modalities | T1, T1ce, T2, FLAIR |
| Labels | 1 = Edema · 2 = Enhancing Tumor · 3 = Necrotic Core |
| Cases | 484 training cases (MRI + mask pairs) |
| License | CC BY-SA 4.0 |
| Source | [medicaldecathlon.com](http://medicaldecathlon.com/) |

Files are extracted into `data/images/` and `data/labels/`. The backend reads from these paths directly.

---

## 📊 Evaluation Criteria

| Criterion | What to Verify |
|-----------|---------------|
| **3D Reconstruction** | Volumetric rendering matches MRI geometry and orientation |
| **Tumor Visualization** | Segmentation overlay aligns with MRI in MPR slices |
| **Location Explainer** | Atlas label matches expected region for the loaded case |
| **Quiz** | Questions generated from case data; scoring is accurate |
| **Usability** | Student completes full workflow without guidance |

---

## ⚠️ Project Scope

### Included
- NIfTI MRI loading and processing (FastAPI + Python)
- 3D volumetric brain rendering with segmentation overlay (NiiVue)
- Axial / Coronal / Sagittal MPR slice views
- Tumor Location Explainer (Harvard-Oxford atlas mapped)
- Interactive Student Learning Quiz (5 grounded MCQ questions)
- React + TypeScript + Vite frontend with sidebar navigation

### Excluded

| Feature | Reason |
|---------|--------|
| Automatic tumor diagnosis | Not a medical device |
| AI model training | Beyond mini-project scope |
| Treatment recommendations | Educational tool only |
| Surgical planning | Outside scope |
| DICOM support | NIfTI format only |

---

## 🗓️ Development Roadmap

| Week | Activity | Deliverable |
|------|----------|-------------|
| **1** | FastAPI scaffold + React app scaffold | Both servers run; health check responds |
| **2** | NIfTI loading, validation, surface extraction | `/api/upload` and `/api/reconstruct` return correct JSON |
| **3** | NiiVue integration, 3D + MPR rendering | Real volumetric brain + tumor overlay in browser |
| **4** | Atlas mapping, Tumor Location Explainer | Location panel shows correct region, hemisphere, volume |
| **5** | Quiz generation and quiz UI | 5 grounded questions with scoring and explanations |
| **6** | Testing, screenshots, documentation | All tests pass; demo complete |

> [!TIP]
> Build and test the backend API with the FastAPI `/docs` interactive page before connecting the frontend. This separates concerns and makes debugging much easier.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**BrainTumor 3D** · Mini-Project · Educational Use Only · Not for Clinical Use

*FastAPI · React · TypeScript · NiiVue · NiBabel*

</div>
