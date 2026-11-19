"""
atlas_mapping.py — Phase 4
Queries the Harvard-Oxford Cortical and Subcortical atlases for anatomical region labeling
and nearby structures.
"""

from __future__ import annotations
import os
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import nibabel as nib
import numpy as np

# Cache atlas data in memory so queries are instantaneous
_ATLAS_CACHE: Dict[str, dict] = {}

ATLAS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "atlas", "data", "atlases")
)


@dataclass
class AtlasHit:
    region_name: str
    probability: float


def _parse_atlas_labels(xml_path: str) -> Dict[int, str]:
    """Parse Harvard-Oxford XML file into index -> region name mapping."""
    if not os.path.exists(xml_path):
        return {}
    try:
        tree = ET.parse(xml_path)
        labels = {}
        for l in tree.getroot().findall(".//label"):
            idx = int(l.get("index", 0))
            # Clean label text
            name = (l.text or "").strip()
            labels[idx] = name
        return labels
    except Exception:
        return {}


def _get_atlas_data() -> dict:
    """Load and cache Harvard-Oxford Cortical & Subcortical probability maps and labels."""
    if "data" in _ATLAS_CACHE:
        return _ATLAS_CACHE["data"]

    cort_xml = os.path.join(ATLAS_DIR, "HarvardOxford-Cortical.xml")
    sub_xml = os.path.join(ATLAS_DIR, "HarvardOxford-Subcortical.xml")
    cort_prob_path = os.path.join(ATLAS_DIR, "HarvardOxford", "HarvardOxford-cort-prob-2mm.nii.gz")
    sub_prob_path = os.path.join(ATLAS_DIR, "HarvardOxford", "HarvardOxford-sub-prob-2mm.nii.gz")

    cort_labels = _parse_atlas_labels(cort_xml)
    sub_labels = _parse_atlas_labels(sub_xml)

    cort_img = nib.load(cort_prob_path) if os.path.exists(cort_prob_path) else None
    sub_img = nib.load(sub_prob_path) if os.path.exists(sub_prob_path) else None

    cort_data = cort_img.get_fdata() if cort_img is not None else None
    sub_data = sub_img.get_fdata() if sub_img is not None else None

    cort_inv_affine = np.linalg.inv(cort_img.affine) if cort_img is not None else None
    sub_inv_affine = np.linalg.inv(sub_img.affine) if sub_img is not None else None

    atlas_dict = {
        "cort_img": cort_img,
        "sub_img": sub_img,
        "cort_data": cort_data,
        "sub_data": sub_data,
        "cort_labels": cort_labels,
        "sub_labels": sub_labels,
        "cort_inv_affine": cort_inv_affine,
        "sub_inv_affine": sub_inv_affine,
    }
    _ATLAS_CACHE["data"] = atlas_dict
    return atlas_dict


def mni_to_voxel(
    mni_coords: Tuple[float, float, float],
    inv_affine: np.ndarray,
) -> Tuple[int, int, int]:
    """Convert continuous MNI mm coordinates to nearest atlas voxel index."""
    pt = np.array([mni_coords[0], mni_coords[1], mni_coords[2], 1.0], dtype=float)
    vox = inv_affine @ pt
    vox_round = np.round(vox[:3]).astype(int)
    return int(vox_round[0]), int(vox_round[1]), int(vox_round[2])


