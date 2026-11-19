import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RefreshCw,
  Box,
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { DemoLoader } from '../components/DemoLoader';
import type { CaseSummary } from '../types/medical';

export const UploadMRI: React.FC = () => {
  const navigate = useNavigate();
  const { activeCase, setActiveCase } = useCase();

  const [mriFile, setMriFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentUpload, setRecentUpload] = useState<CaseSummary | null>(null);

  const mriInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);

  const handleMriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMriFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMaskFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mriFile || !maskFile) {
      setError('Please select both the MRI volume and segmentation mask files.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('mri_file', mriFile);
    formData.append('mask_file', maskFile);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = 'Upload failed.';
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail || errorDetail;
        } catch {
          errorDetail = `Server responded with status ${response.status}`;
        }
        throw new Error(errorDetail);
      }

      const summary: CaseSummary = await response.json();
      setActiveCase(summary);
      setRecentUpload(summary);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during upload.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Upload Brain MRI Case</h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload paired NIfTI files (<code className="text-sky-400">.nii</code> or <code className="text-sky-400">.nii.gz</code>) or immediately pick from the pre-bundled demo cases below.
        </p>
      </div>

      {/* 1-Click Demo Cases Loader */}
      <DemoLoader />

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Or Upload Custom Files
        </span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MRI Volume Dropzone */}
          <div
            onClick={() => mriInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
              mriFile
                ? 'border-sky-500/80 bg-sky-500/10'
                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-sky-500/50'
            }`}
          >
            <input
              ref={mriInputRef}
              type="file"
              accept=".nii,.nii.gz"
              onChange={handleMriChange}
              className="hidden"
            />
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              mriFile ? 'bg-sky-500 text-white' : 'bg-slate-800 text-sky-400'
            }`}>
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 block text-sm">
                {mriFile ? mriFile.name : 'MRI Volume (.nii / .nii.gz)'}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {mriFile
                  ? `${(mriFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : 'T1, T1ce, T2, or FLAIR sequence'}
              </span>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/80 transition"
            >
              {mriFile ? 'Change File' : 'Browse File'}
            </button>
          </div>

          {/* Mask Dropzone */}
          <div
            onClick={() => maskInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
              maskFile
                ? 'border-red-500/80 bg-red-500/10'
                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-red-500/50'
            }`}
          >
            <input
              ref={maskInputRef}
              type="file"
              accept=".nii,.nii.gz"
              onChange={handleMaskChange}
              className="hidden"
            />
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              maskFile ? 'bg-red-500 text-white' : 'bg-slate-800 text-red-400'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 block text-sm">
                {maskFile ? maskFile.name : 'Tumor Mask (.nii / .nii.gz)'}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {maskFile
                  ? `${(maskFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : 'Ground-truth expert segmentation'}
              </span>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/80 transition"
            >
              {maskFile ? 'Change File' : 'Browse File'}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3 text-red-400 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-300">Validation Error</p>
              <p className="mt-0.5 text-red-400/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            {mriFile && maskFile ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Ready to validate and upload
              </span>
            ) : (
              <span>Select both files to enable custom upload</span>
            )}
          </div>
          <button
            type="submit"
            disabled={!mriFile || !maskFile || loading}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition shadow-lg shadow-sky-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing & Validating...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Validate</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Case Summary Card (Displayed on success or existing active case) */}
      {(recentUpload || activeCase) && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-base">
                  {recentUpload ? 'Upload Validated Successfully' : 'Currently Active Case'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Case ID: {(recentUpload || activeCase)?.caseId}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMriFile(null);
                setMaskFile(null);
                setRecentUpload(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
            >
              <RefreshCw className="w-3 h-3" />
              Upload Another
            </button>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
                Spatial Shape
              </span>
              <span className="font-semibold text-slate-100 text-sm font-mono">
                {(recentUpload || activeCase)?.mriShape.join(' × ')}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
                Voxel Spacing (mm)
              </span>
              <span className="font-semibold text-slate-100 text-sm font-mono">
                {(recentUpload || activeCase)?.spacing.map((s) => s.toFixed(1)).join(' × ')}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
                Tumor Volume
              </span>
              <span className="font-semibold text-emerald-400 text-sm font-mono">
                {(recentUpload || activeCase)?.volumeCm3.toFixed(2)} cm³
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
                Mask Labels
              </span>
              <div className="flex gap-1.5 mt-0.5">
                {(recentUpload || activeCase)?.maskLabels.map((lbl) => (
                  <span
                    key={lbl}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    Label {lbl}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Centroid coordinates if available */}
          {(recentUpload || activeCase)?.centroidMm && (
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-sky-400" />
                <span>Physical Centroid (World mm):</span>
              </div>
              <span className="font-mono text-slate-200">
                X: {(recentUpload || activeCase)?.centroidMm?.[0]} mm, Y:{' '}
                {(recentUpload || activeCase)?.centroidMm?.[1]} mm, Z:{' '}
                {(recentUpload || activeCase)?.centroidMm?.[2]} mm
              </span>
            </div>
          )}

          {/* Next Action Callout */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => navigate('/visualize')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-sky-500/20"
            >
              <span>Proceed to 3D Visualization</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
