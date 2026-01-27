import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoutineItem } from '../types';
import { Sparkles, Check, RefreshCw, Plus, MoreHorizontal, X, Clock, Trash2, Smile } from 'lucide-react';
import { generateRoutine } from '../services/geminiService';

interface RoutineMakerProps {
    routineItems: RoutineItem[];
    setRoutineItems: React.Dispatch<React.SetStateAction<RoutineItem[]>>;
}

export const RoutineMaker: React.FC<RoutineMakerProps> = ({ routineItems, setRoutineItems }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [formData, setFormData] = useState<Partial<RoutineItem>>({});

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    
    const result = await generateRoutine(prompt);
    
    if (result) {
      const newItems: RoutineItem[] = result.items.map((item, idx) => ({
        id: Date.now().toString() + idx,
        time: item.time,
        activity: item.activity,
        completed: false,
        icon: item.icon || '✨'
      }));
      setRoutineItems(newItems);
      setShowAIInput(false);
      setPrompt('');
    }
    setIsLoading(false);
  };

  const toggleComplete = (id: string) => {
    setRoutineItems(items => items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // CRUD Handlers
  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ time: '09:00 AM', activity: '', icon: '🌟' });
    setIsModalOpen(true);
  };

  const handleEdit = (item: RoutineItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (editingItem) {
      setRoutineItems(prev => prev.filter(i => i.id !== editingItem.id));
      setIsModalOpen(false);
    }
  };

  const handleSave = () => {
    if (!formData.activity || !formData.time) return;

    if (editingItem) {
      setRoutineItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } as RoutineItem : i));
    } else {
      const newItem: RoutineItem = {
        id: Date.now().toString(),
        completed: false,
        ...formData as RoutineItem
      };
      setRoutineItems(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full max-w-2xl mx-auto relative"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Routine</h1>
           <p className="text-gray-500 dark:text-gray-400">Design your perfect day.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setShowAIInput(!showAIInput)}
              className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 p-3 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all active:scale-95"
              title="Generate with AI"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            </button>
            <button 
              onClick={handleAddNew}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-3 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-gray-900/20"
              title="Add Item"
            >
              <Plus size={20} />
            </button>
        </div>
      </div>

      <AnimatePresence>
        {showAIInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Tell AI your goal</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                   placeholder="e.g. A productive Saturday with gym and coding..."
                   className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20"
                 />
                 <button 
                   onClick={handleGenerate}
                   disabled={isLoading || !prompt}
                   className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                 >
                   Generate
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative min-h-[400px] transition-colors duration-300">
         {/* Decorative timeline line */}
         <div className="absolute left-12 top-10 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-700 rounded-full"></div>

         <div className="space-y-8 relative">
           {routineItems.map((item, index) => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: index * 0.1 }}
               className="flex items-center gap-6 group"
             >
               <div className="w-8 flex justify-center z-10 bg-white dark:bg-gray-800 py-2 transition-colors">
                  <div className={`w-3 h-3 rounded-full border-2 ${item.completed ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}></div>
               </div>
               
               <div 
                 onClick={() => handleEdit(item)}
                 className={`flex-1 p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden ${
                   item.completed 
                   ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700 opacity-60 grayscale' 
                   : 'bg-white dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
                 }`}
               >
                 <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                   {item.icon}
                 </div>
                 <div className="flex-1">
                   <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">{item.time}</div>
                   <div className={`font-semibold text-lg ${item.completed ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{item.activity}</div>
                 </div>
                 
                 <div 
                    onClick={(e) => { e.stopPropagation(); toggleComplete(item.id); }}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors hover:scale-110 active:scale-95 ${item.completed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 hover:border-green-400 hover:text-green-400'}`}
                 >
                    <Check size={16} strokeWidth={4} />
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
      </div>

      {/* Edit/Create Modal */}
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
              className="absolute top-1/4 left-0 right-0 mx-4 sm:mx-auto sm:max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? 'Edit Activity' : 'New Activity'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                   <X size={18} />
                 </button>
              </div>

              <div className="p-6 space-y-4">
                 <div className="flex gap-4">
                    <div className="w-1/3">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Time</label>
                        <input 
                            value={formData.time}
                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 font-semibold text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Icon</label>
                         <input 
                            value={formData.icon}
                            onChange={(e) => setFormData({...formData, icon: e.target.value})}
                            placeholder="Emoji"
                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 font-semibold text-gray-900 dark:text-white"
                        />
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Activity</label>
                    <input 
                        value={formData.activity}
                        onChange={(e) => setFormData({...formData, activity: e.target.value})}
                        placeholder="e.g. Read a book"
                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3">
                 {editingItem && (
                   <button 
                     onClick={handleDelete}
                     className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                   >
                     <Trash2 size={20} />
                   </button>
                 )}
                 <button 
                   onClick={handleSave}
                   className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold py-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98]"
                 >
                   Save
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};