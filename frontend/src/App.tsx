import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CaseProvider } from './context/CaseContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { UploadMRI } from './pages/UploadMRI';
import { Visualization } from './pages/Visualization';
import { TumorLocation } from './pages/TumorLocation';
import { LearningQuiz } from './pages/LearningQuiz';

export const App: React.FC = () => {
  return (
    <CaseProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
          {/* Fixed Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 ml-64 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadMRI />} />
              <Route path="/visualize" element={<Visualization />} />
              <Route path="/location" element={<TumorLocation />} />
              <Route path="/quiz" element={<LearningQuiz />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </CaseProvider>
  );
};

export default App;
