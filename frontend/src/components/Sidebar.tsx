import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Box, MapPin, HelpCircle } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Upload MRI', path: '/upload', icon: UploadCloud },
  { name: '3D Visualization', path: '/visualize', icon: Box },
  { name: 'Tumor Location', path: '/location', icon: MapPin },
  { name: 'Learning Quiz', path: '/quiz', icon: HelpCircle },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
          <Box className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">BrainTumor 3D</h1>
          <p className="text-xs text-slate-400">Neuroanatomy Learning</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-medium">Educational Mode</span>
        </div>
        <p className="text-[11px] leading-relaxed">Medical Segmentation Decathlon & Harvard-Oxford Atlas</p>
      </div>
    </aside>
  );
};

