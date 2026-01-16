
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onLogin: (success: boolean) => void;
}

const AdminLogin: React.FC<Props> = ({ onBack, onLogin }) => {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Hacker' && passcode === '444') {
      onLogin(true);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-amber-50 p-6">
      <div className="w-full max-w-sm bg-amber-50 rounded-3xl shadow-[12px_12px_0px_rgba(107,62,44,0.3)] p-12 border-4 border-amber-800">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-amber-900 tracking-widest uppercase">Mirror Sensei</h1>
          <p className="text-amber-900 text-[10px] mt-4 font-black uppercase tracking-[0.4em] bg-amber-100 py-1 rounded-full border border-amber-800 inline-block px-4">Admin Hub</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-[11px] font-black text-amber-900 uppercase tracking-[0.2em] mb-3">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-4 border-amber-800 focus:bg-amber-100 outline-none transition-all text-sm font-black shadow-inner bg-amber-50"
              placeholder="HACKER"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-amber-900 uppercase tracking-[0.2em] mb-3">Passcode</label>
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-4 border-amber-800 focus:bg-amber-100 outline-none transition-all text-sm font-black shadow-inner bg-amber-50"
              placeholder="•••"
            />
          </div>

          {error && <p className="text-amber-800 text-xs font-black text-center uppercase tracking-widest animate-pulse border-2 border-amber-800 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit"
            className="w-full py-4.5 bg-amber-800 hover:bg-amber-700 text-amber-50 font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[6px_6px_0px_rgba(107,62,44,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] border-2 border-amber-50"
          >
            Access Terminal
          </button>
        </form>

        <button 
          onClick={onBack}
          className="w-full mt-10 text-amber-900 text-[10px] font-black uppercase tracking-[0.3em] hover:underline transition-all"
        >
          Return to Knowledge Base
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
