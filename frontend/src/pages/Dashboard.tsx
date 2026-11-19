import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Layers,
  MapPin,
  HelpCircle,
  Box,
  UploadCloud,
  ArrowRight,
  ShieldAlert,
  Server,
  BookOpen,
  Award,
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { DemoLoader } from '../components/DemoLoader';
import type { HealthStatus } from '../types/medical';

export const Dashboard: React.FC = () => {
  const { activeCase } = useCase();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [backendError, setBackendError] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data: HealthStatus) => setHealth(data))
      .catch(() => setBackendError(true));
  }, []);

  // Compute hemisphere from centroid x if available
  const hemisphere = activeCase?.centroidMm
    ? activeCase.centroidMm[0] < -5
      ? 'Left Hemisphere'
      : activeCase.centroidMm[0] > 5
      ? 'Right Hemisphere'
      : 'Midline'
    : null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header & Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Activity className="w-3.5 h-3.5" />
            <span>Executive Case Telemetry & Overview</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            BrainTumor 3D Analytics Hub
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Welcome to the neuroanatomy learning workspace. Monitor active case spatial geometry, review calculated tumor volume metrics, inspect atlas registration status, and switch between clinical demonstration cases.
          </p>

          {activeCase ? (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/visualize"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-sky-500/20"
              >
                <Box className="w-4 h-4" />
                <span>Open 3D Viewer ({activeCase.caseId.slice(0, 14)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/location"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atlas Explainer</span>
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <Link
                to="/upload"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-sky-500/20"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Custom NIfTI Pair</span>
              </Link>
            </div>
          )}
        </div>

        {/* Engine System Status Widget */}
        <div className="mt-6 sm:mt-0 sm:absolute sm:top-8 sm:right-8 bg-slate-950/70 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-col space-y-2.5 min-w-[230px]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            Backend Services
          </span>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">FastAPI API:</span>
            {health ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Port 8000
              </span>
            ) : backendError ? (
              <span className="text-amber-400 font-medium">Offline</span>
            ) : (
              <span className="text-slate-400">Connecting...</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Harvard-Oxford:</span>
            <span className="text-slate-300 font-mono text-[11px]">
              {health?.atlasLoaded ? 'Ready (2mm MNI)' : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-300">Session Case:</span>
            {activeCase ? (
              <span className="text-sky-400 font-mono text-[11px] truncate max-w-[110px]" title={activeCase.caseId}>
                {activeCase.caseId}
              </span>
            ) : (
              <span className="text-slate-500 italic">None selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Case Clinical Telemetry Grid */}
      {activeCase ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Active Case Clinical Telemetry</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ID: {activeCase.caseId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Tumor Volume */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lesion Volume
                </span>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {activeCase.volumeCm3.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-400">cm³</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Calculated via 3D voxel count × spacing integration
              </p>
            </div>

            {/* Metric 2: Spatial Matrix & Spacing */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Voxel Matrix
                </span>
                <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {activeCase.mriShape.join(' × ')}
              </div>
              <p className="text-[11px] text-slate-500">
                Spacing: {activeCase.spacing.map((s) => s.toFixed(1)).join(' × ')} mm isotropic
              </p>
            </div>

            {/* Metric 3: Hemisphere Localization */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Brain Hemisphere
                </span>
                <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </span>
              </div>
              <div className="text-lg font-bold text-purple-300">
                {hemisphere || 'Midline'}
              </div>
              <p className="text-[11px] text-slate-500">
                MNI Centroid: [{activeCase.centroidMm?.join(', ') || '0, 0, 0'}] mm
              </p>
            </div>

            {/* Metric 4: Mask Components */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lesion Sub-Regions
                </span>
                <span className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeCase.maskLabels.map((lbl) => (
                  <span
                    key={lbl}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {lbl === 1 ? '1: Edema' : lbl === 2 ? '2: Enhancing' : lbl === 3 ? '3: Necrotic' : `Label ${lbl}`}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Multimodal segmentation breakdown
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Notice when no case loaded */
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Patient Case Loaded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select one of the pre-loaded medical demo cases below to immediately inspect 3D volumetric MRI and start exploring.
          </p>
        </div>
      )}

      {/* Demo Cases Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>Pre-Loaded Medical Demo Cases</span>
          </h2>
          <span className="text-xs text-slate-400">
            Medical Segmentation Decathlon (Task01 Brain Tumour)
          </span>
        </div>
        <DemoLoader />
      </div>

      {/* Learning Status & Quick Quiz Preview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Interactive Neuroanatomy Quiz
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              5 multiple-choice questions dynamically grounded in the active case's spatial location and tumor volume.
            </p>
          </div>
        </div>

        <Link
          to="/quiz"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-purple-600/20 self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Launch Quiz</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
