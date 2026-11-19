import React from 'react';
import { 
  MapPin, 
  Compass, 
  Layers, 
  Box, 
  Activity, 
  Brain, 
  Info, 
  CheckCircle2 
} from 'lucide-react';
import type { TumorLocation } from '../types/medical';

interface LocationPanelProps {
  location: TumorLocation;
  caseId: string;
}

// Educational lobe descriptors mapping common neurological knowledge
const getEducationalSummary = (regionName: string, hemisphere: string): { title: string; body: string; functions: string[] } => {
  const lower = regionName.toLowerCase();

  if (lower.includes('frontal') || lower.includes('motor') || lower.includes('opercular')) {
    return {
      title: `${hemisphere} Frontal Lobe & Motor Systems`,
      body: `The Frontal Lobe is the largest cerebral lobe, orchestrating higher-order executive functions, emotional regulation, motor planning, and expressive speech (Broca's area in the dominant hemisphere). Lesions in this region frequently manifest with contralateral motor deficits, subtle behavioral alterations, or expressive aphasia.`,
      functions: ['Voluntary Motor Control', 'Executive Function & Decision Making', 'Expressive Speech (Broca)', 'Working Memory & Attention'],
    };
  } else if (lower.includes('temporal') || lower.includes('hippocampus') || lower.includes('amygdala') || lower.includes('heschl')) {
    return {
      title: `${hemisphere} Temporal Lobe & Limbic Complex`,
      body: `The Temporal Lobe houses primary auditory processing (Heschl's gyrus), receptive language comprehension (Wernicke's area), and essential memory encoding structures (hippocampal formation). Tumors here may produce auditory or olfactory hallucinations, receptive speech difficulties, or localized memory impairments.`,
      functions: ['Auditory Processing', 'Receptive Language (Wernicke)', 'Episodic Memory Formation', 'Emotion & Semantic Processing'],
    };
  } else if (lower.includes('parietal') || lower.includes('postcentral') || lower.includes('angular') || lower.includes('supramarginal')) {
    return {
      title: `${hemisphere} Parietal Lobe & Somatosensory Cortex`,
      body: `The Parietal Lobe integrates multisensory inputs, spatial orientation, and primary somatosensory perception (postcentral gyrus). Lesions can cause contralateral sensory loss, astereognosis, or parietal syndromes such as spatial hemineglect (non-dominant hemisphere) or Gerstmann's syndrome (dominant hemisphere).`,
      functions: ['Primary Somatosensory Integration', 'Visuospatial Orientation', 'Calculation & Literacy', 'Proprioception & Sensory Mapping'],
    };
  } else if (lower.includes('occipital') || lower.includes('cuneus') || lower.includes('calcarine') || lower.includes('lingual')) {
    return {
      title: `${hemisphere} Occipital Lobe & Visual Pathways`,
      body: `The Occipital Lobe is solely dedicated to visual reception and interpretation, centered along the calcarine fissure (Brodmann area 17). Space-occupying lesions in this lobe characteristically present with contralateral homonymous visual field deficits, cortical visual impairment, or visual agnosia.`,
      functions: ['Primary Visual Perception', 'Color & Motion Processing', 'Spatial Frequency Analysis', 'Visual Association & Reading'],
    };
  } else if (lower.includes('thalamus') || lower.includes('basal') || lower.includes('putamen') || lower.includes('caudate') || lower.includes('pallidum') || lower.includes('stem')) {
    return {
      title: `${hemisphere} Deep Subcortical & Nuclear Complex`,
      body: `Subcortical nuclei and deep white matter tracts serve as vital relay hubs for motor coordination, consciousness, and corticospinal signals. Mass effect in these compact spaces may produce motor hemiparesis or cranial nerve dysfunctions due to internal capsule compression.`,
      functions: ['Sensory & Motor Thalamic Gating', 'Extrapyramidal Motor Loops', 'Corticospinal Conduction', 'Arousal & Autonomic Modulation'],
    };
  }

  return {
    title: `${hemisphere} Cerebral Cortical Cortex`,
    body: `The identified region represents an essential cerebral cortical territory mapped via Harvard-Oxford probabilistic criteria. Compression from neoplastic volume can disrupt adjacent white matter association tracts and superficial gray matter architecture.`,
    functions: ['Cortical Association', 'Local Neuropil Integration', 'White Matter Connectivity', 'Cerebral Micro-circuitry'],
  };
};

export const LocationPanel: React.FC<LocationPanelProps> = ({ location, caseId }) => {
  const edu = getEducationalSummary(location.regionName, location.hemisphere);

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Region */}
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atlas Region</span>
            <Brain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
            {location.regionName}
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Harvard-Oxford: {Math.round(location.regionProbability * 100)}% prob</span>
          </div>
        </div>

        {/* Hemisphere */}
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hemisphere</span>
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {location.hemisphere} Hemisphere
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            MNI X = {location.mniCoords[0]} mm
          </div>
        </div>

        {/* Primary Plane */}
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-violet-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Plane</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {location.primaryPlane} View
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Dominant spatial axis
          </div>
        </div>

        {/* Volume */}
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lesion Volume</span>
            <Box className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {location.volumeCm3.toFixed(2)} cm³
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Voxel sum integration
          </div>
        </div>
      </div>

      {/* MNI Coordinate Details & Case Reference */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Standard MNI152 Centroid Coordinates</div>
            <div className="text-sm font-mono font-semibold text-slate-200 mt-0.5">
              X: {location.mniCoords[0]} mm &nbsp;•&nbsp; Y: {location.mniCoords[1]} mm &nbsp;•&nbsp; Z: {location.mniCoords[2]} mm
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-950/60 px-3.5 py-1.5 rounded-lg border border-slate-800/80 font-mono">
          Case Ref: <span className="text-slate-300">{caseId}</span>
        </div>
      </div>

      {/* Nearby Critical Structures */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2.5 text-slate-200 font-semibold mb-3">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3>Nearby Anatomical Structures (within 10mm radius)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Structures mapped from Harvard-Oxford probabilistic criteria surrounding the tumor perimeter. Helps analyze collateral proximity risks:
        </p>

        <div className="flex flex-wrap gap-2.5">
          {location.nearbyStructures && location.nearbyStructures.length > 0 ? (
            location.nearbyStructures.map((structure, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-slate-950/80 border border-slate-700/80 text-slate-200 rounded-xl text-xs font-medium flex items-center space-x-1.5 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
                <span>{structure}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">No adjacent high-probability landmarks mapped within 10mm.</span>
          )}
        </div>
      </div>

      {/* Educational Lobe & Clinical Explainer */}
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2.5 text-sky-400 font-semibold">
          <Info className="w-4 h-4" />
          <h3 className="text-slate-200">{edu.title} — Anatomical & Clinical Overview</h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {edu.body}
        </p>

        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Key Functions & Neural Networks Governed by This Region:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {edu.functions.map((func, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>{func}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

