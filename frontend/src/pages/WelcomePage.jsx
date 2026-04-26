import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Users, MapPin, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: MapPin, title: 'Geo-Smart Matching', desc: 'Auto-detect coordinates and find the nearest volunteer to any crisis location.' },
  { icon: Users, title: 'Volunteer Registry', desc: 'Manage skills, availability, and real-time assignment of volunteers.' },
  { icon: Shield, title: 'Multi-Workspace NGOs', desc: 'Run multiple NGO projects independently with secure workspace isolation.' },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-navy-900" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <Zap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Smart Resource<br />
            <span className="text-emerald-400">Allocation</span> for NGOs
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Intelligently match volunteers to crises using real-time geolocation data.
            Register problems, build your volunteer registry, and assign help — instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/signup')}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60">
              Get Started <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold transition-all">
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-navy-800 border border-slate-700 rounded-2xl p-6 hover:border-emerald-700/50 transition-all">
              <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-4">
                <Icon size={22} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-navy-800 border border-slate-700 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Why Smart Resource Allocation?</h2>
              <div className="space-y-3">
                {['Haversine-based nearest volunteer matching', 'Auto-geocoding via OpenStreetMap Nominatim', 'Real-time assignment updates', 'Multi-category problem registry'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['500+', 'NGOs Served'], ['10K+', 'Volunteers Matched'], ['50K+', 'Problems Resolved'], ['99.9%', 'Uptime']].map(([num, label]) => (
                <div key={label} className="bg-navy-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{num}</p>
                  <p className="text-slate-400 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
