import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  HelpCircle,
  Info
} from 'lucide-react';
import type { Question } from '../types/medical';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (selectedIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  lobe: 'Anatomical Lobe',
  hemisphere: 'Lateralization & Hemisphere',
  plane: 'Diagnostic MRI Orientation',
  meaning: 'Functional Deficit Risk',
  volume: 'Volumetric Burden',
};

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSubmit,
  onNext,
  isLastQuestion,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = () => {
    if (selectedIdx === null || submitted) return;
    setSubmitted(true);
    const isCorrect = selectedIdx === question.correctIndex;
    onAnswerSubmit(selectedIdx, isCorrect);
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setSubmitted(false);
    onNext();
  };

  const categoryName = CATEGORY_LABELS[question.category] || question.category;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5 text-sky-400">
          <div className="p-1.5 bg-sky-500/10 rounded-lg">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-200 text-sm">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <span className="text-xs bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-slate-400 font-medium">
          Domain: <span className="text-slate-200">{categoryName}</span>
        </span>
      </div>

      {/* Stem */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg text-white font-medium leading-relaxed">
          {question.stem}
        </h3>

        {/* Radio Option Cards */}
        <div className="space-y-3 pt-2">
          {question.options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrectOption = idx === question.correctIndex;

            let cardStyle = 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300';
            let circleStyle = 'border-slate-700 bg-slate-900';

            if (!submitted && isSelected) {
              cardStyle = 'border-sky-500 bg-sky-500/10 text-white shadow-sm ring-1 ring-sky-500/30';
              circleStyle = 'border-sky-400 bg-sky-500';
            } else if (submitted) {
              if (isCorrectOption) {
                cardStyle = 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/30';
                circleStyle = 'border-emerald-500 bg-emerald-500 text-white';
              } else if (isSelected && !isCorrectOption) {
                cardStyle = 'border-rose-500/70 bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/30';
                circleStyle = 'border-rose-500 bg-rose-500 text-white';
              } else {
                cardStyle = 'border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => !submitted && setSelectedIdx(idx)}
                className={`flex items-start space-x-3.5 p-4 rounded-xl border transition-all cursor-pointer ${cardStyle}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${circleStyle}`}>
                  {submitted && isCorrectOption ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : submitted && isSelected && !isCorrectOption ? (
                    <XCircle className="w-4 h-4 text-rose-300" />
                  ) : isSelected ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  )}
                </div>

                <div className="flex-1 text-sm font-medium leading-relaxed">
                  {option}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immediate Explanation Banner */}
      {submitted && (
        <div
          className={`p-5 rounded-xl border animate-in fade-in duration-300 ${
            selectedIdx === question.correctIndex
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2 font-semibold text-sm mb-1.5">
            {selectedIdx === question.correctIndex ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Correct! Excellent clinical reasoning.</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300">Incorrect. Review the anatomical rationale below:</span>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>Case-grounded evidence from Harvard-Oxford registration</span>
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIdx === null}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md ${
              selectedIdx === null
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20 cursor-pointer'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-sky-500/20 cursor-pointer transition-all"
          >
            <span>{isLastQuestion ? 'View Final Results' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
