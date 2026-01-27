import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CalendarView } from './components/CalendarView';
import { NoteTaker } from './components/NoteTaker';
import { RoutineMaker } from './components/RoutineMaker';
import { StudyView } from './components/StudyView';
import { DashboardView } from './components/DashboardView';
import { AppView, Task, Note, RoutineItem, StudyPlan } from './types';
import { AnimatePresence } from 'framer-motion';

// Mock Initial Data
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Product Design Sync', startTime: '09:00', endTime: '10:00', category: 'work', date: new Date(), description: 'Review Q3 goals with the design team.' },
  { id: '2', title: 'Lunch with Client', startTime: '12:30', endTime: '13:30', category: 'meeting', date: new Date(), description: 'Discuss the new contract terms.' },
  { id: '3', title: 'Gym Session', startTime: '17:00', endTime: '18:30', category: 'personal', date: new Date(), description: 'Leg day.' },
];

const INITIAL_NOTES: Note[] = [
  { id: '1', title: 'Project Idea: Shelfie', content: 'An app that organizes your life like a bookshelf. Clean UI, minimalist features.', lastEdited: new Date(), tags: ['Product', 'Design'] },
  { id: '2', title: 'Grocery List', content: '- Milk\n- Eggs\n- Avocados\n- Sourdough Bread', lastEdited: new Date(), tags: ['Personal'] },
  { id: '3', title: 'Meeting Notes: Q3', content: 'Revenue up 20%. Need to focus on user retention. Marketing budget approved for October.', lastEdited: new Date(), tags: ['Work'] },
];

const INITIAL_ROUTINE: RoutineItem[] = [
  { id: '1', time: '07:00 AM', activity: 'Morning Yoga & Meditation', completed: true, icon: '🧘' },
  { id: '2', time: '08:00 AM', activity: 'Healthy Breakfast', completed: false, icon: '🥑' },
  { id: '3', time: '09:00 AM', activity: 'Deep Work Session', completed: false, icon: '💻' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Lifted State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>(INITIAL_ROUTINE);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <DashboardView 
            key="dashboard"
            tasks={tasks}
            notes={notes}
            routineItems={routineItems}
            studyPlans={studyPlans}
            onNavigate={setCurrentView}
            toggleTheme={toggleTheme}
            isDarkMode={darkMode}
          />
        );
      case AppView.CALENDAR:
        return <CalendarView key="calendar" tasks={tasks} setTasks={setTasks} />;
      case AppView.STUDY:
        return <StudyView key="study" plans={studyPlans} setPlans={setStudyPlans} />;
      case AppView.NOTES:
        return <NoteTaker key="notes" notes={notes} setNotes={setNotes} />;
      case AppView.ROUTINE:
        return <RoutineMaker key="routine" routineItems={routineItems} setRoutineItems={setRoutineItems} />;
      default:
        return <DashboardView 
            key="dashboard"
            tasks={tasks}
            notes={notes}
            routineItems={routineItems}
            studyPlans={studyPlans}
            onNavigate={setCurrentView}
            toggleTheme={toggleTheme}
            isDarkMode={darkMode}
          />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
    </Layout>
  );
};

export default App;