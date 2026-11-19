"""
quiz_generator.py — Phase 5
Generates exactly 5 multiple-choice questions grounded in the loaded TumorLocation case data.

Categories:
1. `lobe`: Anatomical lobe / region identification based on Harvard-Oxford atlas mapping
2. `hemisphere`: Left vs Right vs Midline based on MNI X-coordinate sign
3. `plane`: Optimal clinical slice orientation (Axial, Coronal, Sagittal)
4. `meaning`: Clinical / neurological significance and functional deficit risk
5. `volume`: Lesion volumetric burden (cm³) calculated from voxel integration
"""

from __future__ import annotations
import random
from dataclasses import dataclass
from typing import List
from modules.tumor_location import TumorLocation


@dataclass
class Question:
    id: int
    category: str   # "lobe" | "hemisphere" | "plane" | "meaning" | "volume"
    stem: str
    options: List[str]
    correct_index: int
    explanation: str


def _create_shuffled_question(
    q_id: int,
    category: str,
    stem: str,
    correct_option: str,
    distractors: List[str],
    explanation: str,
) -> Question:
    """Helper to assemble a question with 4 unique options and determine correct_index."""
    # Ensure distinct distractors
    unique_distractors = [d for d in distractors if d != correct_option]
    selected_distractors = unique_distractors[:3]
    while len(selected_distractors) < 3:
        selected_distractors.append(f"Alternative Region {len(selected_distractors) + 1}")

    all_options = [correct_option] + selected_distractors
    # Use deterministic shuffle seeded by question id and correct option to keep options stable
    rng = random.Random(f"{q_id}_{correct_option}_{stem}")
    rng.shuffle(all_options)
    correct_index = all_options.index(correct_option)

    return Question(
        id=q_id,
        category=category,
        stem=stem,
        options=all_options,
        correct_index=correct_index,
        explanation=explanation,
    )


