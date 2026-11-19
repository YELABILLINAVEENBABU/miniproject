import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  HelpCircle, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  Eye, 
  UploadCloud,
  FileQuestion,
  RefreshCw
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { LocationPanel } from '../components/LocationPanel';
import type { TumorLocation as TumorLocationData } from '../types/medical';

export const TumorLocation: React.FC = () => {
  const { activeCase } = useCase();
  const navigate = useNavigate();

  const [location, setLocation] = useState<TumorLocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async (caseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/location?caseId=${encodeURIComponent(caseId)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Failed to fetch location (HTTP ${res.status})`);
      }
      const data: TumorLocationData = await res.json();
      setLocation(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to the location mapping engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCase?.caseId) {
      fetchLocation(activeCase.caseId);
    } else {
      setLocation(null);
    }
  }, [activeCase?.caseId]);

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tumor Location Explainer</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 ml-10">
            Harvard-Oxford probabilistic atlas registration and MNI152 coordinate mapping for student comprehension.
          </p>
        </div>

        {activeCase && location && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchLocation(activeCase.caseId)}
              title="Refresh Atlas Mapping"
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-sky-500/10 transition-all hover:shadow-sky-500/25 cursor-pointer"
            >
              <span>Take the Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* No Active Case State */}
      {!activeCase && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">No Active Brain MRI Case Selected</h3>
            <p className="text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
              To view real-time atlas registration and location metrics, upload a new MRI scan or select a pre-loaded BraTS specimen from the Dashboard.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload MRI</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Explore Dashboard Cases</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {activeCase && loading && (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <div>
            <h4 className="text-base font-semibold text-white">Computing Atlas Registration...</h4>
            <p className="text-xs text-slate-400 mt-1">
              Evaluating Harvard-Oxford Cortical & Subcortical probability matrices against MNI centroid coordinates.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {activeCase && !loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-300 flex items-start space-x-4">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="text-sm font-semibold text-rose-200">Failed to Map Tumor Location</div>
            <div className="text-xs text-rose-300/90">{error}</div>
            <button
              onClick={() => fetchLocation(activeCase.caseId)}
              className="text-xs underline hover:text-white pt-1 block cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success / Loaded Data */}
      {activeCase && !loading && location && (
        <div className="space-y-6">
          <LocationPanel location={location} caseId={activeCase.caseId} />

          {/* Action Bar Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>Ready to test your comprehension of this lesion's anatomical implications?</span>
            </div>
            <button
              onClick={() => navigate('/quiz')}
              className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm rounded-xl shadow-lg shadow-sky-500/10 transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>Take the Quiz →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TumorLocation;
