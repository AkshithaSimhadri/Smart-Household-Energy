import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  Calendar,
  Loader2,
  Upload,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const API_BASE_URL = 'http://127.0.0.1:8000';

const EnergyForecasting = () => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const generateForecast = async () => {
    if (!selectedFile) {
      setError('Please upload a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/api/energy/forecast/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Forecast generation failed.'
        );
      }

      if (data.status !== 'success') {
        throw new Error('Forecast generation was unsuccessful.');
      }

      const formattedForecast = (data.forecast || []).map((item) => ({
        date: item.date,
        kwh: Number(item.predicted_kwh || 0),
        predicted_kwh: Number(item.predicted_kwh || 0)
      }));

      setForecast(formattedForecast);
      setSummary(data.summary || null);

    } catch (err) {
      console.error('Forecast error:', err);

      setError(
        err.message ||
        'Unable to generate forecast. Please try again.'
      );

      setForecast(null);
      setSummary(null);

    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
    setForecast(null);
    setSummary(null);
  };

  return (
    <div className="space-y-8">

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">

        <div>
          <h1 className="text-3xl font-bold mb-2">
            Consumption Forecasting
          </h1>

          <p className="text-slate-400">
            ML-powered predictions based on your household
            energy usage patterns.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">

            <Upload className="w-5 h-5 text-cyan-400" />

            <span>
              {selectedFile
                ? selectedFile.name
                : 'Upload CSV'}
            </span>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

          </label>

          <button
            onClick={generateForecast}
            disabled={loading || !selectedFile}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}

            {loading
              ? 'Generating...'
              : 'Generate Forecast'}

          </button>

        </div>

      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">

          <FileText className="w-5 h-5 text-cyan-400" />

          <div>
            <p className="text-sm font-semibold text-white">
              Selected dataset
            </p>

            <p className="text-xs text-slate-400">
              {selectedFile.name}
            </p>
          </div>

        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm"
          >
            <p className="text-slate-400 text-sm mb-2">
              Forecast Period
            </p>

            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">
                {summary.forecast_days || 0}
              </span>

              <span className="text-slate-500 mb-1 font-bold">
                days
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm"
          >
            <p className="text-slate-400 text-sm mb-2">
              Predicted Total Usage
            </p>

            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">
                {Number(
                  summary.total_forecast_kwh || 0
                ).toFixed(3)}
              </span>

              <span className="text-slate-500 mb-1 font-bold">
                kWh
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm"
          >
            <p className="text-slate-400 text-sm mb-2">
              Average Daily Usage
            </p>

            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">
                {Number(
                  summary.average_daily_forecast_kwh || 0
                ).toFixed(3)}
              </span>

              <span className="text-slate-500 mb-1 font-bold">
                kWh/day
              </span>
            </div>
          </motion.div>

        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">

          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">

            <Calendar className="w-6 h-6 text-cyan-400" />

            30-Day Forecast

          </h3>

          <div className="h-[400px]">

            {forecast && forecast.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart data={forecast}>

                  <defs>

                    <linearGradient
                      id="forecastColor"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopColor="#06b6d4"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="#06b6d4"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff10"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: 'kWh',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#94a3b8'
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #ffffff20',
                      borderRadius: '12px'
                    }}
                    labelStyle={{
                      color: '#cbd5e1'
                    }}
                    formatter={(value) => [
                      `${Number(value).toFixed(3)} kWh`,
                      'Predicted Usage'
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="kwh"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#forecastColor)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (

              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">

                <TrendingUp className="w-16 h-16 opacity-10" />

                <p>
                  Upload your energy CSV to generate predictions.
                </p>

              </div>

            )}

          </div>

        </div>

        <div className="space-y-6">

          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">

            <h4 className="text-slate-400 text-sm mb-4">
              Historical Data
            </h4>

            {summary ? (

              <>
                <p className="text-2xl font-bold text-white">
                  {summary.last_historical_date}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Last date available in your uploaded dataset.
                </p>
              </>

            ) : (

              <p className="text-sm text-slate-500">
                Upload a dataset to view historical information.
              </p>

            )}

          </div>

          {forecast && forecast.length > 0 && (

            <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">

              <div className="flex items-center gap-2 text-orange-400 mb-3">

                <AlertTriangle className="w-5 h-5" />

                <h4 className="font-bold">
                  Peak Usage
                </h4>

              </div>

              <p className="text-sm text-orange-200/80 leading-relaxed mb-4">
                Your forecast contains higher-consumption
                days. Review the forecast chart to identify
                periods where energy usage is expected to rise.
              </p>

              <div className="p-3 bg-orange-500/20 rounded-xl">

                <p className="text-xs text-orange-300 font-medium">
                  Tip:
                </p>

                <p className="text-xs text-orange-200">
                  Consider shifting flexible appliance usage
                  to lower-consumption periods.
                </p>

              </div>

            </div>

          )}

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">

            <div className="flex items-center gap-2 mb-4">

              <Zap className="w-5 h-5 text-cyan-400" />

              <h4 className="font-bold text-sm text-slate-300">
                Forecast Insight
              </h4>

            </div>

            {forecast && forecast.length > 0 ? (

              <p className="text-sm text-slate-400 leading-relaxed">
                The forecast is generated from your uploaded
                historical energy-consumption data and provides
                predicted electricity usage for the next 30 days.
              </p>

            ) : (

              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your household energy dataset to generate
                a personalized 30-day consumption forecast.
              </p>

            )}

          </div>

        </div>

      </div>

      {forecast && forecast.length > 0 && (

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">

          <h3 className="text-xl font-bold mb-6">
            Daily Forecast
          </h3>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-white/10">

                  <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                    Date
                  </th>

                  <th className="text-right py-4 px-4 text-slate-400 font-semibold">
                    Predicted Consumption
                  </th>

                </tr>

              </thead>

              <tbody>

                {forecast.map((item, index) => (

                  <tr
                    key={`${item.date}-${index}`}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >

                    <td className="py-4 px-4 text-slate-300">
                      {item.date}
                    </td>

                    <td className="py-4 px-4 text-right font-semibold text-cyan-400">
                      {Number(item.predicted_kwh).toFixed(3)} kWh
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
};

export default EnergyForecasting;