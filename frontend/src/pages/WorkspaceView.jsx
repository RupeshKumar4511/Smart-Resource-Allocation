import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useParams, Navigate } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Users, Building2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentWorkspace } from '../features/workspace/workspaceSlice';
import api from '../app/api';
import DashboardTab from '../components/workspace/DashboardTab';
import ProblemTab from '../components/workspace/ProblemTab';
import VolunteerTab from '../components/workspace/VolunteerTab';

export default function WorkspaceView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentWorkspace = useSelector(s => s.workspace.currentWorkspace);
  const [workspace, setWorkspace] = useState(currentWorkspace);
  const [loading, setLoading] = useState(!currentWorkspace);

  useEffect(() => {
    if (!currentWorkspace || currentWorkspace.id !== id) {
      api.get(`/workspaces/${id}`).then(r => {
        setWorkspace(r.data.workspace);
        dispatch(setCurrentWorkspace(r.data.workspace));
      }).finally(() => setLoading(false));
    }
  }, [id, currentWorkspace, dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabCls = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`;

  return (
    <div className="flex h-full">
      {/* Inner sidebar */}
      <aside className="w-56 bg-navy-800 border-r border-slate-700 p-4 flex-shrink-0">
        <div className="mb-6">
          <div className="w-10 h-10 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-3">
            <Building2 size={18} className="text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-sm truncate">{workspace?.ngo_name}</h3>
          <p className="text-slate-500 text-xs truncate">{workspace?.city}</p>
        </div>
        <nav className="space-y-1">
          <NavLink to={`/workspace/${id}/dashboard`} className={tabCls}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to={`/workspace/${id}/problems`} className={tabCls}>
            <AlertCircle size={16} /> Problems
          </NavLink>
          <NavLink to={`/workspace/${id}/volunteers`} className={tabCls}>
            <Users size={16} /> Volunteers
          </NavLink>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardTab workspaceId={id} />} />
          <Route path="problems" element={<ProblemTab workspaceId={id} />} />
          <Route path="volunteers" element={<VolunteerTab workspaceId={id} />} />
        </Routes>
      </div>
    </div>
  );
}
