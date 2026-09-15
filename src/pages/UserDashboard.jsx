import React from 'react';
import { 
  LayoutDashboard, Zap, FileText, Sun, MessageSquare, LogOut, TrendingUp, DollarSign, Plus, ShieldCheck,
  Package, Wrench, ClipboardCheck
} from 'lucide-react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AIAssistant from './AIAssistant';
import BillAnalyzer from './BillAnalyzer';
import SolarROI from './SolarROI';
import EnergyForecasting from './EnergyForecasting';
import ApplianceManagement from './ApplianceManagement';
import ServiceProviders from './ServiceProviders';
import HomeEnergyAudit from './HomeEnergyAudit';

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Appliances', path: '/dashboard/appliances' },
    { icon: FileText, label: 'Bill Analyzer', path: '/dashboard/bills' },
    { icon: TrendingUp, label: 'Forecasting', path: '/dashboard/forecast' },
    { icon: ClipboardCheck, label: 'Energy Audit', path: '/dashboard/audit' },
    { icon: Sun, label: 'Solar ROI', path: '/dashboard/solar' },
    { icon: Wrench, label: 'Services', path: '/dashboard/services' },
    { icon: MessageSquare, label: 'AI Assistant', path: '/dashboard/ai' },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-white/10 h-screen fixed left-0 top-0 p-4 flex flex-col z-50">
      <div className="flex items-center gap-2 px-2 mb-10">
        <div className="p-2 bg-cyan-500 rounded-lg shadow-lg shadow-cyan-500/20"><Zap className="w-6 h-6 text-white" /></div>
        <span className="text-xl font-bold tracking-tight text-white">SMART ENERGY</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm text-inherit">{item.label}</span>
          </Link>
        ))}
      </div>
      <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all mt-auto border-t border-white/5 pt-4">
        <LogOut className="w-5 h-5" />
        <span className="font-medium text-sm">Sign Out</span>
      </Link>
    </div>
  );
};

const DashboardHome = () => {
  const chartData = [{ name: 'Mon', value: 12 }, { name: 'Tue', value: 15 }, { name: 'Wed', value: 11 }, { name: 'Thu', value: 18 }, { name: 'Fri', value: 14 }, { name: 'Sat', value: 10 }, { name: 'Sun', value: 9 }];
  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <div><h1 className="text-3xl font-bold mb-2">Good Evening!</h1><p className="text-slate-400 text-sm">Your energy efficiency is up by 12%.</p></div>
        <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 text-white"><Plus className="w-5 h-5" /> Add Reading</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Usage', value: '412 kWh', icon: Zap, color: 'text-cyan-400' },
          { label: 'Bill', value: '₹3,240', icon: DollarSign, color: 'text-green-400' },
          { label: 'Saved', value: '₹850', icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Score', value: '78%', icon: ShieldCheck, color: 'text-purple-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm group hover:border-white/20 transition-all">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 ${stat.color} flex items-center justify-center mb-4`}><stat.icon className="w-6 h-6" /></div>
            <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-8 text-white">Consumption Overview</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }} />
              <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={4} fill="url(#colorV)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="pl-64 min-h-screen p-8">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/bills" element={<BillAnalyzer />} />
          <Route path="/solar" element={<SolarROI />} />
          <Route path="/forecast" element={<EnergyForecasting />} />
          <Route path="/appliances" element={<ApplianceManagement />} />
          <Route path="/services" element={<ServiceProviders />} />
          <Route path="/audit" element={<HomeEnergyAudit />} />
        </Routes>
      </main>
    </div>
  );
};

export default UserDashboard;
