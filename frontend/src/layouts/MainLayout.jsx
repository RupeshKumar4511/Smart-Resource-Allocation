import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, Briefcase, LogOut, User, ChevronDown, Zap } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    await dispatch(logout());
    toast.success('Signed out successfully');
    navigate('/');
  }

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-800 border-r border-slate-700 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Smart Resource Allocation</p>
              <p className="text-emerald-400 text-xs">NGO Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/home" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <Home size={18} /> Home
          </NavLink>
          <NavLink to="/workspace/new" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <Briefcase size={18} /> New Workspace
          </NavLink>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700" ref={dropRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700 transition-all">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="mt-1 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden shadow-xl">
              <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-all">
                <User size={15} /> Profile
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-all">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}