def generate_questions(location: TumorLocation) -> List[Question]:
    """
    Generate exactly 5 case-grounded multiple-choice questions from the TumorLocation data:
    1. Lobe / Region identification
    2. Hemisphere classification
    3. Primary diagnostic plane
    4. Clinical significance & functional risks
    5. Quantitative lesion volume
    """
    questions: List[Question] = []
    region = location.region_name
    hemisphere = location.hemisphere
    plane = location.primary_plane
    vol = location.volume_cm3
    mni = location.mni_coords

    # -------------------------------------------------------------------------
    # Question 1: Lobe / Anatomical Region
    # -------------------------------------------------------------------------
    all_lobes = ["Frontal Lobe", "Temporal Lobe", "Parietal Lobe", "Occipital Lobe", "Subcortical Nuclei"]
    # Determine primary lobe name
    lower_reg = region.lower()
    if "frontal" in lower_reg or "motor" in lower_reg or "opercular" in lower_reg:
        matched_lobe = "Frontal Lobe"
    elif "temporal" in lower_reg or "hippocampus" in lower_reg or "heschl" in lower_reg:
        matched_lobe = "Temporal Lobe"
    elif "parietal" in lower_reg or "postcentral" in lower_reg or "angular" in lower_reg:
        matched_lobe = "Parietal Lobe"
    elif "occipital" in lower_reg or "calcarine" in lower_reg or "lingual" in lower_reg:
        matched_lobe = "Occipital Lobe"
    else:
        matched_lobe = region if len(region) <= 25 else "Frontal Lobe"

    lobe_distractors = [l for l in all_lobes if l != matched_lobe][:3]
    if len(lobe_distractors) < 3:
        lobe_distractors = ["Cerebellar Cortex", "Brainstem", "Insular Cortex"]

    q1 = _create_shuffled_question(
        q_id=1,
        category="lobe",
        stem="Based on Harvard-Oxford atlas registration, in which primary anatomical region or lobe is the tumor centered?",
        correct_option=matched_lobe,
        distractors=lobe_distractors,
        explanation=(
            f"The tumor centroid maps to {region} ({matched_lobe}) at MNI coordinates "
            f"({mni[0]:.1f}, {mni[1]:.1f}, {mni[2]:.1f}) with {round(location.region_probability * 100)}% atlas probability."
        ),
    )
    questions.append(q1)

    # -------------------------------------------------------------------------
    # Question 2: Hemisphere
    # -------------------------------------------------------------------------
    hemi_options = ["Left Hemisphere", "Right Hemisphere", "Midline / Interhemispheric", "Bilateral Symmetrical"]
    correct_hemi_str = f"{hemisphere} Hemisphere" if hemisphere in ["Left", "Right"] else "Midline / Interhemispheric"
    hemi_distractors = [h for h in hemi_options if h != correct_hemi_str][:3]

    sign_exp = (
        f"MNI X coordinate is negative ({mni[0]} mm < -5 mm)"
        if hemisphere == "Left"
        else f"MNI X coordinate is positive ({mni[0]} mm > +5 mm)"
        if hemisphere == "Right"
        else f"MNI X coordinate ({mni[0]} mm) lies within ±5 mm of the cerebral sagittal midline"
    )

    q2 = _create_shuffled_question(
        q_id=2,
        category="hemisphere",
        stem="Which cerebral hemisphere predominantly houses the segmented lesion?",
        correct_option=correct_hemi_str,
        distractors=hemi_distractors,
        explanation=f"Standard neuroimaging coordinates define lateralization by the MNI X-axis: {sign_exp}, confirming {correct_hemi_str}.",
    )
    questions.append(q2)

    # -------------------------------------------------------------------------
    # Question 3: Primary Imaging Plane
    # -------------------------------------------------------------------------
    all_planes = ["Axial (Transverse)", "Coronal (Frontal)", "Sagittal (Lateral)", "Oblique Multiplanar"]
    plane_map = {
        "Axial": "Axial (Transverse)",
        "Coronal": "Coronal (Frontal)",
        "Sagittal": "Sagittal (Lateral)",
    }
    correct_plane_str = plane_map.get(plane, "Axial (Transverse)")
    plane_distractors = [p for p in all_planes if p != correct_plane_str][:3]

    q3 = _create_shuffled_question(
        q_id=3,
        category="plane",
        stem="Which orthogonal slice plane best captures the maximum longitudinal dimension and cross-sectional profile of this tumor?",
        correct_option=correct_plane_str,
        distractors=plane_distractors,
        explanation=(
            f"Principal axis variance of the segmented voxel mask indicates greatest spatial extent along the {plane} orientation, "
            f"making the {correct_plane_str} view the primary clinical reference plane."
        ),
    )
    questions.append(q3)

    # -------------------------------------------------------------------------
    # Question 4: Clinical Meaning & Neurological Risk
    # -------------------------------------------------------------------------
    meaning_scenarios = {
        "Frontal Lobe": (
            "Contralateral hemiparesis, expressive dysphasia (Broca's), or executive cognitive dysfunction",
            [
                "Receptive Wernicke's aphasia and pure word deafness",
                "Homonymous hemianopia with macular sparing",
                "Loss of pain and thermal sensation with preserved proprioception",
            ],
            "Frontal lobe and precentral motor structures govern voluntary motor pathways and motor speech fluency.",
        ),
        "Temporal Lobe": (
            "Receptive language comprehension deficits (Wernicke's), memory encoding impairment, or complex auditory auras",
            [
                "Contralateral lower facial droop and expressive speech arrest",
                "Complete cortical blindness with visual anosognosia (Anton syndrome)",
                "Isolated lower limb tactile extinction",
            ],
            "Temporal regions integrate auditory comprehension (Wernicke's area) and limbic memory consolidation (hippocampus).",
        ),
        "Parietal Lobe": (
            "Contralateral astereognosis, sensory extinction, visuospatial disorientation, or hemispatial neglect",
            [
                "Pure expressive motor aphasia and personality abulia",
                "Bilateral vestibular nystagmus and vertigo",
                "Anterior pituitary hormonal hypersecretion",
            ],
            "Parietal cortical structures (postcentral gyrus, superior parietal lobule) integrate multisensory inputs and spatial mapping.",
        ),
        "Occipital Lobe": (
            "Contralateral homonymous visual field deficits, cortical visual impairment, or visual agnosia",
            [
                "Expressive motor dysphasia and apathy",
                "Sensory ataxia and Romberg's sign",
                "Intention tremor and cerebellar dysmetria",
            ],
            "Occipital striate and extrastriate cortices (Brodmann 17-19) are exclusively dedicated to primary visual processing.",
        ),
    }

    # Pick matching clinical profile based on matched_lobe, or default to Frontal
    profile = meaning_scenarios.get(matched_lobe, meaning_scenarios["Frontal Lobe"])
    correct_meaning = profile[0]
    meaning_distractors = profile[1]
    meaning_exp = profile[2]

    q4 = _create_shuffled_question(
        q_id=4,
        category="meaning",
        stem=f"Considering the involvement of {region} ({matched_lobe}), which clinical neurological deficits represent the primary proximity risk?",
        correct_option=correct_meaning,
        distractors=meaning_distractors,
        explanation=f"{meaning_exp} Nearby structures mapped: {', '.join(location.nearby_structures[:3])}.",
    )
    questions.append(q4)

    # -------------------------------------------------------------------------
    # Question 5: Quantitative Volume
    # -------------------------------------------------------------------------
    correct_vol_str = f"Approximately {vol:.1f} cm³"
    # Construct plausible distractors (0.35x, 2.2x, 4.0x)
    d1 = f"Approximately {max(1.5, vol * 0.35):.1f} cm³"
    d2 = f"Approximately {(vol * 2.1):.1f} cm³"
    d3 = f"Approximately {(vol * 4.2):.1f} cm³"
    vol_distractors = [d1, d2, d3]

    q5 = _create_shuffled_question(
        q_id=5,
        category="volume",
        stem="What is the calculated total volumetric burden of the segmented tumor tissue?",
        correct_option=correct_vol_str,
        distractors=vol_distractors,
        explanation=(
            f"Voxel summation integration multiplied by voxel spacing dimensions yields a total segmented tumor volume of {vol:.2f} cm³."
        ),
    )
    questions.append(q5)

    return questions
