
import React, { useState, useEffect, useRef } from 'react';
import { AppState, HistoryItem, Category, Level, AdminPrompt, LevelPrompt } from '../types';
import { getHistory, saveHistory, getAdminPrompts, getLevelPrompts } from '../firebaseService';
import { getStudyContent, translateText, askInstantQA } from '../geminiService';

// Reusable Icon components with sharp black contrast and thicker strokes
const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconSwap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 3 4 4-4 4"></path>
    <path d="M20 7H4"></path>
    <path d="m8 21-4-4 4-4"></path>
    <path d="M4 17h16"></path>
  </svg>
);

const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

interface Props {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onLogoClick: () => void;
}

const UserPanel: React.FC<Props> = ({ appState, setAppState, onLogoClick }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [mainPrompt, setMainPrompt] = useState('');
  const [instantQ, setInstantQ] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [mainResponse, setMainResponse] = useState('');
  const [translationResult, setTranslationResult] = useState('');
  const [qaResult, setQaResult] = useState('');
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  
  // Copy feedback states
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedTrans, setCopiedTrans] = useState(false);
  const [copiedQA, setCopiedQA] = useState(false);

  // Sidebar Visibility States
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  
  const [adminPrompts, setAdminPrompts] = useState<AdminPrompt[]>([]);
  const [levelPrompts, setLevelPrompts] = useState<LevelPrompt[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [hist, ap, lp] = await Promise.all([
      getHistory(),
      getAdminPrompts(),
      getLevelPrompts()
    ]);
    setHistory(hist);
    setAdminPrompts(ap);
    setLevelPrompts(lp);
  };

  const handleCopy = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  const handleSearchChange = async (val: string) => {
    setSearchText(val);
    const hist = await getHistory(val);
    setHistory(hist);
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainPrompt.trim()) return;

    setIsLoadingMain(true);
    setMainResponse('');
    setTranslationResult('');
    setQaResult('');

    const response = await getStudyContent(
      mainPrompt,
      appState.selectedCategory,
      appState.selectedLevel,
      adminPrompts,
      levelPrompts,
      appState.language
    );

    setMainResponse(response);
    
    await saveHistory({
      query: mainPrompt,
      response: response,
      category: appState.selectedCategory,
      level: appState.selectedLevel,
      timestamp: Date.now()
    });

    setMainPrompt('');
    setIsLoadingMain(false);
    loadInitialData();
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantQ.trim()) return;

    setIsLoadingQA(true);
    const result = await askInstantQA(instantQ, mainResponse || "No current context.");
    setQaResult(result);
    setInstantQ('');
    setIsLoadingQA(false);
  };

  const handleTranslationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!translationInput.trim()) return;
    
    setIsLoadingTranslation(true);
    const translated = await translateText(translationInput, appState.language === 'EN' ? 'BN' : 'EN');
    setTranslationResult(translated);
    setIsLoadingTranslation(false);
    setTranslationInput('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-amber-50 text-amber-900 font-sans">
      {/* Header */}
      <header className="h-16 flex items-center bg-amber-50 border-b-2 border-amber-800 flex-shrink-0 relative z-20 px-6">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowLeftSidebar(!showLeftSidebar)} title="Toggle Sidebar">
           <img 
              src="https://i.ibb.co.com/R4zQMn14/1768390383536-2.jpg"
              className="w-10 h-10 rounded-lg shadow-sm object-cover border-2 border-amber-800 group-hover:scale-105 transition-all"
              alt="Mirror Sensei Logo"
            />
            {!showLeftSidebar && <span className="text-amber-900 ml-1"><IconChevronRight /></span>}
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black text-amber-900 tracking-widest uppercase select-none">Mirror Sensei</h1>
        </div>
        {!showRightSidebar && (
          <button 
            onClick={() => setShowRightSidebar(true)}
            className="p-2 border-2 border-amber-800 rounded-lg hover:bg-amber-100 transition-all flex items-center justify-center"
            title="Show Assistant"
          >
            <IconChevronLeft />
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className={`${showLeftSidebar ? 'w-80' : 'w-0 overflow-hidden'} flex flex-col bg-amber-100 border-r-2 border-amber-800 transition-all duration-300`}>
          <div className="p-6 pb-2">
            <div className="relative mb-4">
              <input 
                type="text"
                placeholder="Search history"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-amber-50 rounded-xl text-sm font-black border-2 border-amber-800 focus:ring-0 outline-none transition-all shadow-[4px_4px_0px_rgba(107,62,44,0.3)]"
              />
              <span className="absolute right-4 top-3.5 text-amber-900">
                <IconSearch />
              </span>
            </div>
            <button 
              onClick={onLogoClick}
              className="w-full py-3 bg-amber-50 border-2 border-amber-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-800 hover:text-amber-50 transition-all mb-6 shadow-[4px_4px_0px_rgba(107,62,44,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Admin Login
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <h3 className="text-[11px] font-black text-amber-900 uppercase tracking-[0.2em] px-2 mb-4 border-b-2 border-amber-800 pb-1 select-none">Study Log</h3>
            <div className="space-y-3">
              {history.length > 0 ? history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setMainResponse(item.response);
                    setTranslationResult(''); 
                  }}
                  className="p-4 bg-amber-50 rounded-xl border-2 border-amber-800 cursor-pointer hover:bg-amber-800 group transition-all shadow-[3px_3px_0px_rgba(107,62,44,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <p className="text-sm font-black text-amber-900 truncate group-hover:text-amber-50">{item.query}</p>
                  <p className="text-[10px] text-amber-700 mt-1 font-black uppercase tracking-tighter group-hover:text-amber-100">{item.category} • {item.level}</p>
                </div>
              )) : (
                <p className="text-xs text-amber-600 italic px-2">No history entries found.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-amber-50 relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-12 max-w-5xl mx-auto w-full flex flex-col gap-8">
            {isLoadingMain ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="w-16 h-16 border-[8px] border-amber-100 border-t-amber-800 rounded-full animate-spin"></div>
                <p className="text-amber-900 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Reflecting Knowledge...</p>
              </div>
            ) : mainResponse ? (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex justify-between items-center mb-10 pb-4 border-b-4 border-amber-800">
                  <div className="flex gap-3">
                    <span className="px-4 py-1.5 bg-amber-800 text-amber-50 text-[11px] font-black rounded uppercase tracking-widest select-none">{appState.selectedCategory}</span>
                    <span className="px-4 py-1.5 bg-amber-100 border-2 border-amber-800 text-amber-900 text-[11px] font-black rounded uppercase tracking-widest select-none">{appState.selectedLevel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleCopy(mainResponse, setCopiedMain)}
                      className="p-2 border-2 border-amber-800 rounded-lg hover:bg-amber-100 transition-all flex items-center justify-center bg-amber-50 shadow-[2px_2px_0px_rgba(107,62,44,0.2)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      title="Copy response"
                    >
                      {copiedMain ? <IconCheck /> : <IconCopy />}
                    </button>
                    <span className="text-[11px] text-amber-900 font-black uppercase border-2 border-amber-800 px-3 py-1 bg-amber-50 select-none">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-amber-900 leading-[2] whitespace-pre-wrap text-xl font-medium antialiased select-text cursor-auto">{mainResponse}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center select-none">
                <div className="w-28 h-28 bg-amber-50 rounded-3xl flex items-center justify-center mb-10 border-4 border-amber-800 border-dashed">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#77500d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-amber-900 mb-4 uppercase tracking-[0.2em]">Mirror Sensei</h2>
                <p className="text-base text-center max-w-lg text-amber-900 font-bold leading-relaxed border-t-2 border-amber-800 pt-4">
                  Deep literature analysis, drama breakdown, and academic excellence. 
                  Start by selecting your module below.
                </p>
              </div>
            )}
            <div className="h-24" />
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className={`${showRightSidebar ? 'w-[400px]' : 'w-0 overflow-hidden'} bg-amber-50 border-l-2 border-amber-800 flex flex-col transition-all duration-300`}>
          <div 
            onClick={() => setShowRightSidebar(false)}
            className="p-5 border-b-2 border-amber-800 flex items-center justify-between bg-amber-100 cursor-pointer hover:bg-amber-200 transition-colors group select-none"
          >
            <h3 className="text-xs font-black text-amber-900 uppercase tracking-[0.2em] flex items-center gap-3">
               Assistant <IconChevronRight />
            </h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setAppState(prev => ({ ...prev, language: prev.language === 'EN' ? 'BN' : 'EN' }));
              }}
              className="flex items-center gap-3 px-4 py-2 border-2 border-amber-800 rounded-xl text-[11px] font-black tracking-widest transition-all bg-amber-50 hover:bg-amber-800 hover:text-amber-50 shadow-[3px_3px_0px_rgba(107,62,44,0.3)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>{appState.language}</span>
              <IconSwap />
              <span className="opacity-40">{appState.language === 'EN' ? 'BN' : 'EN'}</span>
            </button>
          </div>

          {/* Translation Section */}
          <div className="h-[40%] flex flex-col border-b-2 border-amber-800 overflow-hidden bg-amber-50">
             <div className="px-5 py-3 bg-amber-800 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-amber-50 uppercase tracking-widest select-none">Translator</h4>
                {translationResult && (
                  <button 
                    onClick={() => handleCopy(translationResult, setCopiedTrans)}
                    className="p-1 bg-amber-50 text-amber-900 border-2 border-amber-800 rounded-lg hover:bg-amber-100 transition-all shadow-[2px_2px_0px_rgba(107,62,44,0.2)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                    title="Copy translation"
                  >
                    {copiedTrans ? <IconCheck /> : <IconCopy />}
                  </button>
                )}
             </div>
             <div className="flex-1 p-6 overflow-y-auto text-sm text-amber-900 leading-relaxed font-black italic bg-amber-50 select-text">
               {isLoadingTranslation ? (
                  <div className="w-6 h-6 border-[4px] border-amber-100 border-t-amber-800 rounded-full animate-spin mx-auto mt-6"></div>
               ) : translationResult ? (
                 <div className="animate-in fade-in duration-500 bg-amber-100 p-5 rounded-xl border-2 border-amber-800 shadow-[4px_4px_0px_rgba(107,62,44,0.2)] select-text">
                    {translationResult}
                 </div>
               ) : (
                 <p className="text-amber-600 font-bold uppercase tracking-widest text-[10px] mt-2 select-none">Submit text for live translation</p>
               )}
             </div>
             <form onSubmit={handleTranslationSubmit} className="p-5 bg-amber-50 flex gap-3 border-t-2 border-amber-800">
                <input 
                  type="text"
                  placeholder="Type anything to translate..."
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-amber-50 border-2 border-amber-800 rounded-xl text-sm font-black outline-none focus:bg-amber-100 transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={isLoadingTranslation || !translationInput.trim()}
                  className="w-12 h-12 bg-amber-800 text-amber-50 rounded-xl flex items-center justify-center shadow-[4px_4px_0px_rgba(107,62,44,0.3)] hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex-shrink-0 border-2 border-amber-800"
                >
                   <IconSend />
                </button>
             </form>
          </div>

          {/* Instant QA Section */}
          <div className="flex-1 flex flex-col overflow-hidden bg-amber-50">
             <div className="px-5 py-3 bg-amber-50 border-b-2 border-amber-800 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest select-none">Sensei Q&A</h4>
                {qaResult && (
                  <button 
                    onClick={() => handleCopy(qaResult, setCopiedQA)}
                    className="p-1 bg-amber-50 text-amber-900 border-2 border-amber-800 rounded-lg hover:bg-amber-100 transition-all shadow-[2px_2px_0px_rgba(107,62,44,0.2)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                    title="Copy answer"
                  >
                    {copiedQA ? <IconCheck /> : <IconCopy />}
                  </button>
                )}
             </div>
             <div className="flex-1 p-6 overflow-y-auto space-y-6 select-text">
                {isLoadingQA ? (
                  <div className="flex items-center gap-3 text-amber-900 justify-center mt-12">
                    <div className="w-3 h-3 bg-amber-800 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-amber-800 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-amber-800 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                ) : qaResult ? (
                  <div className="bg-amber-100 p-6 rounded-2xl border-4 border-amber-800 shadow-[6px_6px_0px_rgba(107,62,44,0.2)] animate-in zoom-in-95 duration-300 select-text">
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-amber-800 pb-2 select-none">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#77500d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                       </svg>
                       <p className="text-[11px] font-black text-amber-900 uppercase tracking-[0.2em]">Response</p>
                    </div>
                    <p className="text-base leading-relaxed text-amber-900 font-black antialiased">{qaResult}</p>
                  </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#77500d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-6">
                       <circle cx="12" cy="12" r="10"></circle>
                       <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                       <line x1="12" y1="17" x2="12.01" y2="17"></line>
                     </svg>
                     <p className="text-xs font-black uppercase tracking-[0.3em] text-center">Awaiting Follow-up</p>
                   </div>
                )}
             </div>
          </div>
        </aside>
      </div>

      {/* Footer / Main Navigation */}
      <footer className="bg-amber-50 border-t-4 border-amber-800 p-8 z-30 shadow-[0_-10px_40px_rgba(107,62,44,0.1)]">
        <div className="max-w-[1920px] mx-auto grid grid-cols-12 gap-10 items-end">
          
          {/* Controls - Left Side Categories/Levels */}
          <div className="col-span-3 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {(['Poem', 'Drama', 'Literature', 'Exam'] as Category[]).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setAppState(prev => ({ ...prev, selectedCategory: cat }))}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all border-2 border-amber-800 ${appState.selectedCategory === cat ? 'bg-amber-800 text-amber-50 shadow-[4px_4px_0px_rgba(107,62,44,0.3)] scale-[1.02]' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Level 1', 'Level 2', 'Level 3'] as Level[]).map(lvl => (
                <button 
                  key={lvl}
                  onClick={() => setAppState(prev => ({ ...prev, selectedLevel: lvl }))}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all border-2 border-amber-800 ${appState.selectedLevel === lvl ? 'bg-amber-700 text-amber-50 shadow-[4px_4px_0px_rgba(107,62,44,0.3)] scale-[1.02]' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Main Search/Lesson Prompt - Middle */}
          <form onSubmit={handleMainSubmit} className="col-span-5 relative flex items-center">
            <input 
              type="text" 
              placeholder={`Learn something new about ${appState.selectedCategory}...`}
              value={mainPrompt}
              onChange={(e) => setMainPrompt(e.target.value)}
              className="w-full pl-6 pr-20 py-5 bg-amber-50 border-4 border-amber-800 focus:ring-0 rounded-2xl outline-none transition-all text-base font-black shadow-[8px_8px_0px_rgba(107,62,44,0.2)] placeholder:text-amber-600 placeholder:font-bold"
            />
            <button 
              type="submit"
              disabled={isLoadingMain || !mainPrompt.trim()}
              className="absolute right-4 w-12 h-12 bg-amber-800 text-amber-50 rounded-xl flex items-center justify-center transition-all shadow-md hover:bg-amber-700 active:scale-95 disabled:opacity-10 border-2 border-amber-50"
            >
              {isLoadingMain ? (
                <div className="w-6 h-6 border-4 border-amber-50/20 border-t-amber-50 rounded-full animate-spin" />
              ) : (
                <IconSend />
              )}
            </button>
          </form>

          {/* Instant follow-up - Right */}
          <form onSubmit={handleQASubmit} className="col-span-4 relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask an instant follow-up..."
              value={instantQ}
              onChange={(e) => setInstantQ(e.target.value)}
              className="w-full pl-5 pr-16 py-5 bg-amber-100 border-4 border-amber-800 focus:border-amber-800 focus:ring-0 rounded-2xl outline-none transition-all text-sm font-black shadow-[6px_6px_0px_rgba(107,62,44,0.2)] placeholder:text-amber-700"
            />
            <button 
              type="submit"
              disabled={isLoadingQA || !mainResponse || !instantQ.trim()}
              className="absolute right-3 w-11 h-11 bg-amber-800 text-amber-50 rounded-xl flex items-center justify-center transition-all shadow-md hover:bg-amber-700 active:scale-95 disabled:opacity-10 border-2 border-amber-50"
            >
               {isLoadingQA ? (
                <div className="w-5 h-5 border-4 border-amber-50/20 border-t-amber-50 rounded-full animate-spin" />
              ) : (
                <IconSend />
              )}
            </button>
          </form>

        </div>
      </footer>
    </div>
  );
};

export default UserPanel;
