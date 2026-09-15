import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap, Calendar, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EnergyForecasting = () => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);

  const generateForecast = () => {
    setLoading(true);
    // Simulate ML service call
    setTimeout(() => {
      const data = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        data.push({
          date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          kwh: Math.round(12 + Math.random() * 5 + (i > 20 ? 4 : 0)) // Higher towards end
        });
      }
      setForecast(data);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Consumption Forecasting</h1>
          <p className="text-slate-400">ML-powered predictions based on your usage patterns.</p>
        </div>
        <button 
          onClick={generateForecast}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
          {loading ? 'Generating...' : 'Update Forecast'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400" /> 30-Day Forecast
          </h3>
          <div className="h-[400px]">
            {forecast ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast}>
                  <defs>
                    <linearGradient id="forecastColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="kwh" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#forecastColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <TrendingUp className="w-16 h-16 opacity-10" />
                <p>Click "Update Forecast" to see predictions</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
            <h4 className="text-slate-400 text-sm mb-4">Predicted Monthly Usage</h4>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">458</span>
              <span className="text-slate-500 mb-1 font-bold italic">kWh</span>
              <span className="ml-auto text-red-400 text-sm font-bold flex items-center gap-1">
                +12% <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-4">Estimated bill: ₹3,580</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
            <div className="flex items-center gap-2 text-orange-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold">Peak Usage Alert</h4>
            </div>
            <p className="text-sm text-orange-200/80 leading-relaxed mb-4">
              Higher consumption predicted for the second week of December. This coincides with typically warmer evenings.
            </p>
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <p className="text-xs text-orange-300 font-medium">Recommendation:</p>
              <p className="text-xs text-orange-200">Shift washing machine usage to morning hours (6 AM - 10 AM).</p>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h4 className="font-bold text-sm text-slate-300">Mistral AI Insight</h4>
            </div>
            <p className="text-sm text-slate-400 italic">
              "The predicted increase is mostly attributed to your historical patterns for this season. Cooling appliances usually account for 60% of this growth."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyForecasting;
