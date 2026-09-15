import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Home, Users, Zap, Save, ChevronRight, ChevronLeft, CheckCircle2, RefreshCw, Award, TrendingUp, AlertTriangle } from 'lucide-react';

const HomeEnergyAudit = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    homeType: 'Apartment',
    rooms: 3,
    occupants: 4,
    hasSolar: false,
    acUsage: 'Moderate (4-8 hrs/day)',
    acStarRating: '3 Star',
    heatingType: 'Electric Geyser',
    lightingType: 'Mixed (LED + CFL)',
    refrigeratorType: 'Standard Double Door',
    offPeakUsage: 'Sometimes',
    avgBill: 3500
  });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const generateAuditReport = (data) => {
    let score = 85;
    let potentialSavings = 0;
    const recommendations = [];

    // AC Penalty/Bonus
    if (data.acUsage.includes('Heavy')) {
      score -= 20;
      potentialSavings += 750;
      recommendations.push("Set Air Conditioner temperature to 24°C - 26°C instead of 18°C - 20°C to save up to 24% on cooling energy.");
    } else if (data.acUsage.includes('Moderate')) {
      score -= 10;
      potentialSavings += 400;
      recommendations.push("Use smart timers for AC units to avoid unnecessary overnight cooling.");
    }

    if (data.acStarRating.includes('3 Star') || data.acStarRating.includes('Unrated')) {
      score -= 8;
      potentialSavings += 500;
      recommendations.push("Upgrade older ACs to 5-Star Inverter models for up to 35% lower compressor power consumption.");
    }

    // Geyser / Water Heating
    if (data.heatingType === 'Electric Geyser') {
      score -= 12;
      potentialSavings += 450;
      recommendations.push("Install a Solar Water Heater or heat pump geyser to eliminate electric water heating charges.");
    }

    // Lighting
    if (data.lightingType.includes('Incandescent') || data.lightingType.includes('Mixed')) {
      score -= 10;
      potentialSavings += 250;
      recommendations.push("Replace all legacy CFL & fluorescent tube lights with 100% high-efficiency LED lights.");
    }

    // Solar
    if (!data.hasSolar) {
      score -= 10;
      potentialSavings += 1200;
      recommendations.push("Install rooftop solar under the PM Surya Ghar scheme to offset up to 85% of grid electricity consumption.");
    } else {
      score += 10;
    }

    // Off-peak usage
    if (data.offPeakUsage === 'Rarely') {
      score -= 5;
      potentialSavings += 200;
      recommendations.push("Shift heavy appliance operations (Washing Machine, Water Pump) to off-peak hours (10pm - 6am).");
    }

    const finalScore = Math.max(35, Math.min(98, score));
    if (recommendations.length === 0) {
      recommendations.push("Your household efficiency is already top tier! Maintain current usage habits and clean AC filters monthly.");
    }

    return {
      score: finalScore,
      potentialSavings: potentialSavings,
      recommendations: recommendations
    };
  };

  const handleStartAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const res = generateAuditReport(formData);
      setReport(res);
      setAnalyzing(false);
      setStep(4);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Home Energy Audit Assessment</h1>
        <p className="text-slate-400 text-sm">Comprehensive household efficiency assessment, score generation, and tailored action plan.</p>
      </header>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-4 max-w-2xl">
        {[
          { step: 1, label: 'Profile' },
          { step: 2, label: 'Appliances' },
          { step: 3, label: 'Habits' },
          { step: 4, label: 'Report' }
        ].map((s) => (
          <div key={s.step} className="flex-1 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s.step ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
            }`}>
              {s.step}
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">{s.label}</span>
            {s.step < 4 && <div className={`flex-1 h-1 rounded-full ${step > s.step ? 'bg-cyan-500' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm max-w-2xl">
        
        {/* Step 1: Home Profile */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white border-b border-white/10 pb-3">
              <Home className="w-5 h-5 text-cyan-400" /> Step 1: Home Profile & Solar Infrastructure
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Residence Type</label>
                <select
                  value={formData.homeType}
                  onChange={(e) => setFormData({ ...formData, homeType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                >
                  <option value="Apartment" className="bg-slate-900">Apartment / Flat</option>
                  <option value="Independent House" className="bg-slate-900">Independent House / Row House</option>
                  <option value="Villa" className="bg-slate-900">Villa / Bungalow</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Number of Rooms</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Occupants</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.occupants}
                    onChange={(e) => setFormData({ ...formData, occupants: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="solarCheck"
                  checked={formData.hasSolar}
                  onChange={(e) => setFormData({ ...formData, hasSolar: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="solarCheck" className="text-sm text-slate-200 font-medium">
                  Rooftop Solar Already Installed
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={nextStep}
                className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 text-white shadow-lg shadow-cyan-500/20"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Appliance Efficiency */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white border-b border-white/10 pb-3">
              <Zap className="w-5 h-5 text-cyan-400" /> Step 2: Cooling, Heating & Lighting Audit
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Air Conditioning Usage</label>
                <select
                  value={formData.acUsage}
                  onChange={(e) => setFormData({ ...formData, acUsage: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                >
                  <option value="None" className="bg-slate-900">No Air Conditioner</option>
                  <option value="Low (< 4 hrs/day)" className="bg-slate-900">Low (&lt; 4 hrs/day)</option>
                  <option value="Moderate (4-8 hrs/day)" className="bg-slate-900">Moderate (4-8 hrs/day)</option>
                  <option value="Heavy (> 8 hrs/day)" className="bg-slate-900">Heavy (&gt; 8 hrs/day)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">AC Efficiency Star Rating</label>
                <select
                  value={formData.acStarRating}
                  onChange={(e) => setFormData({ ...formData, acStarRating: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                >
                  <option value="5 Star Inverter" className="bg-slate-900">5-Star Inverter AC</option>
                  <option value="3 Star" className="bg-slate-900">3-Star AC</option>
                  <option value="Non-Inverter / Unrated" className="bg-slate-900">Older Non-Inverter / Unrated</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Water Heating System</label>
                <select
                  value={formData.heatingType}
                  onChange={(e) => setFormData({ ...formData, heatingType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                >
                  <option value="Electric Geyser" className="bg-slate-900">Electric Geyser (Immersion/Storage)</option>
                  <option value="Solar Water Heater" className="bg-slate-900">Solar Water Heater</option>
                  <option value="Gas Geyser" className="bg-slate-900">Gas Geyser</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Lighting Type</label>
                <select
                  value={formData.lightingType}
                  onChange={(e) => setFormData({ ...formData, lightingType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                >
                  <option value="100% LED" className="bg-slate-900">100% LED Bulbs & Panels</option>
                  <option value="Mixed (LED + CFL)" className="bg-slate-900">Mixed (LED + CFL Tubes)</option>
                  <option value="Incandescent / Halogen" className="bg-slate-900">Incandescent / Filament Bulbs</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 text-slate-400 hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={nextStep}
                className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 text-white shadow-lg shadow-cyan-500/20"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Habits & Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white border-b border-white/10 pb-3">
              <ClipboardCheck className="w-5 h-5 text-cyan-400" /> Step 3: Consumption Habits & Summary Review
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Avg Monthly Electricity Bill (₹)</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={formData.avgBill}
                  onChange={(e) => setFormData({ ...formData, avgBill: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Do you run heavy appliances during off-peak hours?</label>
                <select
                  value={formData.offPeakUsage}
                  onChange={(e) => setFormData({ ...formData, offPeakUsage: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none text-sm"
                >
                  <option value="Frequently" className="bg-slate-900">Frequently (Night / Off-peak)</option>
                  <option value="Sometimes" className="bg-slate-900">Sometimes</option>
                  <option value="Rarely" className="bg-slate-900">Rarely / During Peak Hours</option>
                </select>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-xs text-slate-300 space-y-1">
                <p><span className="text-slate-500">Home Profile:</span> {formData.homeType}, {formData.rooms} Rooms, {formData.occupants} Occupants</p>
                <p><span className="text-slate-500">Cooling & Heating:</span> {formData.acUsage} ({formData.acStarRating}), {formData.heatingType}</p>
                <p><span className="text-slate-500">Lighting:</span> {formData.lightingType}</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 text-slate-400 hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={analyzing}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 text-white shadow-lg shadow-cyan-500/20"
              >
                {analyzing ? 'Evaluating Audit Rules...' : 'Generate Audit Report'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Final Assessment Report */}
        {step === 4 && report && (
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-white/10">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl border text-4xl font-black mb-3 ${
                report.score >= 80 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : report.score >= 60 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {report.score}%
              </div>
              <h2 className="text-2xl font-bold text-white">Efficiency Rating</h2>
              <p className="text-slate-300 text-sm mt-1">
                Potential Monthly Savings: <span className="text-green-400 font-bold text-lg">₹{report.potentialSavings.toLocaleString()}</span> / month
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prioritized Action Plan</h3>
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 text-slate-300 hover:bg-white/5 border border-white/10"
              >
                <RefreshCw className="w-4 h-4" /> Retake Assessment
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeEnergyAudit;


