import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, TrendingUp, DollarSign, Leaf, Info, ArrowRight, Clock, Award, ShieldCheck, Zap } from 'lucide-react';

const SolarROI = () => {
  const [inputs, setInputs] = useState({
    monthlyBill: 3500,
    roofArea: 400,
    location: 'Maharashtra',
    sunHours: 5.2
  });

  const calculateSolar = (bill, area, sunHrs) => {
    const avgTariff = 7.5; // ₹/kWh
    const monthlyKwhTarget = bill / avgTariff;
    const capacityByArea = area / 100; // 1 kWp needs ~100 sq.ft.
    const capacityByBill = monthlyKwhTarget / 120; // 1 kWp produces ~120 kWh/mo

    const recommendedCapacity = Math.max(1, Math.round(Math.min(capacityByArea, capacityByBill) * 10) / 10);
    const monthlyGenerationKwh = Math.round(recommendedCapacity * 120);
    const grossCost = recommendedCapacity * 60000; // ₹60,000 per kWp gross
    const subsidy = recommendedCapacity <= 2 ? recommendedCapacity * 30000 : recommendedCapacity <= 3 ? 78000 : 78000;
    const netCost = Math.max(20000, grossCost - subsidy);

    const monthlySavings = Math.round(Math.min(bill * 0.9, monthlyGenerationKwh * avgTariff));
    const annualSavings = monthlySavings * 12;
    const paybackYears = Math.round((netCost / annualSavings) * 10) / 10;
    const longTermSavings = Math.round((annualSavings * 25) - netCost);
    const roiPercentage = Math.round((longTermSavings / netCost) * 100);
    const co2Reduction = Math.round(recommendedCapacity * 1250);

    return {
      capacity: recommendedCapacity,
      monthlyGen: monthlyGenerationKwh,
      grossCost: grossCost,
      subsidy: subsidy,
      netCost: netCost,
      monthlySavings: monthlySavings,
      annualSavings: annualSavings,
      payback: paybackYears,
      longTermSavings: longTermSavings,
      roi: roiPercentage,
      co2: co2Reduction
    };
  };

  const [results, setResults] = useState(() => calculateSolar(inputs.monthlyBill, inputs.roofArea, inputs.sunHours));

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = calculateSolar(Number(inputs.monthlyBill) || 3000, Number(inputs.roofArea) || 300, Number(inputs.sunHours) || 5.2);
    setResults(res);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Rooftop Solar ROI Calculator</h1>
        <p className="text-slate-400 text-sm">Estimate rooftop capacity, installation cost, government subsidy, and 25-year financial savings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Details Form */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm h-fit space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Household & Solar Inputs</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Avg. Monthly Electricity Bill (₹)</label>
              <input 
                type="number" 
                min="500"
                step="100"
                value={inputs.monthlyBill}
                onChange={(e) => setInputs({ ...inputs, monthlyBill: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Available Shade-Free Roof Area (Sq. Ft.)</label>
              <input 
                type="number" 
                min="100"
                step="50"
                value={inputs.roofArea}
                onChange={(e) => setInputs({ ...inputs, roofArea: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">State / Region</label>
              <select
                value={inputs.location}
                onChange={(e) => setInputs({ ...inputs, location: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all text-sm"
              >
                <option value="Maharashtra" className="bg-slate-900">Maharashtra</option>
                <option value="Delhi" className="bg-slate-900">Delhi (NCR)</option>
                <option value="Gujarat" className="bg-slate-900">Gujarat</option>
                <option value="Karnataka" className="bg-slate-900">Karnataka</option>
                <option value="Tamil Nadu" className="bg-slate-900">Tamil Nadu</option>
                <option value="Telangana" className="bg-slate-900">Telangana / AP</option>
                <option value="Rajasthan" className="bg-slate-900">Rajasthan</option>
                <option value="West Bengal" className="bg-slate-900">West Bengal</option>
                <option value="Other" className="bg-slate-900">Other State</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 mt-4"
            >
              Recalculate ROI <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Results & Financial Analysis Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Capacity & CO2 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-transparent border border-yellow-500/30 p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <Sun className="w-8 h-8 text-yellow-400" />
                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full uppercase tracking-wider border border-yellow-500/30">
                  Capacity
                </span>
              </div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Recommended System</p>
              <h3 className="text-3xl font-black text-white">{results.capacity} <span className="text-base font-bold text-yellow-400">kWp</span></h3>
              <p className="text-[11px] text-slate-400 mt-2">Generates ~{results.monthlyGen} kWh / month</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent border border-green-500/30 p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <Leaf className="w-8 h-8 text-green-400" />
                <span className="text-[10px] font-bold bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-500/30">
                  Eco Offset
                </span>
              </div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Annual CO₂ Reduction</p>
              <h3 className="text-3xl font-black text-white">{results.co2.toLocaleString()} <span className="text-base font-bold text-green-400">kg</span></h3>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Equivalent to planting ~{Math.round(results.co2 / 20)} trees</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <Award className="w-8 h-8 text-cyan-400" />
                <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full uppercase tracking-wider border border-cyan-500/30">
                  25-Yr ROI
                </span>
              </div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Return on Investment</p>
              <h3 className="text-3xl font-black text-cyan-400">{results.roi}%</h3>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">25-Yr Savings: ₹{results.longTermSavings.toLocaleString()}</p>
            </div>

          </div>

          {/* Financial Breakdown Panel */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Detailed Financial Breakdown</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                  <DollarSign className="w-4 h-4 text-slate-400" /> Gross System Cost
                </p>
                <p className="text-xl font-bold text-white">₹{results.grossCost.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-green-400" /> Govt PM Subsidy
                </p>
                <p className="text-xl font-bold text-green-400">- ₹{results.subsidy.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                  <Zap className="w-4 h-4 text-yellow-400" /> Net Out-Of-Pocket Cost
                </p>
                <p className="text-xl font-bold text-yellow-400">₹{results.netCost.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-cyan-400" /> Payback Period
                </p>
                <p className="text-xl font-bold text-cyan-400">{results.payback} Years</p>
              </div>
            </div>

            {/* Savings Timeline */}
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-200">
                <span>Estimated Monthly Savings</span>
                <span className="text-green-400 font-bold text-base">₹{results.monthlySavings.toLocaleString()} / month</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-200">
                <span>Estimated Annual Savings</span>
                <span className="text-green-400 font-bold text-base">₹{results.annualSavings.toLocaleString()} / year</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-200 pt-2 border-t border-white/10">
                <span>25-Year Cumulative Net Savings</span>
                <span className="text-cyan-400 font-bold text-lg">₹{results.longTermSavings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* PM Surya Ghar Subsidy Banner */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl flex items-start gap-4 text-left">
            <Info className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-yellow-200/90 leading-relaxed space-y-1">
              <strong className="text-white font-bold block text-sm">PM Surya Ghar: Muft Bijli Yojana Subsidy Applied</strong>
              <p>
                Under current Ministry of New and Renewable Energy (MNRE) guidelines, residential systems up to 2 kW receive ₹30,000/kW and 3 kW systems receive up to ₹78,000 total subsidy.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SolarROI;

