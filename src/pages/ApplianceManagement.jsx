import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Zap, Settings, BarChart3, X, Loader2, Info } from 'lucide-react';
import axios from 'axios';

const ApplianceManagement = () => {
  const [appliances, setAppliances] = useState([
    { id: 1, name: 'Air Conditioner (1.5 Ton)', category: 'Cooling', power: 1800, quantity: 1, hours: 8, days: 30, monthlyKwh: 432, cost: 3240 },
    { id: 2, name: 'Double Door Refrigerator', category: 'Kitchen', power: 350, quantity: 1, hours: 24, days: 30, monthlyKwh: 252, cost: 1890 },
    { id: 3, name: 'Washing Machine (Front Load)', category: 'Laundry', power: 800, quantity: 1, hours: 1, days: 20, monthlyKwh: 16, cost: 120 },
    { id: 4, name: 'Smart LED TV 55"', category: 'Entertainment', power: 120, quantity: 2, hours: 5, days: 30, monthlyKwh: 36, cost: 270 }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cooling',
    power: 1000,
    quantity: 1,
    hours: 6,
    days: 30
  });

  const TARIFF_RATE = 7.5; // Average tariff rate in ₹ per kWh

  // Calculate totals
  const totalMonthlyKwh = appliances.reduce((sum, item) => sum + item.monthlyKwh, 0);
  const totalMonthlyCost = appliances.reduce((sum, item) => sum + item.cost, 0);
  const highestConsumer = appliances.length > 0 
    ? [...appliances].sort((a, b) => b.cost - a.cost)[0]
    : null;

  const handleAddAppliance = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const watts = Number(formData.power) || 100;
    const qty = Number(formData.quantity) || 1;
    const hrs = Number(formData.hours) || 1;
    const dys = Number(formData.days) || 30;

    const dailyKwh = (watts * hrs * qty) / 1000;
    const monthlyKwh = Math.round(dailyKwh * dys * 10) / 10;
    const cost = Math.round(monthlyKwh * TARIFF_RATE);

    const newAppliance = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      power: watts,
      quantity: qty,
      hours: hrs,
      days: dys,
      monthlyKwh: monthlyKwh,
      cost: cost
    };

    setAppliances(prev => [newAppliance, ...prev]);
    setIsModalOpen(false);
    setFormData({
      name: '',
      category: 'Cooling',
      power: 1000,
      quantity: 1,
      hours: 6,
      days: 30
    });
  };

  const handleDelete = (id) => {
    setAppliances(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Appliance Inventory</h1>
          <p className="text-slate-400 text-sm">Track energy consumption, wattage, and monthly cost breakdown per device.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 text-white"
        >
          <Plus className="w-5 h-5" /> Add Appliance
        </button>
      </header>

      {/* Main Inventory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Appliances List */}
        <div className="lg:col-span-2 space-y-4">
          {appliances.length === 0 ? (
            <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center">
              <Zap className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Appliances Registered</h3>
              <p className="text-slate-400 text-sm mb-6">Click "Add Appliance" to track device power ratings and monthly costs.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-bold"
              >
                Add First Appliance
              </button>
            </div>
          ) : (
            appliances.map((app) => (
              <motion.div 
                key={app.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{app.name}</h3>
                      {app.quantity > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                          x{app.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {app.category} • {app.power}W • {app.hours} hrs/day ({app.days || 30} days/mo)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-8 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Monthly kWh / Cost</p>
                    <p className="text-base font-bold text-white">
                      {app.monthlyKwh} kWh <span className="text-cyan-400">/ ₹{app.cost.toLocaleString()}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(app.id)}
                    className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                    title="Delete Appliance"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Stats Summary Sidebar */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm h-fit space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Consumption Overview</h3>
          
          {highestConsumer && (
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
              <p className="text-xs text-cyan-300 font-medium mb-1">Highest Consumer Device</p>
              <p className="text-lg font-bold text-white">{highestConsumer.name}</p>
              <p className="text-xs text-cyan-400 font-semibold mt-1">
                ₹{highestConsumer.cost} / mo ({Math.round((highestConsumer.cost / (totalMonthlyCost || 1)) * 100)}% of total)
              </p>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Total Registered Devices</span>
              <span className="text-white font-bold">{appliances.reduce((s, a) => s + (a.quantity || 1), 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Est. Monthly Consumption</span>
              <span className="text-cyan-400 font-bold font-mono">{totalMonthlyKwh.toFixed(1)} kWh</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Est. Monthly Cost (@ ₹{TARIFF_RATE}/kWh)</span>
              <span className="text-green-400 font-bold text-lg">₹{totalMonthlyCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-400 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Monthly cost is calculated based on cumulative daily runtime hours and standard residential slab tariffs.</span>
          </div>
        </div>
      </div>

      {/* Add Appliance Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/15 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 relative"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" /> Add New Appliance
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAppliance} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Appliance Name</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Master Bedroom AC, Water Geyser"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                    >
                      <option value="Cooling" className="bg-slate-900">Cooling (AC, Fan)</option>
                      <option value="Kitchen" className="bg-slate-900">Kitchen (Fridge, Oven)</option>
                      <option value="Laundry" className="bg-slate-900">Laundry (Washing Machine)</option>
                      <option value="Heating" className="bg-slate-900">Heating (Geyser, Heater)</option>
                      <option value="Entertainment" className="bg-slate-900">Entertainment (TV, Console)</option>
                      <option value="Lighting" className="bg-slate-900">Lighting (LED, Bulbs)</option>
                      <option value="Computing" className="bg-slate-900">Computing (PC, Router)</option>
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Power Rating (Watts)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formData.power}
                      onChange={(e) => setFormData({ ...formData, power: Number(e.target.value) })}
                      placeholder="e.g. 1500"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity</label>
                    <input 
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Hours / Day</label>
                    <input 
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="24"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Days / Month</label>
                    <input 
                      type="number"
                      min="1"
                      max="31"
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-xs space-y-1">
                  <p className="text-slate-300">
                    Estimated Consumption: <strong className="text-cyan-400">
                      {Math.round(((formData.power * formData.hours * formData.quantity) / 1000) * formData.days * 10) / 10} kWh / month
                    </strong>
                  </p>
                  <p className="text-slate-300">
                    Estimated Monthly Cost: <strong className="text-green-400">
                      ₹{Math.round(((formData.power * formData.hours * formData.quantity) / 1000) * formData.days * TARIFF_RATE).toLocaleString()}
                    </strong>
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-400 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-cyan-500/20"
                  >
                    Save Appliance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplianceManagement;

