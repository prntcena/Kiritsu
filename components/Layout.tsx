import React from 'react';
import { AppView } from '../types';
import { Calendar, CheckCircle, FileText, BookOpen, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

const NavItem: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`relative group flex flex-col items-center justify-center p-3 w-16 h-16 rounded-2xl transition-all duration-300 ${
      active 
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700' 
        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}
  >
    {active && (
      <motion.div
        layoutId="nav-pill"
        className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/30 rounded-2xl"
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div className="relative z-10 flex flex-col items-center gap-1">
      {icon}
      <span className="text-[10px] font-medium tracking-tight">{label}</span>
    </div>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden">
      {/* Sidebar (Desktop) / Bottom Bar (Mobile) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 shadow-2xl rounded-full sm:static sm:translate-x-0 sm:flex-col sm:w-24 sm:h-[95vh] sm:my-auto sm:ml-4 sm:rounded-3xl sm:justify-between sm:py-8 sm:border-gray-200/50 dark:sm:border-gray-700/50 transition-colors duration-300">
        
        <div 
            onClick={() => onNavigate(AppView.DASHBOARD)}
            className="hidden sm:flex items-center justify-center w-12 h-12 bg-gray-900 dark:bg-white rounded-xl mb-4 shadow-lg shadow-gray-900/20 cursor-pointer hover:scale-105 transition-transform"
        >
            <span className="text-white dark:text-gray-900 font-bold text-xl">S</span>
        </div>

        <div className="flex flex-row sm:flex-col gap-2">
          <NavItem 
            active={currentView === AppView.DASHBOARD} 
            icon={<LayoutDashboard size={24} strokeWidth={2} />} 
            label="Home" 
            onClick={() => onNavigate(AppView.DASHBOARD)} 
          />
          <NavItem 
            active={currentView === AppView.CALENDAR} 
            icon={<Calendar size={24} strokeWidth={2} />} 
            label="Schedule" 
            onClick={() => onNavigate(AppView.CALENDAR)} 
          />
          <NavItem 
            active={currentView === AppView.STUDY} 
            icon={<BookOpen size={24} strokeWidth={2} />} 
            label="Study" 
            onClick={() => onNavigate(AppView.STUDY)} 
          />
          <NavItem 
            active={currentView === AppView.NOTES} 
            icon={<FileText size={24} strokeWidth={2} />} 
            label="Notes" 
            onClick={() => onNavigate(AppView.NOTES)} 
          />
          <NavItem 
            active={currentView === AppView.ROUTINE} 
            icon={<CheckCircle size={24} strokeWidth={2} />} 
            label="Routine" 
            onClick={() => onNavigate(AppView.ROUTINE)} 
          />
        </div>

        <div className="hidden sm:flex flex-col gap-4 items-center mt-auto">
             <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
                <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full object-cover" />
             </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full w-full p-4 sm:p-6 lg:p-8 overflow-y-auto scroll-smooth">
          <div className="max-w-6xl mx-auto h-full">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};