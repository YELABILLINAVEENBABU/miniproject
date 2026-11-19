import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  Box,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import type { CaseSummary, DemoPresetInfo } from '../types/medical';

export const DemoLoader: React.FC = () => {
  const navigate = useNavigate();
  const { activeCase, setActiveCase } = useCase();

  const [presets, setPresets] = useState<DemoPresetInfo[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  useEffect(() => {
    fetch('http://localhost:8000/api/demo/cases?limit=500')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch demo cases');
        return res.json();
      })
      .then((data: DemoPresetInfo[]) => {
        if (data && data.length > 0) {
          setPresets(data);
        }
      })
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

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const q = searchQuery.toLowerCase().trim();
    return presets.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.demoId.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [presets, searchQuery]);

  const totalPages = Math.ceil(filteredPresets.length / pageSize) || 1;
  const paginatedPresets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPresets.slice(start, start + pageSize);
  }, [filteredPresets, currentPage, pageSize]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

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
    <div className="bg-gradient-to-br from-slate-900/90 via-sky-950/20 to-slate-900/90 border border-sky-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-base">
                BraTS Medical Case Library
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                {presets.length} Cases Available
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any pre-segmented clinical case for instant 3D exploration and quizzes without uploading.
            </p>
          </div>
        </div>

        {activeCase?.caseId.startsWith('demo-') && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active: {activeCase.caseId.replace('demo-brats-', 'Case ')}</span>
          </span>
        )}
      </div>

      {/* Search Bar & Pagination Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search cases (e.g. 001, 142, Glioblastoma)..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{filteredPresets.length}</strong> matching cases
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {paginatedPresets.map((preset) => {
          const isCurrentActive = activeCase?.caseId === preset.demoId;
          const isLoading = loadingId === preset.demoId;

          return (
            <div
              key={preset.demoId}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isCurrentActive
                  ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    {preset.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    4D NIfTI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Layers className="w-3 h-3 text-sky-400" />
                  <span>240×240×155</span>
                </span>

                <button
                  onClick={() => handleLoadDemo(preset.demoId)}
                  disabled={isLoading}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    isCurrentActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : isCurrentActive ? (
                    <>
                      <span>Open 3D</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Load Case</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPresets.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          No cases match your search query &ldquo;{searchQuery}&rdquo;.
        </div>
      )}
    </div>
  );
};


