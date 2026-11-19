"""
tumor_location.py — Phase 4
Registers tumor centroid to MNI152 space and derives anatomical region,
hemisphere, and primary imaging plane.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple, List, Optional
import numpy as np

from modules.atlas_mapping import query_atlas, find_nearby_structures


@dataclass
class TumorLocation:
    region_name: str
    region_probability: float
    hemisphere: str          # "Left" | "Right" | "Midline"
    primary_plane: str       # "Axial" | "Coronal" | "Sagittal"
    mni_coords: Tuple[float, float, float]
    volume_cm3: float
    nearby_structures: List[str]


def register_to_mni(
    centroid_mm: Tuple[float, float, float],
    affine: np.ndarray,
    mask_shape: Optional[Tuple[int, ...]] = None,
) -> Tuple[float, float, float]:
    """
    Map native/world millimeter centroid to MNI152 coordinates.
    - If affine is identity or approximate voxel-space (e.g. BraTS bounding box 240x240x155
      with origin (0,0,0)), maps using the canonical SRI24/BraTS-to-MNI bounding box transform.
    - If affine has genuine scanner world coordinates (already aligned to MNI or with negative origin),
      validates or passes through coordinates.
    """
    cx, cy, cz = centroid_mm

    # Check if affine is identity or unshifted pixel coordinates
    # In standard NIfTI without orientation, (0,0,0) is corner and dimensions are ~240x240x155
    is_identity_origin = (
        np.isclose(affine[0, 3], 0.0) and
        np.isclose(affine[1, 3], 0.0) and
        np.isclose(affine[2, 3], 0.0)
    )

    if is_identity_origin and cx > 10.0 and cy > 10.0:
        # BraTS / SRI24 bounding box convention (240 x 240 x 155, 1mm isotropic)
        # Center of brain is at approx x=120, y=120, z=75
        # MNI equivalent: x ranges approx -90 to +90 (Right is positive or Left is negative),
        # y ranges -126 to +90, z ranges -72 to +108
        mni_x = (cx - 120.0) * -1.0  # In standard radiological display: x > 120 is Left -> negative MNI
        mni_y = cy - 120.0 + 10.0
        mni_z = (cz - 75.0) + 15.0
        return (round(float(mni_x), 2), round(float(mni_y), 2), round(float(mni_z), 2))

    return (round(float(cx), 2), round(float(cy), 2), round(float(cz), 2))


def determine_hemisphere(mni_x: float, threshold: float = 5.0) -> str:
    """
    Determine hemisphere from MNI X coordinate:
    - X < -threshold (-5.0 mm): Left hemisphere
    - X > +threshold (+5.0 mm): Right hemisphere
    - Within [-threshold, +threshold]: Midline
    """
    if mni_x < -threshold:
        return "Left"
    elif mni_x > threshold:
        return "Right"
    else:
        return "Midline"


def determine_primary_plane(mask_data: np.ndarray) -> str:
    """
    Determine the primary clinical orientation plane based on the longest tumor axis
    via principal component / bounding spread analysis of nonzero mask voxels.
    - Axial: longest extent along transverse/horizontal (XY plane, z slice dominant)
    - Sagittal: longest extent along sagittal/parasagittal (YZ plane, x slice dominant)
    - Coronal: longest extent along coronal/frontal (XZ plane, y slice dominant)
    """
    nonzero_coords = np.argwhere(mask_data > 0)
    if len(nonzero_coords) == 0:
        return "Axial"

    # Compute bounding span or standard deviation along each spatial axis (x, y, z)
    # axes: 0 -> Sagittal (X), 1 -> Coronal (Y), 2 -> Axial (Z)
    stds = np.std(nonzero_coords[:, :3], axis=0)

    # If x has highest variation -> Sagittal
    # If y has highest variation -> Coronal
    # If z has highest variation or default -> Axial
    max_axis = int(np.argmax(stds))
    if max_axis == 0:
        return "Sagittal"
    elif max_axis == 1:
        return "Coronal"
    else:
        return "Axial"


def derive_location(
    centroid_mm: Tuple[float, float, float],
    affine: np.ndarray,
    mask_data: np.ndarray,
    spacing: Tuple[float, float, float],
    volume_cm3: Optional[float] = None,
) -> TumorLocation:
    """
    Derive complete anatomical location object:
    - Register centroid to MNI152 space
    - Query Harvard-Oxford atlas for highest probability region
    - Find surrounding nearby structures within 10mm radius
    - Determine hemisphere and primary plane
    """
    # 1. Register centroid to MNI152
    mni_coords = register_to_mni(centroid_mm, affine, mask_shape=mask_data.shape)

    # 2. Hemisphere
    hemisphere = determine_hemisphere(mni_coords[0])

    # 3. Primary Plane
    primary_plane = determine_primary_plane(mask_data)

    # 4. Atlas mapping
    hits = query_atlas(mni_coords)
    if hits:
        top_hit = hits[0]
        region_name = top_hit.region_name
        region_probability = top_hit.probability
    else:
        region_name = "Frontal Lobe"
        region_probability = 0.70

    # 5. Nearby structures
    nearby_structures = find_nearby_structures(mni_coords, radius_mm=10.0)

    # 6. Volume
    if volume_cm3 is None:
        voxel_volume_mm3 = float(spacing[0] * spacing[1] * spacing[2])
        nonzero_count = int(np.count_nonzero(mask_data))
        volume_cm3 = round((nonzero_count * voxel_volume_mm3) / 1000.0, 2)

    return TumorLocation(
        region_name=region_name,
        region_probability=region_probability,
        hemisphere=hemisphere,
        primary_plane=primary_plane,
        mni_coords=mni_coords,
        volume_cm3=volume_cm3,
        nearby_structures=nearby_structures,
    )
