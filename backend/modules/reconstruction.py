"""
reconstruction.py — Phase 2
Extracts 3D surface meshes from MRI volume and tumor segmentation mask
using skimage.measure.marching_cubes.
Downsamples high-resolution volumes to maintain responsive interactive rendering.
"""

from typing import Tuple, Dict, Any, List
import numpy as np
from scipy.ndimage import zoom, gaussian_filter
from skimage.measure import marching_cubes


def downsample_volume(
    volume: np.ndarray,
    spacing: Tuple[float, float, float],
    max_dim: int = 128,
) -> Tuple[np.ndarray, Tuple[float, float, float]]:
    """
    Downsample a 3D volume so no spatial dimension exceeds max_dim.
    Adjusts voxel spacing proportionally to preserve physical millimeter coordinates.
    """
    if volume.ndim > 3:
        # If 4D multimodal volume (e.g. FLAIR/T1/T2), take FLAIR (channel 0) or average
        volume = volume[..., 0]

    current_shape = np.array(volume.shape, dtype=float)
    max_current = max(current_shape)

    if max_current <= max_dim:
        return volume, spacing

    scale_factor = max_dim / max_current
    zoom_factors = (scale_factor, scale_factor, scale_factor)

    downsampled = zoom(volume, zoom_factors, order=1)
    new_spacing = (
        float(spacing[0] / scale_factor),
        float(spacing[1] / scale_factor),
        float(spacing[2] / scale_factor),
    )

    return downsampled, new_spacing


def extract_brain_surface(
    volume_data: np.ndarray,
    spacing: Tuple[float, float, float],
    step_size: int = 2,
) -> Dict[str, Any]:
    """
    Extract outer brain surface mesh from MRI intensity volume using marching cubes.
    Segments brain tissue from background using non-zero intensity filtering.
    """
    downsampled, eff_spacing = downsample_volume(volume_data, spacing, max_dim=128)

    positive_voxels = downsampled[downsampled > 0]
    if len(positive_voxels) == 0:
        return {"vertices": [], "faces": []}

    # Use 10th percentile of positive voxels, or 0.1 * mean, whichever is smaller, to capture brain tissue
    p10 = float(np.percentile(positive_voxels, 10))
    mean_val = float(positive_voxels.mean())
    threshold = min(p10, mean_val * 0.1)

    # Binary mask of brain tissue
    brain_mask = (downsampled > threshold).astype(float)
    if not np.any(brain_mask > 0):
        brain_mask = (downsampled >= threshold).astype(float)

    # Smooth slightly to remove small noisy disconnected voxels
    smoothed = gaussian_filter(brain_mask, sigma=1.0)

    try:
        level = 0.5 if (smoothed.max() > 0.5 and smoothed.min() < 0.5) else smoothed.mean()
        verts, faces, normals, values = marching_cubes(
            smoothed,
            level=level,
            spacing=eff_spacing,
            step_size=step_size,
        )
        return {
            "vertices": np.round(verts, 2).tolist(),
            "faces": faces.tolist(),
        }
    except Exception:
        return {"vertices": [], "faces": []}


def extract_tumor_surface(
    mask_data: np.ndarray,
    spacing: Tuple[float, float, float],
    step_size: int = 1,
) -> Dict[str, Any]:
    """
    Extract 3D surface mesh of segmented tumor mask using marching cubes.
    """
    if mask_data.ndim > 3:
        mask_3d = (mask_data > 0).any(axis=-1).astype(float)
    else:
        mask_3d = (mask_data > 0).astype(float)

    if not np.any(mask_3d > 0):
        return {"vertices": [], "faces": []}

    # Gaussian smooth to prevent staircasing and holes on binary masks
    smoothed = gaussian_filter(mask_3d, sigma=0.8)

    try:
        level = 0.5 if (smoothed.max() > 0.5 and smoothed.min() < 0.5) else smoothed.mean()
        verts, faces, normals, values = marching_cubes(
            smoothed,
            level=level,
            spacing=spacing,
            step_size=step_size,
        )
        return {
            "vertices": np.round(verts, 2).tolist(),
            "faces": faces.tolist(),
        }
    except Exception:
        return {"vertices": [], "faces": []}
