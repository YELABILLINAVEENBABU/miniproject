import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  MapPin,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { NiiVueViewer } from '../components/NiiVueViewer';

export const Visualization: React.FC = () => {
  const navigate = useNavigate();
  const { activeCase } = useCase();

  const [clickedVoxel, setClickedVoxel] = useState<{
    mni: [number, number, number];
    value: number;
  } | null>(null);

  // If no case is uploaded yet
  if (!activeCase) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
          <Layers className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">No Active MRI Case Loaded</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Please upload a paired brain MRI scan and segmentation mask first to initialize volumetric 3D rendering.
          </p>
        </div>
        <div>
          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm transition shadow-lg shadow-sky-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Go to Upload MRI</span>
          </Link>
        </div>
      </div>
    );
  }

  const mriStreamUrl = `http://localhost:8000/api/files/${activeCase.caseId}/mri.nii.gz`;
  const maskStreamUrl = `http://localhost:8000/api/files/${activeCase.caseId}/mask.nii.gz`;

  // Determine if clicked voxel is in the tumor mask area
  const isTumorClicked = clickedVoxel && clickedVoxel.value > 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1.5">
            <Activity className="w-3 h-3" />
            <span>Case Active: {activeCase.caseId.slice(0, 8)}...</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Volumetric 3D & Multiplanar Viewer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real voxel-based NIfTI volumetric rendering with Axial, Coronal, Sagittal MPR and red tumor mask overlay.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/location')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View Full Location &rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: 3D Viewer + Right Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* NiiVue Quad Viewer (spans 3 columns) */}
        <div className="lg:col-span-3 h-[640px] flex flex-col">
          <NiiVueViewer
            mriUrl={mriStreamUrl}
            maskUrl={maskStreamUrl}
            onVoxelClick={(coords) => setClickedVoxel(coords)}
          />
        </div>

        {/* Right Inspection & Localization Panel (1 column) */}
        <div className="space-y-5">
          {/* Active Case Summary Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Case Metadata
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Loaded
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Dimensions:</span>
                <span className="font-mono text-slate-200 font-medium">
                  {activeCase.mriShape.join(' × ')} voxels
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Voxel Spacing:</span>
                <span className="font-mono text-slate-200 font-medium">
                  {activeCase.spacing.map((s) => s.toFixed(1)).join(' × ')} mm
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Segmented Tumor Volume:</span>
                <span className="font-mono text-emerald-400 font-semibold text-sm">
                  {activeCase.volumeCm3.toFixed(2)} cm³
                </span>
              </div>

              {activeCase.centroidMm && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Tumor Centroid (World mm):</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    [{activeCase.centroidMm.join(', ')}]
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Click / Tumor Inspector */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
              <Layers className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Voxel Inspector
              </h3>
            </div>

            {clickedVoxel ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Crosshair Coordinate:</span>
                  <span className="font-mono text-sky-400 font-semibold text-sm">
                    X: {clickedVoxel.mni[0]} mm, Y: {clickedVoxel.mni[1]} mm, Z: {clickedVoxel.mni[2]} mm
                  </span>
                </div>

                {isTumorClicked ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1.5 text-red-300">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Tumor Voxel Highlighted</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-red-300/90">
                      You clicked within the segmented lesion mask. Centroid maps to the{' '}
                      <strong>{clickedVoxel.mni[0] < -5 ? 'Left Hemisphere' : clickedVoxel.mni[0] > 5 ? 'Right Hemisphere' : 'Midline'}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 text-[11px]">
                    Normal brain parenchyma voxel selected. Click anywhere on the red mask overlay to inspect tumor anatomy.
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to="/location"
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs transition shadow-md shadow-sky-500/20"
                  >
                    <span>Atlas Location Explainer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-2 text-slate-500 text-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <p>Click anywhere in the MPR canvas or red tumor mask to inspect voxel coordinates and anatomy.</p>
              </div>
            )}
          </div>

          {/* Quick Step Navigation */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Next Step:</span>
            <Link
              to="/quiz"
              className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
            >
              <span>Take Quiz</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
