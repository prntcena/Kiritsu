import React from 'react';
import { motion } from 'framer-motion';
import { AppView, Task, Note, RoutineItem, StudyPlan } from '../types';
import { Calendar, Plus, BookOpen, CheckCircle, FileText, ArrowUpRight, TrendingUp, Clock, Sun, Moon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface DashboardViewProps {
  tasks: Task[];
  notes: Note[];
  routineItems: RoutineItem[];
  studyPlans: StudyPlan[];
  onNavigate: (view: AppView) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  notes,
  routineItems,
  studyPlans,
  onNavigate,
  toggleTheme,
  isDarkMode
}) => {
  // Analytics Logic
  const today = new Date();
  const todaysTasks = tasks
    .filter(t => isSameDay(t.date, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const routineCompleted = routineItems.filter(i => i.completed).length;
  const routineTotal = routineItems.length;
  const routineProgress = routineTotal === 0 ? 0 : Math.round((routineCompleted / routineTotal) * 100);

  // SVG Config for Routine Circle
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (routineProgress / 100) * circumference;

  const recentNotes = [...notes].sort((a, b) => b.lastEdited.getTime() - a.lastEdited.getTime()).slice(0, 3);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const calculateStudyProgress = (plan: StudyPlan) => {
    let total = 0;
    let completed = 0;
    plan.modules.forEach(m => {
        m.topics.forEach(t => {
            total++;
            if (t.completed) completed++;
        });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const activeStudyPlan = studyPlans[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full gap-6 pb-20 sm:pb-0"
    >
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{format(today, 'EEEE, MMMM do')}</h2>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
             {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">User</span>
          </h1>
        </div>
        <div className="hidden sm:block">
           <button 
             onClick={toggleTheme}
             className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
              {isDarkMode ? <Moon className="text-purple-400" size={18} /> : <Sun className="text-orange-400" size={18} />}
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
           </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Today's Schedule (Hero) */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden group transition-colors duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onNavigate(AppView.CALENDAR)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <ArrowUpRight size={20} className="text-gray-400" />
              </button>
           </div>
           
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-500"/> Today's Schedule
           </h3>

           <div className="flex-1 space-y-3">
              {todaysTasks.length > 0 ? (
                  todaysTasks.slice(0, 3).map((task, idx) => (
                      <div key={task.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                          <div className="flex flex-col items-center min-w-[3rem]">
                              <span className="text-xs font-bold text-gray-400">{task.startTime}</span>
                              <div className={`w-0.5 h-full mt-1 ${idx === 0 ? 'bg-blue-200 dark:bg-blue-700' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                          </div>
                          <div>
                              <h4 className={`font-bold ${idx === 0 ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{task.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{task.description || "No additional details"}</p>
                          </div>
                          {idx === 0 && (
                             <div className="ml-auto px-3 py-1 bg-white dark:bg-blue-900/50 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800">
                                UP NEXT
                             </div>
                          )}
                      </div>
                  ))
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                      <Calendar size={40} className="mb-2 opacity-20" />
                      <p>No events scheduled for today.</p>
                      <button onClick={() => onNavigate(AppView.CALENDAR)} className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">Plan your day</button>
                  </div>
              )}
           </div>
        </div>

        {/* Widget 2: Routine Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden transition-colors duration-300">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500"/> Routine
           </h3>
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                 <svg className="w-full h-full" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track Circle */}
                    <circle 
                        cx="64" 
                        cy="64" 
                        r={radius} 
                        stroke="currentColor" 
                        strokeWidth="12" 
                        fill="transparent" 
                        className="text-gray-100 dark:text-gray-700" 
                    />
                    {/* Progress Circle */}
                    <circle 
                        cx="64" 
                        cy="64" 
                        r={radius} 
                        stroke="currentColor" 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className="text-green-500 transition-all duration-1000 ease-out" 
                        strokeLinecap="round"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{routineProgress}%</span>
                 </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
                  {routineCompleted} of {routineTotal} daily habits completed.
              </p>
              <button onClick={() => onNavigate(AppView.ROUTINE)} className="mt-4 w-full py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  View Checklist
              </button>
           </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
         {[
             { label: 'New Event', icon: <Plus size={20}/>, action: () => onNavigate(AppView.CALENDAR), color: 'bg-blue-600 text-white dark:bg-blue-700' },
             { label: 'Quick Note', icon: <FileText size={20}/>, action: () => onNavigate(AppView.NOTES), color: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700' },
             { label: 'Log Routine', icon: <CheckCircle size={20}/>, action: () => onNavigate(AppView.ROUTINE), color: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700' },
             { label: 'Start Study', icon: <BookOpen size={20}/>, action: () => onNavigate(AppView.STUDY), color: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700' },
         ].map((btn, i) => (
             <button 
                key={i} 
                onClick={btn.action}
                className={`p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 ${btn.color}`}
             >
                {btn.icon} {btn.label}
             </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {/* Recent Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors duration-300">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-purple-500"/> Recent Notes
                </h3>
                <button onClick={() => onNavigate(AppView.NOTES)} className="text-xs font-bold text-gray-400 hover:text-gray-600">VIEW ALL</button>
             </div>
             
             <div className="space-y-3">
                 {recentNotes.map(note => (
                     <button key={note.id} onClick={() => onNavigate(AppView.NOTES)} className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                         <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{note.title || "Untitled Note"}</h4>
                         <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{note.content || "No content"}</p>
                         <div className="mt-2 flex gap-2">
                             {note.tags.slice(0,2).map(tag => (
                                 <span key={tag} className="text-[10px] px-2 py-0.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md text-gray-400 dark:text-gray-300">{tag}</span>
                             ))}
                         </div>
                     </button>
                 ))}
                 {recentNotes.length === 0 && <p className="text-gray-400 text-sm italic">No notes yet.</p>}
             </div>
          </div>

          {/* Active Study Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden transition-colors duration-300">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-orange-500"/> Study Focus
                </h3>
                <button onClick={() => onNavigate(AppView.STUDY)} className="text-xs font-bold text-gray-400 hover:text-gray-600">GO TO STUDY</button>
             </div>

             {activeStudyPlan ? (
                 <div className="flex-1 flex flex-col justify-between">
                     <div>
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{activeStudyPlan.title}</h2>
                         <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{activeStudyPlan.description}</p>
                     </div>
                     
                     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Course Progress</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{calculateStudyProgress(activeStudyPlan)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-600 rounded-full" style={{ width: `${calculateStudyProgress(activeStudyPlan)}%` }}></div>
                        </div>
                     </div>
                 </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-400 mb-4">No active study plan selected.</p>
                    <button onClick={() => onNavigate(AppView.STUDY)} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold shadow-lg shadow-gray-900/10">Start Learning</button>
                </div>
             )}
          </div>
      </div>
    </motion.div>
  );
};