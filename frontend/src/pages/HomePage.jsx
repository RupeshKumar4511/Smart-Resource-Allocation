import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Plus, Building2, AlertCircle, Users, Calendar, ArrowRight, FolderOpen } from 'lucide-react';
import { setCurrentWorkspace } from '../features/workspace/workspaceSlice';
import api from '../app/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workspaces').then(r => setWorkspaces(r.data.workspaces || [])).catch(() => toast.error('Failed to load workspaces')).finally(() => setLoading(false));
  }, []);

  function openWorkspace(ws) {
    dispatch(setCurrentWorkspace(ws));
    navigate(`/workspace/${ws.id}/dashboard`);
  }

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-navy-800 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Workspaces</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your NGO operations</p>
        </div>
        <button onClick={() => navigate('/workspace/new')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all">
          <Plus size={16} /> New Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-navy-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen size={36} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No workspaces yet</h3>
          <p className="text-slate-400 text-sm mb-8">Create your first NGO workspace to get started</p>
          <button onClick={() => navigate('/workspace/new')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all mx-auto">
            <Plus size={18} /> Create First Workspace
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map(ws => (
            <div key={ws.id} className="bg-navy-800 border border-slate-700 rounded-2xl p-6 hover:border-emerald-700/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center">
                  <Building2 size={22} className="text-emerald-400" />
                </div>
                <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">{ws.ngo_type}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-1 truncate">{ws.ngo_name}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{ws.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-navy-900 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-red-400 mb-0.5">
                    <AlertCircle size={13} />
                    <span className="text-lg font-bold text-white">{ws.problemCount || 0}</span>
                  </div>
                  <p className="text-slate-500 text-xs">Problems</p>
                </div>
                <div className="bg-navy-900 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-0.5">
                    <Users size={13} />
                    <span className="text-lg font-bold text-white">{ws.volunteerCount || 0}</span>
                  </div>
                  <p className="text-slate-500 text-xs">Volunteers</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Calendar size={12} />
                  {new Date(ws.created_at).toLocaleDateString()}
                </div>
                <button onClick={() => openWorkspace(ws)}
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors group-hover:gap-2.5">
                  Open <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
