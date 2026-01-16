
import React, { useState, useEffect } from 'react';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { AppState, Category, Level } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'user',
    language: 'EN',
    selectedCategory: 'Poem',
    selectedLevel: 'Level 1'
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const navigateToLogin = () => setState(prev => ({ ...prev, view: 'login' }));
  const navigateToUser = () => setState(prev => ({ ...prev, view: 'user' }));
  const navigateToAdmin = () => setState(prev => ({ ...prev, view: 'admin' }));

  const handleAdminAuth = (success: boolean) => {
    if (success) {
      setIsAdminAuthenticated(true);
      navigateToAdmin();
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    navigateToUser();
  };

  return (
    <div className="h-screen w-full font-sans text-amber-900 bg-amber-50 overflow-hidden flex flex-col">
      {state.view === 'user' && (
        <UserPanel 
          appState={state} 
          setAppState={setState} 
          onLogoClick={navigateToLogin} 
        />
      )}
      
      {state.view === 'login' && (
        <AdminLogin 
          onBack={navigateToUser} 
          onLogin={handleAdminAuth} 
        />
      )}
      
      {state.view === 'admin' && isAdminAuthenticated && (
        <AdminPanel 
          onLogout={handleLogout} 
        />
      )}

      {state.view === 'admin' && !isAdminAuthenticated && (
        <div className="flex items-center justify-center h-full">
           <div className="text-center p-8 bg-amber-50 rounded-xl shadow-lg border-2 border-amber-800">
             <h2 className="text-2xl font-bold text-amber-800 mb-4">Unauthorized</h2>
             <button 
              onClick={navigateToLogin}
              className="px-6 py-2 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-800 transition-colors"
             >
               Go to Login
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
