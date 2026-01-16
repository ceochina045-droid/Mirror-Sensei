
import React, { useState, useEffect } from 'react';
import { Category, Level, AdminPrompt, LevelPrompt } from '../types';
import { saveAdminPrompt, saveLevelPrompt, getAdminPrompts, getLevelPrompts } from '../firebaseService';

interface Props {
  onLogout: () => void;
}

const AdminPanel: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Category | 'Level'>('Poem');
  const [subTab, setSubTab] = useState<string>('');
  const [promptValue, setPromptValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [levelPrompts, setLevelPrompts] = useState<LevelPrompt[]>([]);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    const [ap, lp] = await Promise.all([getAdminPrompts(), getLevelPrompts()]);
    setPrompts(ap);
    setLevelPrompts(lp);
  };

  const categories = {
    Poem: ['Line by Line', 'Scenerio', 'Q & A'],
    Drama: ['A-Z', 'Q & A'],
    Literature: ['A-Z', 'Q & A'],
    Exam: ['Poem', 'Drama', 'Literature'],
    Level: ['Level 1', 'Level 2', 'Level 3']
  };

  useEffect(() => {
    setSubTab(categories[activeTab][0]);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Level') {
      const p = levelPrompts.find(lp => lp.level === subTab);
      setPromptValue(p?.prompt || '');
    } else {
      const p = prompts.find(ap => ap.category === activeTab && ap.subCategory === subTab);
      setPromptValue(p?.prompt || '');
    }
  }, [subTab, activeTab, prompts, levelPrompts]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'Level') {
        await saveLevelPrompt(subTab as Level, promptValue);
      } else {
        await saveAdminPrompt(activeTab as Category, subTab, promptValue);
      }
      await fetchPrompts();
      alert('Prompt saved successfully!');
    } catch (e) {
      alert('Error saving prompt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-amber-50 text-amber-900 font-sans">
      <header className="flex items-center justify-between px-8 py-5 bg-amber-50 border-b-4 border-amber-800">
        <div className="flex items-center gap-5">
           <img 
             src="https://i.ibb.co.com/R4zQMn14/1768390383536-2.jpg" 
             className="w-12 h-12 rounded-lg object-cover shadow-sm border-2 border-amber-800" 
             alt="Mirror Sensei Logo" 
           />
           <h1 className="text-2xl font-black text-amber-900 tracking-widest uppercase">Mirror Sensei Admin</h1>
        </div>
        <h2 className="text-sm font-black absolute left-1/2 -translate-x-1/2 uppercase tracking-[0.4em] text-amber-600">Control Panel</h2>
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-6 py-3 text-amber-900 hover:bg-amber-800 hover:text-amber-50 rounded-xl transition-all font-black group border-4 border-amber-800 text-xs uppercase tracking-widest shadow-[4px_4px_0px_rgba(107,62,44,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          <span>Logout</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </header>

      <main className="flex-1 p-10 overflow-y-auto bg-amber-50">
        <div className="max-w-5xl mx-auto">
          {/* Main Tabs */}
          <div className="flex flex-wrap gap-3 mb-12 overflow-x-auto pb-2">
            {(['Poem', 'Drama', 'Literature', 'Exam', 'Level'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-4 ${activeTab === tab ? 'bg-amber-800 text-amber-50 border-amber-800 shadow-[6px_6px_0px_rgba(107,62,44,0.3)]' : 'bg-amber-50 text-amber-900 border-amber-800 hover:bg-amber-100 shadow-[4px_4px_0px_rgba(107,62,44,0.2)]'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sub Tabs and Editor */}
          <div className="bg-amber-50 rounded-3xl border-4 border-amber-800 shadow-[10px_10px_0px_rgba(107,62,44,0.2)] overflow-hidden">
            <div className="flex border-b-4 border-amber-800 bg-amber-50">
              {categories[activeTab].map(sub => (
                <button
                  key={sub}
                  onClick={() => setSubTab(sub)}
                  className={`flex-1 py-5 font-black text-xs uppercase tracking-[0.2em] transition-colors border-r-2 last:border-r-0 border-amber-800 ${subTab === sub ? 'bg-amber-800 text-amber-50' : 'text-amber-900 hover:bg-amber-100'}`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-amber-800 text-amber-50 p-3 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <label className="block text-xs font-black text-amber-900 uppercase tracking-[0.3em]">Sensei Training Guidelines</label>
              </div>
              <textarea
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                className="w-full h-80 p-8 bg-amber-50 rounded-2xl border-4 border-amber-800 focus:ring-0 outline-none transition-all resize-none text-amber-900 font-bold text-base leading-relaxed placeholder:text-amber-600 shadow-inner"
                placeholder="Instruct Sensei on how to handle this specific content..."
              />
              
              <div className="flex justify-end mt-10">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-12 py-4 bg-amber-800 hover:bg-amber-700 text-amber-50 font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[8px_8px_0px_rgba(107,62,44,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-20 flex items-center gap-4 border-2 border-amber-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-4 border-amber-50/20 border-t-amber-50 rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  )}
                  {isSaving ? 'Synchronizing...' : 'Commit Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
