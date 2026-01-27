import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note } from '../types';
import { 
  Plus, Search, Wand2, X, Maximize2, Trash2, Clock, 
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, 
  Code, Palette, AlignLeft, AlignCenter, AlignRight, Type, MoreVertical,
  Highlighter, Strikethrough
} from 'lucide-react';
import { enhanceNote } from '../services/geminiService';

interface NoteTakerProps {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const ToolbarButton = ({ icon: Icon, onClick, active = false, label }: any) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }} // Prevent focus loss from editor
    className={`p-2 rounded-lg transition-all ${
      active 
        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
    }`}
    title={label}
  >
    <Icon size={18} strokeWidth={2.5} />
  </button>
);

const Separator = () => <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 self-center" />;

export const NoteTaker: React.FC<NoteTakerProps> = ({ notes, setNotes }) => {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // State for active formatting buttons
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Sync content when activeNote switches
  useEffect(() => {
    if (editorRef.current && activeNote) {
       editorRef.current.innerHTML = activeNote.content;
       checkFormats(); // Check formats on load
    }
  }, [activeNote?.id]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '',
      lastEdited: new Date(),
      tags: [],
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const updatedNote = { ...activeNote, ...updates, lastEdited: new Date() };
    setActiveNote(updatedNote);
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleEnhance = async () => {
    if (!activeNote) return;
    setIsEnhancing(true);
    const textContent = editorRef.current?.innerText || activeNote.content;
    const enhanced = await enhanceNote(textContent);
    
    updateActiveNote({ content: enhanced });
    if (editorRef.current) {
        editorRef.current.innerText = enhanced;
        checkFormats(); // Reset formats after replacement
    }
    setIsEnhancing(false);
  };

  // --- Editor Formatting Logic ---
  
  const checkFormats = () => {
    if (!document) return;
    
    const formats = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikethrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        // Block formats
        h1: document.queryCommandValue('formatBlock') === 'h1',
        h2: document.queryCommandValue('formatBlock') === 'h2',
        pre: document.queryCommandValue('formatBlock') === 'pre',
    };
    setActiveFormats(formats);
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current && activeNote) {
       updateActiveNote({ content: editorRef.current.innerHTML });
       checkFormats(); // Update state after command
    }
  };

  const handleInput = () => {
    if (editorRef.current && activeNote) {
      updateActiveNote({ content: editorRef.current.innerHTML });
      checkFormats(); // Update possibly on input (e.g. new line)
    }
  };

  const colors = [
    { label: 'Default', value: 'inherit', bg: 'bg-gray-900 dark:bg-white' },
    { label: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
    { label: 'Brown', value: '#92400E', bg: 'bg-amber-700' },
    { label: 'Orange', value: '#D97706', bg: 'bg-orange-600' },
    { label: 'Yellow', value: '#D97706', bg: 'bg-yellow-500' }, 
    { label: 'Green', value: '#059669', bg: 'bg-green-600' },
    { label: 'Blue', value: '#2563EB', bg: 'bg-blue-600' },
    { label: 'Purple', value: '#7C3AED', bg: 'bg-purple-600' },
    { label: 'Pink', value: '#DB2777', bg: 'bg-pink-600' },
    { label: 'Red', value: '#DC2626', bg: 'bg-red-600' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full gap-6"
    >
      {/* Sidebar List */}
      <div className="w-full sm:w-1/3 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h2>
             <button onClick={handleCreateNote} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
               <Plus size={20} className="text-gray-700 dark:text-gray-300"/>
             </button>
           </div>
           <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search notes..." 
               className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-200 placeholder-gray-400"
             />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {notes.map(note => (
            <div 
              key={note.id}
              onClick={() => setActiveNote(note)}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all ${activeNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <h3 className={`font-semibold text-sm mb-1 pr-6 ${activeNote?.id === note.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-gray-200'}`}>{note.title || "Untitled"}</h3>
              {/* Strip HTML for preview */}
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {note.content.replace(/<[^>]*>?/gm, '') || "No content"}
              </p>
              <div className="flex gap-2 mt-2">
                {note.tags.map(tag => (
                   <span key={tag} className="text-[10px] px-2 py-0.5 bg-white dark:bg-gray-600 rounded-md text-gray-400 dark:text-gray-300 border border-gray-100 dark:border-gray-500">{tag}</span>
                ))}
              </div>
              
              <button 
                onClick={(e) => handleDeleteNote(note.id, e)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="hidden sm:flex flex-1 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex-col relative transition-colors duration-300">
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div 
              key={activeNote.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Header Meta */}
              <div className="flex justify-between items-center px-6 pt-6 pb-2">
                <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                   <Clock size={12} />
                   Edited {activeNote.lastEdited.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                  >
                    <Wand2 size={12} />
                    {isEnhancing ? 'AI Enhancing...' : 'AI Enhance'}
                  </button>
                  <button 
                    onClick={() => setActiveNote(null)} 
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  >
                     <X size={18} />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-2 border-b border-gray-50 dark:border-gray-700 flex flex-wrap items-center gap-1 relative z-20">
                 <div className="flex items-center gap-0.5 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl">
                    <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => exec('formatBlock', 'H1')} active={activeFormats.h1} />
                    <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => exec('formatBlock', 'H2')} active={activeFormats.h2} />
                    <Separator />
                    <ToolbarButton icon={Bold} label="Bold" onClick={() => exec('bold')} active={activeFormats.bold} />
                    <ToolbarButton icon={Italic} label="Italic" onClick={() => exec('italic')} active={activeFormats.italic} />
                    <ToolbarButton icon={Underline} label="Underline" onClick={() => exec('underline')} active={activeFormats.underline} />
                    <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikethrough')} active={activeFormats.strikethrough} />
                    <Separator />
                    <div className="relative">
                        <ToolbarButton icon={Palette} label="Text Color" onClick={() => setShowColors(!showColors)} />
                        {showColors && (
                             <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 grid grid-cols-5 gap-1 w-48 z-50">
                                {colors.map(c => (
                                    <button 
                                        key={c.value} 
                                        onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c.value); setShowColors(false); }}
                                        className="w-8 h-8 rounded-full hover:scale-110 transition-transform flex items-center justify-center border border-gray-100 dark:border-gray-700"
                                        title={c.label}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${c.bg}`}></div>
                                    </button>
                                ))}
                             </div>
                        )}
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-0.5 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl ml-2">
                    <ToolbarButton icon={List} label="Bullet List" onClick={() => exec('insertUnorderedList')} active={activeFormats.insertUnorderedList} />
                    <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => exec('insertOrderedList')} active={activeFormats.insertOrderedList} />
                    <Separator />
                    <ToolbarButton icon={AlignLeft} label="Align Left" onClick={() => exec('justifyLeft')} active={activeFormats.justifyLeft} />
                    <ToolbarButton icon={AlignCenter} label="Align Center" onClick={() => exec('justifyCenter')} active={activeFormats.justifyCenter} />
                    <ToolbarButton icon={AlignRight} label="Align Right" onClick={() => exec('justifyRight')} active={activeFormats.justifyRight} />
                    <Separator />
                    <ToolbarButton icon={Code} label="Code Block" onClick={() => exec('formatBlock', 'PRE')} active={activeFormats.pre} />
                 </div>
              </div>

              {/* Title Input */}
              <div className="px-8 pt-6">
                 <input 
                   value={activeNote.title}
                   onChange={(e) => updateActiveNote({ title: e.target.value })}
                   className="text-4xl font-bold text-gray-900 dark:text-white w-full border-none focus:ring-0 placeholder-gray-300 bg-transparent p-0"
                   placeholder="Untitled"
                 />
              </div>

              {/* Rich Text Editor Area */}
              <div className="flex-1 overflow-y-auto px-8 py-4 cursor-text" onClick={() => editorRef.current?.focus()}>
                 <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onKeyUp={checkFormats}
                    onMouseUp={checkFormats}
                    onClick={checkFormats}
                    className="
                        min-h-[500px] outline-none text-lg text-gray-700 dark:text-gray-300 leading-relaxed 
                        prose dark:prose-invert max-w-none
                        empty:before:content-[attr(placeholder)] empty:before:text-gray-300
                        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-gray-900 [&_h1]:dark:text-white
                        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-gray-800 [&_h2]:dark:text-gray-100
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                        [&_li]:pl-1 [&_li]:mb-1
                        [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500
                        [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-900 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-sm [&_pre]:mb-4 [&_pre]:overflow-x-auto
                        [&_code]:font-mono [&_code]:text-pink-500 [&_code]:bg-gray-50 [&_code]:dark:bg-gray-800 [&_code]:px-1 [&_code]:rounded
                    "
                    placeholder="Type '/' for commands or start writing..."
                 />
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
               <Maximize2 size={48} className="mb-4 opacity-20" />
               <p className="text-sm">Select a note to view or edit</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop for closing popovers */}
      {showColors && (
         <div className="fixed inset-0 z-10" onClick={() => setShowColors(false)}></div>
      )}
    </motion.div>
  );
};