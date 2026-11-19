import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Loader2, 
  AlertCircle, 
  UploadCloud, 
  Eye, 
  FileQuestion,
  RotateCcw
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { QuizQuestion } from '../components/QuizQuestion';
import { QuizResults } from '../components/QuizResults';
import type { Question } from '../types/medical';

interface UserAnswer {
  selectedIndex: number;
  isCorrect: boolean;
}

export const LearningQuiz: React.FC = () => {
  const { activeCase } = useCase();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const fetchQuiz = async (caseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/quiz?caseId=${encodeURIComponent(caseId)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Failed to fetch quiz (HTTP ${res.status})`);
      }
      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setUserAnswers([]);
      setIsCompleted(false);
    } catch (err: any) {
      setError(err.message || 'Error generating quiz for this case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCase?.caseId) {
      fetchQuiz(activeCase.caseId);
    } else {
      setQuestions([]);
    }
  }, [activeCase?.caseId]);

  const handleAnswerSubmit = (selectedIndex: number, isCorrect: boolean) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { selectedIndex, isCorrect };
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRetry = () => {
    if (activeCase?.caseId) {
      fetchQuiz(activeCase.caseId);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Learning Quiz</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 ml-10">
            5 multiple-choice questions dynamically grounded in your active brain lesion and Harvard-Oxford registration.
          </p>
        </div>

        {activeCase && questions.length > 0 && !isCompleted && (
          <button
            onClick={handleRetry}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        )}
      </div>

      {/* No Active Case Selected */}
      {!activeCase && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">No Active Brain MRI Case</h3>
            <p className="text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
              The quiz tests real anatomical questions grounded in a loaded patient case. Please select or upload a case first.
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
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Select Demo Case</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {activeCase && loading && (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div>
            <h4 className="text-base font-semibold text-white">Generating Case-Grounded Questions...</h4>
            <p className="text-xs text-slate-400 mt-1">
              Extracting MNI metrics, atlas lobe boundaries, and volumetric burden for {activeCase.caseId}.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {activeCase && !loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-300 flex items-start space-x-4">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="text-sm font-semibold text-rose-200">Failed to Generate Case Quiz</div>
            <div className="text-xs text-rose-300/90">{error}</div>
            <button
              onClick={() => fetchQuiz(activeCase.caseId)}
              className="text-xs underline hover:text-white pt-1 block cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Active Quiz Flow */}
      {activeCase && !loading && questions.length > 0 && !isCompleted && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Progress</span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <QuizQuestion
            key={questions[currentIndex].id}
            question={questions[currentIndex]}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswerSubmit={handleAnswerSubmit}
            onNext={handleNext}
            isLastQuestion={currentIndex === questions.length - 1}
          />
        </div>
      )}

      {/* Results View */}
      {activeCase && !loading && isCompleted && questions.length > 0 && (
        <QuizResults
          questions={questions}
          userAnswers={userAnswers}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default LearningQuiz;
