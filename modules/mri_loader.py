"""
mri_loader.py — Phase 2
Loads NIfTI MRI volumes using NiBabel.
Extracts affine matrix, voxel spacing, spatial shape, and voxel data.
Handles both 3D volumes and 4D multimodal volumes (e.g., BraTS T1, T1ce, T2, FLAIR).
"""

from dataclasses import dataclass
from typing import Tuple, Union
import numpy as np
import nibabel as nib


@dataclass
class MriVolume:
    data: np.ndarray
    affine: np.ndarray
    spacing: Tuple[float, float, float]
    shape: Tuple[int, int, int]


def load_nifti(file_or_path: Union[str, bytes]) -> MriVolume:
    """
    Load a NIfTI file from path or bytes and return an MriVolume dataclass.
    If the volume is 4D (e.g. 4 modalities), extracts spatial dimensions and spacing.
    """
    if isinstance(file_or_path, bytes):
        file_map = nib.FileHolder(fileobj=nib.io_orientation.io.BytesIO(file_or_path))
        img = nib.Nifti1Image.from_file_map({'image': file_map})
    else:
        img = nib.load(file_or_path)

    data = np.asarray(img.dataobj, dtype=np.float32)
    affine = img.affine
    zooms = img.header.get_zooms()

    # Spatial 3D shape and spacing
    spatial_shape = (int(img.shape[0]), int(img.shape[1]), int(img.shape[2]))
    spatial_spacing = (float(zooms[0]), float(zooms[1]), float(zooms[2]))

    return MriVolume(
        data=data,
        affine=affine,
        spacing=spatial_spacing,
        shape=spatial_shape,
    )
