import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  Box,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import type { CaseSummary, DemoPresetInfo } from '../types/medical';

export const DemoLoader: React.FC = () => {
  const navigate = useNavigate();
  const { activeCase, setActiveCase } = useCase();

  const [presets, setPresets] = useState<DemoPresetInfo[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/demo/cases')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch demo cases');
        return res.json();
      })
      .then((data: DemoPresetInfo[]) => setPresets(data))
      .catch(() => {
        // Fallback default list if offline
        setPresets([
          {
            demoId: 'demo-brats-001',
            title: 'BraTS Case 001 (Glioblastoma Multiforme)',
            description: 'High-grade glioma with extensive peritumoral edema, necrotic core, and active enhancing rim.',
          },
          {
            demoId: 'demo-brats-002',
            title: 'BraTS Case 002 (Frontal Lobe Lesion)',
            description: 'Secondary frontal resection candidate with distinct non-enhancing and enhancing boundaries.',
          },
        ]);
      });
  }, []);

  const handleLoadDemo = async (demoId: string) => {
    setLoadingId(demoId);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8000/api/demo/load/${demoId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(`Demo load failed with status ${res.status}`);
      }
      const data: CaseSummary = await res.json();
      setActiveCase(data);
      navigate('/visualize');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load demo MRI case.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-sky-950/20 to-slate-900/90 border border-sky-500/20 rounded-2xl p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">
              Try with Pre-Loaded Medical Demo Data
            </h3>
            <p className="text-xs text-slate-400">
              Instant 1-click exploration using genuine Medical Segmentation Decathlon patient volumes.
            </p>
          </div>
        </div>

        {activeCase?.caseId.startsWith('demo-') && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Demo Case Active</span>
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const isCurrentActive = activeCase?.caseId === preset.demoId;
          const isLoading = loadingId === preset.demoId;

          return (
            <div
              key={preset.demoId}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isCurrentActive
                  ? 'bg-sky-500/10 border-sky-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 text-sm flex items-center gap-2">
                    <Box className="w-4 h-4 text-sky-400" />
                    {preset.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    NIfTI 4D
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-400" />
                  <span>240×240×155 voxels</span>
                </span>

                <button
                  onClick={() => handleLoadDemo(preset.demoId)}
                  disabled={isLoading}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isCurrentActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading 3D Model...</span>
                    </>
                  ) : isCurrentActive ? (
                    <>
                      <span>Open 3D View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Demo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

