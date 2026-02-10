
import React, { useState, useEffect, useMemo } from 'react';
import { User, Student, PaymentRecord, ViewType } from './types';
import { db } from './services/firebase';
import Receipt from './components/Receipt';

// --- Shared Assets ---
const APP_LOGO = "https://i.ibb.co.com/dJJ7jdCD/edu1.jpg";
const DEV_NAME = "MR. MIRROR";

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showPasscode, setShowPasscode] = useState(false);

  // --- App State ---
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    
    setStudents(db.get<Student>('students'));
    setPayments(db.get<PaymentRecord>('payments'));
  }, []);

  const saveStudents = (data: Student[]) => {
    setStudents(data);
    db.save('students', data);
  };

  const savePayments = (data: PaymentRecord[]) => {
    setPayments(data);
    db.save('payments', data);
  };

  // --- Logic Helpers ---
  const getTuitionStatus = (student: Student) => {
    const start = new Date(student.startingDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Always use starting month for display
    const startMonthLabel = start.toLocaleString('default', { month: 'long', year: 'numeric' });
    const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Check payment for starting month
    const payment = payments.find(p => p.studentId === student.id && p.month === startMonthLabel);

    // If payment exists for starting month, show Paid
    if (payment) {
      return { status: 'Paid', value: payment.amount, label: 'Paid Amount', month: startMonthLabel };
    }

    if (diffDays < 30) {
      return {
        status: 'Running',
        value: 30 - diffDays,
        label: 'Remaining Days',
        month: startMonthLabel,
      };
    } else {
      return { status: 'Remaining', value: student.feeAmount, label: 'Remaining Fee', month: startMonthLabel };
    }
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;

    return students.filter(s => {
      const name = s.name.toLowerCase();
      const id = s.id.toLowerCase();

      // Check full name or ID match
      if (name.includes(q) || id.includes(q)) return true;

      // Check if starts with query
      if (name.startsWith(q)) return true;

      // Single letter: match first letter of name or any word in name
      if (q.length === 1) {
        if (name[0] === q) return true;
        if (s.name.split(/\s+/).some(word => word && word[0].toLowerCase() === q)) return true;
      }

      return false;
    });
  }, [students, searchQuery]);

  // --- Actions ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userId = formData.get('userId') as string;
    const passcode = formData.get('passcode') as string;

    const users = db.get<User>('users');
    const user = users.find(u => u.userName === userId && u.passcode === passcode);

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      alert("Invalid credentials!");
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const fullName = formData.get('fullName') as string;
    const userName = formData.get('userName') as string;
    const passcode = formData.get('passcode') as string;
    const confirm = formData.get('confirm') as string;

    if (passcode !== confirm) return alert("Passcodes don't match!");

    const users = db.get<User>('users');
    if (users.find(u => u.userName === userName)) return alert("Username already exists!");

    const newUser: User = {
      id: Date.now().toString(),
      fullName,
      userName,
      passcode,
      profilePic: "https://ui-avatars.com/api/?name=" + encodeURIComponent(fullName) + "&background=0ea5e9&color=fff"
    };
    
    db.save('users', [...users, newUser]);
    alert("Account created successfully! Please login.");
    setIsLoginView(true);
    setShowPasscode(false);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newStudent: Student = {
      id: `STU-${Math.floor(Math.random() * 9000) + 1000}`,
      name: formData.get('name') as string,
      age: Number(formData.get('age')),
      startingDate: formData.get('startDate') as string,
      address: formData.get('address') as string,
      contactNumber: formData.get('contact') as string,
      profilePic: (formData.get('picUrl') as string) || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.get('name') as string)}&background=random`,
      feeAmount: Number(formData.get('fee')),
    };

    saveStudents([...students, newStudent]);
    setActiveView('home');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const studentId = formData.get('studentId') as string;
    const student = students.find(s => s.id === studentId);
    
    if (!student) return;

    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      studentId,
      studentName: student.name,
      month: formData.get('month') as string,
      amount: Number(formData.get('amount')),
      date: new Date().toLocaleDateString(),
      status: 'Paid'
    };

    savePayments([newPayment, ...payments]);
    alert("Payment confirmed!");
    setActiveView('history');
  };

  const handleDeleteStudent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this student profile? This action cannot be undone.")) {
      saveStudents(students.filter(s => s.id !== id));
    }
  };

  const handleDeletePayment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this payment record from history?")) {
      savePayments(payments.filter(p => p.id !== id));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setShowPasscode(false);
  };

  const getTotalIncome = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const profilePic = formData.get('profilePic') as string;
    if (currentUser) {
      const updatedUser = { ...currentUser, profilePic };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      const users = db.get<User>('users');
      const updated = users.map(u => u.id === currentUser.id ? updatedUser : u);
      db.save('users', updated);
      alert('Profile updated!');
    }
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updatedStudent: Student = {
      ...selectedStudent,
      name: formData.get('name') as string,
      age: Number(formData.get('age')),
      startingDate: formData.get('startingDate') as string,
      address: formData.get('address') as string,
      contactNumber: formData.get('contactNumber') as string,
      profilePic: formData.get('profilePic') as string,
      feeAmount: Number(formData.get('feeAmount'))
    };

    saveStudents(students.map(s => s.id === selectedStudent.id ? updatedStudent : s));
    setSelectedStudent(updatedStudent);
    alert('Student profile updated!');
  };

  // --- Components ---

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  );

  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary-600 to-primary-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl shadow-lg border-4 border-white dark:border-gray-700 overflow-hidden flex items-center justify-center">
          <img src={APP_LOGO} alt="EduTrack Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-primary-600 dark:text-primary-400">EduTrack</h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-8 uppercase tracking-widest">Tuition Manager</p>
        
        {isLoginView ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="userId" type="text" placeholder="User ID" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            <div className="relative">
              <input name="passcode" type={showPasscode ? "text" : "password"} placeholder="Passcode" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              <button type="button" onClick={() => setShowPasscode(!showPasscode)} className="absolute right-3 top-3.5 text-gray-400">
                {showPasscode ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">Login</button>
            <button type="button" onClick={() => { setIsLoginView(false); setShowPasscode(false); }} className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline mt-4">Create Account</button>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount} className="space-y-3">
            <input name="fullName" type="text" placeholder="Full Name" required className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600" />
            <input name="userName" type="text" placeholder="Create User Name" required className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600" />
            <div className="relative">
              <input name="passcode" type={showPasscode ? "text" : "password"} placeholder="Create Passcode" required className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600" />
              <button type="button" onClick={() => setShowPasscode(!showPasscode)} className="absolute right-3 top-2.5 text-gray-400">
                {showPasscode ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <input name="confirm" type={showPasscode ? "text" : "password"} placeholder="Confirm Passcode" required className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600" />
            <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl mt-2">Create Account</button>
            <button type="button" onClick={() => { setIsLoginView(true); setShowPasscode(false); }} className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">Already have an account? Login</button>
          </form>
        )}
        <p className="mt-8 text-[10px] text-gray-400 font-medium">Developed by {DEV_NAME}</p>
      </div>
    </div>
  );

  const TeacherPanel = () => (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 z-10">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { setActiveView('profile'); setSearchQuery(''); }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={currentUser?.profilePic} className="w-10 h-10 rounded-full border-2 border-primary-500 object-cover" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Hello,</p>
              <h2 className="text-sm font-bold truncate max-w-[120px]">{currentUser?.fullName}</h2>
            </div>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
          />
          <svg className="absolute left-3 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeView === 'home' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">My Students ({filteredStudents.length})</h3>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <p>No students found</p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const info = getTuitionStatus(student);
                return (
                  <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 duration-300 group cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <img src={student.profilePic} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                        <div>
                          <h4 className="font-bold">{student.name}</h4>
                          <p className="text-[10px] text-gray-400 font-mono">{student.id}</p>
                          {info.month && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{info.month}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{student.age} yrs • {student.address}</p>
                        </div>
                      </div>
                      <button onClick={(e) => handleDeleteStudent(student.id, e)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl mt-2 border border-gray-100 dark:border-gray-600">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{info.label}</p>
                        <p className={`text-lg font-black ${info.status === 'Remaining' ? 'text-red-500' : 'text-primary-600'}`}>
                          {info.status === 'Running' ? info.value : `৳${info.value}`}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                        info.status === 'Running' ? 'bg-blue-100 text-blue-600' :
                        info.status === 'Paid' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {info.status}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeView === 'students' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Register Student</h3>
            <form onSubmit={handleAddStudent} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name *</label>
                <input name="name" required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Age *</label>
                  <input name="age" type="number" required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Start Date *</label>
                  <input name="startDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Monthly Fee (৳) *</label>
                <input name="fee" type="number" required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Address *</label>
                <textarea name="address" required rows={2} className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500"></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Contact Number</label>
                <input name="contact" className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Profile Picture URL</label>
                <input name="picUrl" className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl mt-2 shadow-lg transition-transform active:scale-[0.98]">Create Student</button>
            </form>
          </div>
        )}

        {activeView === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Collect Payment</h3>
            <form onSubmit={handleProcessPayment} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Select Student</label>
                <select name="studentId" required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Choose student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Month</label>
                <select name="month" required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                    <option key={m} value={`${m} ${new Date().getFullYear()}`}>{m} {new Date().getFullYear()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Amount (৳)</label>
                <input name="amount" type="number" required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl mt-2 shadow-lg transition-transform active:scale-[0.98]">Confirm Payment</button>
            </form>
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-center py-20 opacity-50">No transaction records found</p>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} onClick={() => setSelectedReceipt(p)} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-all group">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{p.studentName}</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{p.month}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-primary-600">৳{p.amount}</p>
                        <p className="text-[10px] text-gray-400">{p.date}</p>
                      </div>
                      <button 
                        onClick={(e) => handleDeletePayment(p.id, e)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">My Profile</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center mb-6">
                <img src={currentUser?.profilePic} className="w-24 h-24 rounded-full border-4 border-primary-500 object-cover shadow-lg mb-4" />
                <h2 className="text-2xl font-bold">{currentUser?.fullName}</h2>
                <p className="text-xs text-gray-400 font-mono mt-2">@{currentUser?.userName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Total Students</p>
                  <p className="text-2xl font-black text-primary-600">{students.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Total Income</p>
                  <p className="text-2xl font-black text-green-600">৳{getTotalIncome()}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Profile Picture URL</label>
                  <input 
                    name="profilePic" 
                    type="text" 
                    defaultValue={currentUser?.profilePic || ''} 
                    className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="https://..."
                  />
                </div>
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98]">Update Profile</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-3 flex justify-between items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
          { id: 'students', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
          { id: 'payment', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
          { id: 'history', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
          { id: 'profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ViewType)}
            className={`p-3 rounded-2xl transition-all ${
              activeView === item.id 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 dark:shadow-none scale-110' 
                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.id === 'home' ? (
                <>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </>
              ) : item.id === 'students' ? (
                <>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </>
              ) : item.id === 'profile' ? (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </>
              ) : (
                <path d={item.icon} />
              )}
            </svg>
          </button>
        ))}
      </footer>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Receipt payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">Edit Student Profile</h2>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
              <div className="flex justify-center mb-4">
                <img src={selectedStudent.profilePic} className="w-20 h-20 rounded-full border-4 border-primary-500 object-cover" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Student ID</label>
                <input type="text" disabled value={selectedStudent.id} className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name *</label>
                <input name="name" defaultValue={selectedStudent.name} required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Age *</label>
                  <input name="age" type="number" defaultValue={selectedStudent.age} required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Monthly Fee (৳) *</label>
                  <input name="feeAmount" type="number" defaultValue={selectedStudent.feeAmount} required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Starting Date *</label>
                <input name="startingDate" type="date" defaultValue={selectedStudent.startingDate} required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Address *</label>
                <textarea name="address" defaultValue={selectedStudent.address} required rows={2} className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500"></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Contact Number</label>
                <input name="contactNumber" defaultValue={selectedStudent.contactNumber || ''} className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Profile Picture URL</label>
                <input name="profilePic" defaultValue={selectedStudent.profilePic} required className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setSelectedStudent(null)} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return currentUser ? <TeacherPanel /> : <LoginView />;
};

export default App;
