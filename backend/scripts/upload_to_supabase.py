"""
scripts/upload_to_supabase.py
Uploads all 54 BraTS cases (MRI + mask) to Supabase Storage and populates the `cases` table.
"""

import os
import re
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SERVICE_KEY or "your_supabase" in SERVICE_KEY:
    print("Error: Valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in backend/.env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SERVICE_KEY)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IMAGES_DIR = os.path.join(ROOT_DIR, "data", "images")
LABELS_DIR = os.path.join(ROOT_DIR, "data", "labels")

# Add backend to path for modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from modules.mri_loader import load_nifti
from modules.tumor_segmentation import compute_centroid_mm, compute_volume_cm3
from modules.tumor_location import derive_location


def ensure_bucket(bucket_name: str):
    try:
        supabase.storage.get_bucket(bucket_name)
        print(f"Bucket '{bucket_name}' exists.")
    except Exception:
        try:
            supabase.storage.create_bucket(bucket_name, options={"public": True})
            print(f"Created public bucket '{bucket_name}'.")
        except Exception as e:
            print(f"Note on bucket '{bucket_name}': {e}")


def main():
    print("Connecting to Supabase...")
    ensure_bucket("mri-images")
    ensure_bucket("tumor-labels")

    image_files = set(os.listdir(IMAGES_DIR))
    label_files = set(os.listdir(LABELS_DIR))

    pattern = re.compile(r"^BRATS_(\d+)\.nii\.gz$")
    matched_cases = []

    for img in sorted(image_files):
        m = pattern.match(img)
        if m and img in label_files:
            matched_cases.append((m.group(1), img))

    print(f"Found {len(matched_cases)} matched cases to process and sync to Supabase.")

    for idx, (case_num, filename) in enumerate(matched_cases, 1):
        case_id = f"demo-brats-{case_num}"
        title = f"BraTS Case {case_num}"
        print(f"[{idx}/{len(matched_cases)}] Processing {case_id} ({filename})...")

        img_path = os.path.join(IMAGES_DIR, filename)
        lbl_path = os.path.join(LABELS_DIR, filename)

        # 1. Compute telemetry
        try:
            mask_vol = load_nifti(lbl_path)
            centroid = compute_centroid_mm(mask_vol.data, mask_vol.affine)
            volume_cm3 = compute_volume_cm3(mask_vol.data, mask_vol.spacing)
            loc = derive_location(
                centroid_mm=centroid,
                affine=mask_vol.affine,
                mask_data=mask_vol.data,
                spacing=mask_vol.spacing,
                volume_cm3=volume_cm3,
            )
            region = loc.region_name
            hemisphere = loc.hemisphere
            centroid = loc.mni_coords
        except Exception as e:
            print(f"  Warning: failed to compute telemetry for {case_id}: {e}")
            centroid = (0.0, 0.0, 0.0)
            volume_cm3 = 0.0
            region = "Unknown"
            hemisphere = "Unknown"

        # 2. Upload MRI image
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            supabase.storage.from_("mri-images").upload(
                file=img_bytes,
                path=filename,
                file_options={"content-type": "application/gzip", "upsert": "true"},
            )
        except Exception as e:
            print(f"  MRI upload note for {filename}: {e}")

        # 3. Upload mask label
        try:
            with open(lbl_path, "rb") as f:
                lbl_bytes = f.read()
            supabase.storage.from_("tumor-labels").upload(
                file=lbl_bytes,
                path=filename,
                file_options={"content-type": "application/gzip", "upsert": "true"},
            )
        except Exception as e:
            print(f"  Label upload note for {filename}: {e}")

        # 4. Storage URLs
        img_url = f"{SUPABASE_URL}/storage/v1/object/public/mri-images/{filename}"
        lbl_url = f"{SUPABASE_URL}/storage/v1/object/public/tumor-labels/{filename}"

        # 5. Insert/upsert into cases table
        record = {
            "case_id": case_id,
            "case_number": int(case_num),
            "title": title,
            "description": f"BraTS case {case_num} (NIfTI 4D MRI + Ground Truth Mask).",
            "image_url": img_url,
            "label_url": lbl_url,
            "volume_cm3": volume_cm3,
            "centroid_x": centroid[0],
            "centroid_y": centroid[1],
            "centroid_z": centroid[2],
            "anatomical_region": region,
            "hemisphere": hemisphere,
        }

        try:
            supabase.table("cases").upsert(record).execute()
            print(f"  ✓ {case_id} saved to Supabase (Vol: {volume_cm3:.1f} cm3, {region})")
        except Exception as e:
            print(f"  Database insert note for {case_id}: {e}")

    print("\n✅ Supabase sync complete!")


if __name__ == "__main__":
    main()
