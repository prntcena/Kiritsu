import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyPlan, StudyModule, StudyTopic } from '../types';
import { Plus, Check, Sparkles, BookMarked, Trash2, X, Info, Edit2, Save, ArrowUp, ArrowDown, MoreVertical, GripVertical } from 'lucide-react';
import { generateStudyPlan } from '../services/geminiService';

interface StudyViewProps {
    plans: StudyPlan[];
    setPlans: React.Dispatch<React.SetStateAction<StudyPlan[]>>;
}

export const StudyView: React.FC<StudyViewProps> = ({ plans, setPlans }) => {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  
  // Creation / Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);

  // Quick Add Topic State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [newTopicData, setNewTopicData] = useState({ title: '', hours: 1 });

  const activePlan = plans.find(p => p.id === activePlanId);

  // --- Helpers ---
  const calculateProgress = (plan: StudyPlan) => {
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

  const updateActivePlan = (updates: Partial<StudyPlan>) => {
    if (!activePlanId) return;
    setPlans(prev => prev.map(p => p.id === activePlanId ? { ...p, ...updates } : p));
  };

  // --- Actions ---

  const handleCreatePlan = async () => {
    if (!syllabusInput.trim()) return;
    setIsLoading(true);

    const result = await generateStudyPlan(syllabusInput);
    
    if (result) {
      const newPlan: StudyPlan = {
        id: Date.now().toString(),
        title: result.title,
        description: result.description,
        createdAt: new Date(),
        color: ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'][plans.length % 4],
        modules: result.modules.map((mod, mIdx) => ({
          id: `m-${Date.now()}-${mIdx}`,
          title: mod.title,
          topics: mod.topics.map((top, tIdx) => ({
            id: `t-${Date.now()}-${mIdx}-${tIdx}`,
            title: top.title,
            estimatedHours: top.estimatedHours,
            completed: false
          }))
        }))
      };

      setPlans([newPlan, ...plans]);
      setActivePlanId(newPlan.id);
      setIsImportModalOpen(false);
      setSyllabusInput('');
    }
    setIsLoading(false);
  };

  const handleDeletePlan = (id: string) => {
     setPlans(prev => prev.filter(p => p.id !== id));
     if (activePlanId === id) setActivePlanId(null);
  };

  // --- Topic/Module Management (View Mode) ---

  const toggleTopic = (moduleId: string, topicId: string) => {
    if (isEditing || !activePlan) return;
    
    const newModules = activePlan.modules.map(mod => {
        if (mod.id !== moduleId) return mod;
        return {
            ...mod,
            topics: mod.topics.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t)
        };
    });
    updateActivePlan({ modules: newModules });
  };

  const handleQuickAddTopic = () => {
    if (!activePlan || !activeModuleId || !newTopicData.title) return;
    
    const newModules = activePlan.modules.map(mod => {
        if (mod.id !== activeModuleId) return mod;
        return {
            ...mod,
            topics: [...mod.topics, {
                id: Date.now().toString(),
                title: newTopicData.title,
                estimatedHours: newTopicData.hours,
                completed: false
            }]
        };
    });
    updateActivePlan({ modules: newModules });
    setIsTopicModalOpen(false);
  };

  // --- Edit Mode Logic ---

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
      if (!activePlan) return;
      const newModules = [...activePlan.modules];
      if (direction === 'up' && index > 0) {
          [newModules[index], newModules[index - 1]] = [newModules[index - 1], newModules[index]];
      } else if (direction === 'down' && index < newModules.length - 1) {
          [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
      }
      updateActivePlan({ modules: newModules });
  };

  const handleMoveTopic = (moduleIndex: number, topicIndex: number, direction: 'up' | 'down') => {
      if (!activePlan) return;
      const newModules = [...activePlan.modules];
      const newTopics = [...newModules[moduleIndex].topics];
      
      if (direction === 'up' && topicIndex > 0) {
          [newTopics[topicIndex], newTopics[topicIndex - 1]] = [newTopics[topicIndex - 1], newTopics[topicIndex]];
      } else if (direction === 'down' && topicIndex < newTopics.length - 1) {
          [newTopics[topicIndex], newTopics[topicIndex + 1]] = [newTopics[topicIndex + 1], newTopics[topicIndex]];
      }
      
      newModules[moduleIndex] = { ...newModules[moduleIndex], topics: newTopics };
      updateActivePlan({ modules: newModules });
  };

  const updateModuleTitle = (moduleIndex: number, newTitle: string) => {
      if (!activePlan) return;
      const newModules = [...activePlan.modules];
      newModules[moduleIndex] = { ...newModules[moduleIndex], title: newTitle };
      updateActivePlan({ modules: newModules });
  };

  const updateTopic = (moduleIndex: number, topicIndex: number, field: keyof StudyTopic, value: any) => {
      if (!activePlan) return;
      const newModules = [...activePlan.modules];
      const newTopics = [...newModules[moduleIndex].topics];
      newTopics[topicIndex] = { ...newTopics[topicIndex], [field]: value };
      newModules[moduleIndex] = { ...newModules[moduleIndex], topics: newTopics };
      updateActivePlan({ modules: newModules });
  };

  const deleteModule = (moduleId: string) => {
      if (!activePlan) return;
      updateActivePlan({ modules: activePlan.modules.filter(m => m.id !== moduleId) });
  };

  const deleteTopic = (moduleId: string, topicId: string) => {
      if (!activePlan) return;
      const newModules = activePlan.modules.map(mod => {
          if (mod.id !== moduleId) return mod;
          return { ...mod, topics: mod.topics.filter(t => t.id !== topicId) };
      });
      updateActivePlan({ modules: newModules });
  };

  const addNewModule = () => {
      if (!activePlan) return;
      const newModule: StudyModule = {
          id: Date.now().toString(),
          title: 'New Module',
          topics: []
      };
      updateActivePlan({ modules: [...activePlan.modules, newModule] });
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full gap-6 relative"
    >
      {/* Header Area */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Study</h2>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            My Courses
          </h1>
        </div>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-gray-900/20 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 transform duration-150"
        >
          <Plus size={18} />
          New Course
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {plans.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700 text-gray-400"
           >
             <BookMarked size={64} className="mb-4 opacity-20" />
             <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No active study plans</p>
             <button onClick={() => setIsImportModalOpen(true)} className="mt-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline">Start your first course</button>
           </motion.div>
        ) : (
          <>
            {/* Sidebar List of Plans */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2">
              {plans.map(plan => {
                const progress = calculateProgress(plan);
                return (
                  <motion.button
                    key={plan.id}
                    onClick={() => { setActivePlanId(plan.id); setIsEditing(false); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`text-left p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                      activePlanId === plan.id 
                      ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-900/5 ring-1 ring-blue-500/10' 
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${plan.color}`}></div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{plan.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-8">{plan.description}</p>
                    
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                         <div className={`h-full ${plan.color} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                       </div>
                       <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{progress}%</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Active Plan Detail */}
            {activePlan && (
              <motion.div 
                 key={activePlan.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex-1 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-colors duration-300"
              >
                <div className="p-8 pb-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                  <div className="flex items-start justify-between mb-4">
                     <div className="flex-1 mr-4">
                       {isEditing ? (
                           <div className="space-y-2">
                               <input 
                                   value={activePlan.title}
                                   onChange={(e) => updateActivePlan({ title: e.target.value })}
                                   className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                               />
                               <textarea 
                                   value={activePlan.description}
                                   onChange={(e) => updateActivePlan({ description: e.target.value })}
                                   className="text-gray-600 dark:text-gray-300 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none w-full resize-none"
                                   rows={2}
                               />
                           </div>
                       ) : (
                           <>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{activePlan.title}</h2>
                                <p className="text-gray-600 dark:text-gray-300 max-w-2xl">{activePlan.description}</p>
                           </>
                       )}
                     </div>
                     <div className="flex gap-2 items-center">
                         {!isEditing && (
                            <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 shadow-sm flex items-center justify-center bg-gray-100 dark:bg-gray-700 mr-2">
                                <span className="font-bold text-xl text-gray-700 dark:text-gray-200">{calculateProgress(activePlan)}%</span>
                            </div>
                         )}
                         
                         <button 
                           onClick={() => setIsEditing(!isEditing)} 
                           className={`p-3 rounded-xl transition-all flex items-center gap-2 font-semibold text-sm ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                         >
                           {isEditing ? <><Save size={18} /> Done</> : <><Edit2 size={18} /> Edit Course</>}
                         </button>

                         {!isEditing && (
                             <button 
                               onClick={() => handleDeletePlan(activePlan.id)} 
                               className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                               title="Delete Course"
                             >
                               <Trash2 size={20} />
                             </button>
                         )}
                     </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-3xl mx-auto space-y-8 relative">
                    {/* Vertical Timeline Line */}
                    {!isEditing && <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-700"></div>}

                    {activePlan.modules.map((module, mIdx) => (
                      <div key={module.id} className="relative group/module">
                        {/* Module Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 flex-1">
                              {!isEditing && (
                                  <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-gray-400 text-sm shadow-sm">
                                  {mIdx + 1}
                                  </div>
                              )}
                              
                              {isEditing ? (
                                  <div className="flex items-center gap-2 flex-1">
                                      <div className="flex flex-col gap-1">
                                          <button onClick={() => handleMoveModule(mIdx, 'up')} disabled={mIdx === 0} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 dark:text-gray-300"><ArrowUp size={14}/></button>
                                          <button onClick={() => handleMoveModule(mIdx, 'down')} disabled={mIdx === activePlan.modules.length - 1} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 dark:text-gray-300"><ArrowDown size={14}/></button>
                                      </div>
                                      <input 
                                          value={module.title}
                                          onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                                          className="text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none flex-1 py-1"
                                      />
                                  </div>
                              ) : (
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{module.title}</h3>
                              )}
                          </div>
                          
                          {isEditing ? (
                              <button onClick={() => deleteModule(module.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18}/></button>
                          ) : (
                              <button 
                                  onClick={() => { setActiveModuleId(module.id); setNewTopicData({title:'', hours:1}); setIsTopicModalOpen(true); }}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                  title="Add Topic"
                              >
                                  <Plus size={18} />
                              </button>
                          )}
                        </div>

                        {/* Topics List */}
                        <div className={`${isEditing ? 'pl-4' : 'ml-14'} space-y-3`}>
                          {module.topics.map((topic, tIdx) => (
                            <motion.div 
                              key={topic.id}
                              layout
                              onClick={() => !isEditing && toggleTopic(module.id, topic.id)}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all relative ${
                                isEditing 
                                ? 'bg-white dark:bg-gray-800 border-dashed border-gray-300 dark:border-gray-600' 
                                : topic.completed 
                                    ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900 cursor-pointer' 
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                {!isEditing && (
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        topic.completed ? 'bg-blue-500 border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                        {topic.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                )}
                                
                                {isEditing ? (
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex flex-col gap-0.5">
                                            <button onClick={(e) => {e.stopPropagation(); handleMoveTopic(mIdx, tIdx, 'up')}} disabled={tIdx === 0} className="hover:text-blue-600 dark:text-gray-400 disabled:opacity-30"><ArrowUp size={12}/></button>
                                            <button onClick={(e) => {e.stopPropagation(); handleMoveTopic(mIdx, tIdx, 'down')}} disabled={tIdx === module.topics.length - 1} className="hover:text-blue-600 dark:text-gray-400 disabled:opacity-30"><ArrowDown size={12}/></button>
                                        </div>
                                        <input 
                                            value={topic.title}
                                            onChange={(e) => updateTopic(mIdx, tIdx, 'title', e.target.value)}
                                            className="font-medium text-gray-700 dark:text-gray-200 bg-transparent border-b border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none flex-1"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ) : (
                                    <span className={`font-medium transition-colors ${topic.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {topic.title}
                                    </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 pl-4">
                                  {isEditing ? (
                                      <>
                                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                                            <input 
                                                type="number"
                                                value={topic.estimatedHours}
                                                onChange={(e) => updateTopic(mIdx, tIdx, 'estimatedHours', Number(e.target.value))}
                                                className="w-8 bg-transparent text-right font-semibold text-gray-500 dark:text-gray-300 focus:outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-xs text-gray-400">h</span>
                                        </div>
                                        <button 
                                            onClick={(e) => {e.stopPropagation(); deleteTopic(module.id, topic.id)}}
                                            className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                      </>
                                  ) : (
                                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
                                        {topic.estimatedHours}h
                                      </span>
                                  )}
                              </div>
                            </motion.div>
                          ))}
                          {isEditing && (
                              <button 
                                onClick={() => { setActiveModuleId(module.id); setNewTopicData({title:'', hours:1}); setIsTopicModalOpen(true); }}
                                className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-400 text-sm hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                              >
                                  <Plus size={16} /> Add Topic
                              </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {isEditing && (
                        <button 
                            onClick={addNewModule}
                            className="w-full py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl text-gray-500 dark:text-gray-400 font-bold hover:bg-white dark:hover:bg-gray-800 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Add New Module
                        </button>
                    )}
                    
                    {!isEditing && (
                        <div className="flex items-center gap-4 pt-4 opacity-50">
                            <div className="relative z-10 w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                <Check size={16} className="text-gray-400"/>
                            </div>
                            <div className="text-sm font-medium text-gray-400">End of Timeline</div>
                        </div>
                    )}

                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Import Syllabus Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
            <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsImportModalOpen(false)}
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-40 rounded-[2rem]"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute inset-x-4 top-[10%] sm:inset-x-auto sm:w-[600px] sm:left-1/2 sm:-translate-x-1/2 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 p-0 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Import Syllabus</h3>
                    <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"><X size={20}/></button>
                </div>
                
                <div className="p-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex gap-3 mb-6">
                        <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            Paste your syllabus content below. We'll automatically recognize topics and estimate study time for each module.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Syllabus Content</label>
                        <textarea 
                            value={syllabusInput}
                            onChange={(e) => setSyllabusInput(e.target.value)}
                            className="w-full h-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl p-4 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-mono text-sm"
                            placeholder={`Example:\n1. Introduction to Data Structures\n2. Arrays and Linked Lists\n3. Stacks and Queues\n...`}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                    <button 
                        onClick={handleCreatePlan}
                        disabled={isLoading || !syllabusInput}
                        className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {isLoading ? 'Generating...' : 'Generate Timeline'}
                    </button>
                </div>
            </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Add Topic Modal (Used for both view and edit modes) */}
      <AnimatePresence>
            {isTopicModalOpen && (
                <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsTopicModalOpen(false)}
                    className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-40 rounded-[2rem]"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="absolute inset-0 m-auto w-[90%] max-w-sm h-fit bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 p-6 border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add New Topic</h3>
                        <button onClick={() => setIsTopicModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Topic Name</label>
                            <input 
                                value={newTopicData.title}
                                onChange={e => setNewTopicData({...newTopicData, title: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                                placeholder="e.g. Rate Limiting"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Est. Hours</label>
                            <input 
                                type="number"
                                value={newTopicData.hours}
                                onChange={e => setNewTopicData({...newTopicData, hours: Number(e.target.value)})}
                                className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                                min={1}
                            />
                        </div>
                        <button 
                            onClick={handleQuickAddTopic}
                            className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Add Topic
                        </button>
                    </div>
                </motion.div>
                </>
            )}
        </AnimatePresence>
    </motion.div>
  );
};