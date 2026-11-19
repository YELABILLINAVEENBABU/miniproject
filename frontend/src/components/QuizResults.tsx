import React from 'react';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../types/medical';

interface UserAnswer {
  selectedIndex: number;
  isCorrect: boolean;
}

interface QuizResultsProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  onRetry: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  questions,
  userAnswers,
  onRetry,
}) => {
  const navigate = useNavigate();
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const total = questions.length;
  const percentage = Math.round((correctCount / total) * 100);
  const isPass = percentage >= 70;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Score Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
        </div>

        <div className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border bg-slate-950 border-slate-800 text-slate-300">
          Case Learning Evaluation
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Score: {correctCount} / {total} &nbsp;({percentage}%)
        </h2>

        <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-lg mx-auto">
          {isPass ? (
            <span className="text-emerald-400 font-medium">
              🎉 Outstanding work! You achieved the clinical pass threshold (≥70%) demonstrating solid anatomical and lateralization comprehension.
            </span>
          ) : (
            <span className="text-amber-400 font-medium">
              Needs review: The clinical pass threshold is 70%. Inspect the explanations below to refine your spatial MRI landmark localization.
            </span>
          )}
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-8">
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (Reshuffle)</span>
          </button>

          <button
            onClick={() => navigate('/location')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Brain className="w-4 h-4" />
            <span>Review Tumor Location</span>
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5 text-slate-300 font-semibold text-lg px-1">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h3>Detailed Response & Anatomical Review</h3>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const answer = userAnswers[idx];
            const isCorrect = answer?.isCorrect ?? false;
            const chosenOption = q.options[answer?.selectedIndex ?? 0];
            const correctOption = q.options[q.correctIndex];

            return (
              <div
                key={q.id}
                className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      Category: {q.category}
                    </span>
                  </div>

                  {isCorrect ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base font-medium text-slate-200">
                  {q.stem}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/20 border-rose-500/30 text-rose-200'}`}>
                    <span className="text-slate-400 block mb-0.5">Your Choice:</span>
                    <span className="font-semibold">{chosenOption || 'No response'}</span>
                  </div>

                  {!isCorrect && (
                    <div className="p-3 rounded-xl border bg-emerald-950/20 border-emerald-500/30 text-emerald-200">
                      <span className="text-slate-400 block mb-0.5">Correct Grounded Answer:</span>
                      <span className="font-semibold">{correctOption}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-sky-400 block mb-1">Clinical Explanation:</span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
