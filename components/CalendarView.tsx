import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isSameDay } from 'date-fns';
import { Task } from '../types';
import { Plus, Clock, MoreHorizontal, Video, X, Trash2, Tag, AlignLeft, ChevronDown } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PIXELS_PER_HOUR = 120; // Taller for better readability
const SNAP_MINUTES = 15;

// Custom Time Picker Component
const TimePicker: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHour, currentMinute] = value ? value.split(':') : ['09', '00'];

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // 5-minute intervals for cleaner UX
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); 

  return (
    <div className="relative space-y-2">
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
        <Clock size={12}/> {label}
      </label>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 text-left font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-blue-500/20 bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
      >
        <span className="text-lg font-semibold tracking-tight">{value}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 flex h-56 overflow-hidden"
            >
              {/* Hours Column */}
              <div className="flex-1 overflow-y-auto no-scrollbar border-r border-gray-50 dark:border-gray-700 py-2 scroll-smooth">
                <div className="text-[10px] text-gray-400 font-bold text-center py-2 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-50 dark:border-gray-700 z-10">HOUR</div>
                <div className="px-2 pb-2">
                    {hours.map(h => (
                    <button
                        key={h}
                        onClick={() => onChange(`${h}:${currentMinute}`)}
                        className={`w-full p-2 rounded-lg text-sm mb-1 transition-all ${h === currentHour ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        {h}
                    </button>
                    ))}
                </div>
              </div>
              
              {/* Minutes Column */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-2 scroll-smooth">
                <div className="text-[10px] text-gray-400 font-bold text-center py-2 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-50 dark:border-gray-700 z-10">MIN</div>
                <div className="px-2 pb-2">
                    {minutes.map(m => (
                    <button
                        key={m}
                        onClick={() => onChange(`${currentHour}:${m}`)}
                        className={`w-full p-2 rounded-lg text-sm mb-1 transition-all ${m === currentMinute ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        {m}
                    </button>
                    ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for missing startOfWeek from date-fns
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust to make Monday (1) the start. 
  // If Sunday (0), subtract 6 days. If Monday (1), subtract 0. If Tuesday (2), subtract 1.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

interface CalendarViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, setTasks }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});

  const startDate = getStartOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Auto-scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 8 * PIXELS_PER_HOUR - 50; 
    }
  }, []);

  const sortedTasks = useMemo(() => {
    return tasks
      .filter(task => isSameDay(task.date, selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, selectedDate]);

  // Helpers
  const getMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getPosition = (time: string) => {
    return (getMinutes(time) / 60) * PIXELS_PER_HOUR;
  };

  const getDurationHeight = (start: string, end: string) => {
    const startMins = getMinutes(start);
    const endMins = getMinutes(end);
    return ((endMins - startMins) / 60) * PIXELS_PER_HOUR;
  };

  // Handlers
  const handleTimeSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering when clicking an event or during drag
    if ((e.target as HTMLElement).closest('.event-card') || isDragging.current) return;
    if (!gridRef.current) return;

    // Calculate Y position relative to the grid container, regardless of which child element (grid line) was clicked
    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    
    // Ensure we don't get negative values or values outside bounds
    const safeOffsetY = Math.max(0, offsetY);
    
    const clickedMinutes = (safeOffsetY / PIXELS_PER_HOUR) * 60;
    const snappedMinutes = Math.round(clickedMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    
    // Format times
    const startTime = minutesToTime(snappedMinutes);
    const endTime = minutesToTime(snappedMinutes + 60); // Default 1 hour duration

    setEditingTask(null);
    setFormData({
      date: selectedDate,
      startTime,
      endTime,
      category: 'work',
      title: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setFormData({
      date: selectedDate,
      startTime: format(new Date(), 'HH:00'),
      endTime: format(new Date(new Date().setHours(new Date().getHours() + 1)), 'HH:00'),
      category: 'work',
      title: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from hitting the grid
    if (isDragging.current) return;
    setEditingTask(task);
    setFormData({ ...task });
    setIsModalOpen(true);
  };

  const handleDragEnd = (task: Task, info: any) => {
    setTimeout(() => { isDragging.current = false; }, 50); // Small delay to prevent click firing

    const movedPixels = info.offset.y;
    const pixelsPerMinute = PIXELS_PER_HOUR / 60;
    const movedMinutes = movedPixels / pixelsPerMinute;
    
    // Snap logic
    const snappedMinutes = Math.round(movedMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    
    if (snappedMinutes === 0) return;

    const startMinutes = getMinutes(task.startTime);
    const endMinutes = getMinutes(task.endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    let newStartMinutes = startMinutes + snappedMinutes;
    
    // Boundary Check (00:00 to 23:59)
    // Clamp so the event doesn't go below 0 or extend past midnight
    newStartMinutes = Math.max(0, Math.min(newStartMinutes, (24 * 60) - durationMinutes));
    
    const newStartTime = minutesToTime(newStartMinutes);
    const newEndTime = minutesToTime(newStartMinutes + durationMinutes);

    setTasks(prev => prev.map(t => 
        t.id === task.id 
        ? { ...t, startTime: newStartTime, endTime: newEndTime } 
        : t
    ));
  };

  const handleDelete = () => {
    if (editingTask) {
      setTasks(prev => prev.filter(t => t.id !== editingTask.id));
      setIsModalOpen(false);
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.startTime || !formData.endTime) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData } as Task : t));
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        date: selectedDate,
        ...formData as Task
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full gap-6 relative"
    >
      {/* Header */}
      <header className="flex justify-between items-end flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Schedule</h2>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {format(selectedDate, 'MMMM yyyy')}
          </h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-gray-900/20 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors active:scale-95 transform duration-150"
        >
          <Plus size={18} />
          New Event
        </button>
      </header>

      {/* Week Strip */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center overflow-x-auto no-scrollbar flex-shrink-0 transition-colors duration-300">
        {weekDays.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
                <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all duration-300 flex-shrink-0 mx-1 ${
                        isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                >
                    <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                        {format(date, 'EEE')}
                    </span>
                    <span className="text-xl font-bold">
                        {format(date, 'd')}
                    </span>
                </button>
            )
        })}
      </div>

      {/* Vertical Timeline View */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative transition-colors duration-300">
        <div 
            ref={scrollRef}
            className="overflow-y-auto h-full relative scroll-smooth custom-scrollbar"
        >
            {/* The Grid Container */}
            <div 
                ref={gridRef}
                className="relative min-h-[2880px] w-full cursor-crosshair" // 24 * 120px = 2880px
                onClick={handleTimeSlotClick}
            >
                {/* Current Time Indicator (if today) */}
                {isSameDay(selectedDate, new Date()) && (
                     <div 
                        className="absolute left-16 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                        style={{ top: getPosition(format(new Date(), 'HH:mm')) }}
                     >
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                        <span className="text-[10px] font-bold text-red-500 bg-white dark:bg-gray-800 px-1 rounded ml-1">
                            {format(new Date(), 'HH:mm')}
                        </span>
                     </div>
                )}

                {/* Grid Lines & Labels */}
                {HOURS.map((hour) => (
                    <div 
                        key={hour} 
                        className="group absolute w-full flex items-start border-b border-gray-50 dark:border-gray-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                        style={{ height: PIXELS_PER_HOUR, top: hour * PIXELS_PER_HOUR }}
                    >
                        {/* Time Label */}
                        <div className="w-16 flex-shrink-0 text-right pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 sticky left-0 -mt-2.5">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                        {/* The clickable area visual hint */}
                        <div className="flex-1 h-full border-l border-gray-100 dark:border-gray-700 relative">
                             <div className="absolute top-0 left-0 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 pl-2 pt-1 font-medium pointer-events-none">
                                + Add event
                             </div>
                        </div>
                    </div>
                ))}

                {/* Events */}
                {sortedTasks.map((task) => (
                    <motion.div
                        key={task.id}
                        layoutId={task.id} // Ensures smooth transition after state update
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        drag="y"
                        dragConstraints={gridRef}
                        dragMomentum={false}
                        dragElastic={0.05}
                        onDragStart={() => { isDragging.current = true; }}
                        onDragEnd={(e, info) => handleDragEnd(task, info)}
                        whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0px 10px 20px rgba(0,0,0,0.15)" }}
                        onClick={(e) => handleEdit(task, e)}
                        className={`event-card absolute left-20 right-4 rounded-xl border-l-4 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing overflow-hidden z-10 ${
                            task.category === 'work' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-100' :
                            task.category === 'meeting' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-900 dark:text-purple-100' :
                            'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100'
                        }`}
                        style={{
                            top: getPosition(task.startTime),
                            height: Math.max(getDurationHeight(task.startTime, task.endTime), 40) // Min height for visibility
                        }}
                    >
                        <div className="flex justify-between items-start pointer-events-none">
                             <div className="font-bold text-sm leading-tight">{task.title}</div>
                             <div className="text-[10px] font-semibold opacity-70 bg-white/50 dark:bg-black/30 px-1.5 py-0.5 rounded">
                                {task.startTime} - {task.endTime}
                             </div>
                        </div>
                        {getDurationHeight(task.startTime, task.endTime) > 60 && (
                            <p className="text-xs mt-1 opacity-80 line-clamp-2 pointer-events-none">{task.description}</p>
                        )}
                        {task.category === 'meeting' && getDurationHeight(task.startTime, task.endTime) > 50 && (
                             <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-white/60 dark:bg-black/30 px-2 py-1 rounded-full pointer-events-none">
                                <Video size={10} /> Teams
                             </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
      </div>

      {/* Edit/Create Modal (Reused) */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-40 rounded-[2rem]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="absolute inset-x-4 top-[10%] bottom-[10%] sm:inset-x-auto sm:w-[500px] sm:left-1/2 sm:-translate-x-1/2 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingTask ? 'Edit Event' : 'New Event'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                   <X size={18} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Title Input */}
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</label>
                   <input 
                     value={formData.title} 
                     onChange={e => setFormData({...formData, title: e.target.value})}
                     placeholder="e.g. Design Sprint" 
                     className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-lg font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20"
                     autoFocus
                   />
                 </div>

                 {/* Time Inputs - Custom TimePicker */}
                 <div className="grid grid-cols-2 gap-4">
                    <TimePicker 
                        label="Start"
                        value={formData.startTime || '09:00'}
                        onChange={(val) => setFormData({...formData, startTime: val})}
                    />
                    <TimePicker 
                        label="End"
                        value={formData.endTime || '10:00'}
                        onChange={(val) => setFormData({...formData, endTime: val})}
                    />
                 </div>

                 {/* Category Selection */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><Tag size={12}/> Category</label>
                    <div className="flex gap-2">
                      {['work', 'meeting', 'personal'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFormData({...formData, category: cat as any})}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                            formData.category === cat 
                            ? (cat === 'work' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : 
                               cat === 'meeting' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' :
                               'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800')
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Description */}
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><AlignLeft size={12}/> Description</label>
                   <textarea 
                     value={formData.description} 
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     placeholder="Add details, agenda, or location..." 
                     className="w-full h-32 bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 resize-none"
                   />
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3">
                 {editingTask && (
                   <button 
                     onClick={handleDelete}
                     className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                   >
                     <Trash2 size={20} />
                   </button>
                 )}
                 <button 
                   onClick={handleSave}
                   className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-lg py-4 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98]"
                 >
                   {editingTask ? 'Save Changes' : 'Create Event'}
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};