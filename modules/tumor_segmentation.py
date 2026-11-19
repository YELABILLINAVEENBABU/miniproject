"""
tumor_segmentation.py — Phase 2
Validates mask against MRI geometry, computes center-of-mass centroid,
and calculates tumor volume in cm³.
"""

from typing import Tuple, List
import numpy as np


def validate_mask(
    mri_affine: np.ndarray,
    mask_affine: np.ndarray,
    mri_shape: Tuple[int, int, int],
    mask_shape: Tuple[int, int, int],
    atol: float = 1e-2,
) -> None:
    """
    Validate that MRI volume and segmentation mask share the same spatial dimensions and affine orientation.
    Raises ValueError with a clear message if there is a mismatch.
    """
    if mri_shape[:3] != mask_shape[:3]:
        raise ValueError(
            f"Shape mismatch: MRI spatial shape is {mri_shape[:3]} but Mask spatial shape is {mask_shape[:3]}."
        )

    if not np.allclose(mri_affine, mask_affine, atol=atol):
        raise ValueError(
            "Affine matrix mismatch: The orientation/origin of the MRI and mask files do not align."
        )


def compute_centroid_mm(mask_data: np.ndarray, affine: np.ndarray) -> Tuple[float, float, float]:
    """
    Compute the world-space (millimeter) center of mass of nonzero mask voxels.
    Calculates the true center of mass (not bounding-box midpoint).
    """
    if mask_data.ndim > 3:
        mask_3d = np.any(mask_data > 0, axis=-1)
    else:
        mask_3d = mask_data > 0

    indices = np.argwhere(mask_3d)
    if len(indices) == 0:
        return (0.0, 0.0, 0.0)

    # Voxel-space center of mass (mean of indices)
    voxel_centroid = indices.mean(axis=0)

    # Convert voxel coordinate (i, j, k) to world-space mm via affine: [x, y, z, 1]^T = Affine * [i, j, k, 1]^T
    voxel_homo = np.append(voxel_centroid, 1.0)
    world_homo = affine @ voxel_homo

    return (
        round(float(world_homo[0]), 2),
        round(float(world_homo[1]), 2),
        round(float(world_homo[2]), 2),
    )


def compute_volume_cm3(mask_data: np.ndarray, spacing: Tuple[float, float, float]) -> float:
    """
    Compute total tumor volume in cm³:
    volume_mm3 = count(nonzero_voxels) * (spacing_x * spacing_y * spacing_z)
    volume_cm3 = volume_mm3 / 1000.0
    """
    if mask_data.ndim > 3:
        mask_3d = np.any(mask_data > 0, axis=-1)
    else:
        mask_3d = mask_data > 0

    nonzero_count = int(np.count_nonzero(mask_3d))
    voxel_volume_mm3 = float(spacing[0] * spacing[1] * spacing[2])
    total_volume_mm3 = nonzero_count * voxel_volume_mm3
    total_volume_cm3 = total_volume_mm3 / 1000.0

    return round(total_volume_cm3, 2)


def get_mask_labels(mask_data: np.ndarray) -> List[int]:
    """Return sorted unique nonzero label IDs present in the mask."""
    unique_vals = np.unique(mask_data)
    labels = [int(v) for v in unique_vals if v > 0]
    return sorted(labels)