def query_atlas(
    mni_coords: Tuple[float, float, float],
    min_prob_threshold: float = 0.25,
) -> List[AtlasHit]:
    """
    Return atlas hits with probability >= min_prob_threshold (default 25%), sorted descending.
    If exact voxel probability is below threshold, samples a small 3x3x3 neighborhood.
    Queries both Cortical and Subcortical Harvard-Oxford atlases.
    """
    cache = _get_atlas_data()
    hits: List[AtlasHit] = []

    # 1. Query Cortical Atlas
    cort_data = cache.get("cort_data")
    cort_inv = cache.get("cort_inv_affine")
    cort_labels = cache.get("cort_labels", {})

    if cort_data is not None and cort_inv is not None:
        vx, vy, vz = mni_to_voxel(mni_coords, cort_inv)
        sx, sy, sz, n_cort = cort_data.shape

        if 0 <= vx < sx and 0 <= vy < sy and 0 <= vz < sz:
            probs = cort_data[vx, vy, vz]  # 0 to 100
            for idx, p in enumerate(probs):
                norm_p = float(p) / 100.0 if p > 1.0 else float(p)
                if norm_p >= min_prob_threshold:
                    name = cort_labels.get(idx, f"Cortical Area {idx}")
                    hits.append(AtlasHit(region_name=name, probability=round(norm_p, 3)))

    # 2. Query Subcortical Atlas
    sub_data = cache.get("sub_data")
    sub_inv = cache.get("sub_inv_affine")
    sub_labels = cache.get("sub_labels", {})

    if sub_data is not None and sub_inv is not None:
        vx, vy, vz = mni_to_voxel(mni_coords, sub_inv)
        sx, sy, sz, n_sub = sub_data.shape

        if 0 <= vx < sx and 0 <= vy < sy and 0 <= vz < sz:
            probs = sub_data[vx, vy, vz]
            for idx, p in enumerate(probs):
                norm_p = float(p) / 100.0 if p > 1.0 else float(p)
                if norm_p >= min_prob_threshold:
                    name = sub_labels.get(idx, f"Subcortical Area {idx}").strip()
                    hits.append(AtlasHit(region_name=name, probability=round(norm_p, 3)))

    # 3. If no hit >= min_prob_threshold at exact voxel, search 3x3x3 neighborhood
    if not hits:
        best_name = None
        best_p = 0.0

        if cort_data is not None and cort_inv is not None:
            vx, vy, vz = mni_to_voxel(mni_coords, cort_inv)
            sx, sy, sz, _ = cort_data.shape
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for dz in (-1, 0, 1):
                        nx, ny, nz = vx + dx, vy + dy, vz + dz
                        if 0 <= nx < sx and 0 <= ny < sy and 0 <= nz < sz:
                            max_idx = int(np.argmax(cort_data[nx, ny, nz]))
                            val = float(cort_data[nx, ny, nz, max_idx]) / 100.0
                            if val > best_p:
                                best_p = val
                                best_name = cort_labels.get(max_idx, f"Cortical Area {max_idx}")

        if sub_data is not None and sub_inv is not None:
            vx, vy, vz = mni_to_voxel(mni_coords, sub_inv)
            sx, sy, sz, _ = sub_data.shape
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for dz in (-1, 0, 1):
                        nx, ny, nz = vx + dx, vy + dy, vz + dz
                        if 0 <= nx < sx and 0 <= ny < sy and 0 <= nz < sz:
                            max_idx = int(np.argmax(sub_data[nx, ny, nz]))
                            val = float(sub_data[nx, ny, nz, max_idx]) / 100.0
                            if val > best_p:
                                best_p = val
                                best_name = sub_labels.get(max_idx, f"Subcortical Area {max_idx}").strip()

        if best_name and best_p >= 0.10:
            hits.append(AtlasHit(region_name=best_name, probability=round(best_p, 3)))

    # Sort descending by probability
    hits.sort(key=lambda h: h.probability, reverse=True)
    return hits


def find_nearby_structures(
    mni_coords: Tuple[float, float, float],
    radius_mm: float = 10.0,
) -> List[str]:
    """
    Return distinct structure names located within radius_mm of mni_coords.
    Queries both Cortical and Subcortical Harvard-Oxford atlases.
    If no structures are within radius, returns ['Not Mapped'].
    """
    cache = _get_atlas_data()
    found_structures: set[str] = set()

    # Sample spherical shell grid around mni_coords
    step_mm = max(2.0, radius_mm / 3.0)
    steps = int(np.ceil(radius_mm / step_mm))
    deltas = [i * step_mm for i in range(-steps, steps + 1)]

    cort_data = cache.get("cort_data")
    cort_inv = cache.get("cort_inv_affine")
    cort_labels = cache.get("cort_labels", {})

    sub_data = cache.get("sub_data")
    sub_inv = cache.get("sub_inv_affine")
    sub_labels = cache.get("sub_labels", {})

    for dx in deltas:
        for dy in deltas:
            for dz in deltas:
                dist = np.sqrt(dx * dx + dy * dy + dz * dz)
                if dist > radius_mm:
                    continue

                sample_mni = (mni_coords[0] + dx, mni_coords[1] + dy, mni_coords[2] + dz)

                # Cortical check
                if cort_data is not None and cort_inv is not None:
                    vx, vy, vz = mni_to_voxel(sample_mni, cort_inv)
                    sx, sy, sz, _ = cort_data.shape
                    if 0 <= vx < sx and 0 <= vy < sy and 0 <= vz < sz:
                        p_arr = cort_data[vx, vy, vz]
                        max_i = int(np.argmax(p_arr))
                        if p_arr[max_i] >= 20:  # Prob >= 20%
                            lbl = cort_labels.get(max_i)
                            if lbl and lbl != "Background":
                                found_structures.add(lbl.strip())

                # Subcortical check
                if sub_data is not None and sub_inv is not None:
                    vx, vy, vz = mni_to_voxel(sample_mni, sub_inv)
                    sx, sy, sz, _ = sub_data.shape
                    if 0 <= vx < sx and 0 <= vy < sy and 0 <= vz < sz:
                        p_arr = sub_data[vx, vy, vz]
                        max_i = int(np.argmax(p_arr))
                        if p_arr[max_i] >= 20:
                            lbl = sub_labels.get(max_i)
                            if lbl and lbl != "Background":
                                found_structures.add(lbl.strip())

    if not found_structures:
        return ["Not Mapped"]

    return sorted(list(found_structures))
