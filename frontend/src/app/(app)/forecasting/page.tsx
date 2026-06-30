'use client';

import { useEffect, useState } from 'react';
import { forecastsApi, materialsApi } from '@/lib/api';
import { Material, Forecast } from '@/types';
import { toast } from 'sonner';
import { TrendingUp, Plus, Trash2, Calculator } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, Button, Spinner, EmptyState
} from '@/components/ui';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

export default function ForecastingPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [alpha, setAlpha] = useState(0.3);
  const [historicalInputs, setHistoricalInputs] = useState<string[]>(['100', '120', '110', '140', '130', '115']);
  const [results, setResults] = useState<{
    historicalLabels: string[];
    historicalData: number[];
    smoothedData: number[];
    futureLabels: string[];
    futureForecasts: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [forecastsLoading, setForecastsLoading] = useState(true);

  useEffect(() => {
    materialsApi.getAll({ limit: 200 }).then((r) => setMaterials(r.data.data));
    forecastsApi.getAll()
      .then((r) => setForecasts(r.data.data))
      .finally(() => setForecastsLoading(false));
  }, []);

  const handleCalculate = async () => {
    if (!selectedMaterial) {
      toast.error('Please select a material');
      return;
    }
    const data = historicalInputs.map(Number).filter((n) => !isNaN(n) && n >= 0);
    if (data.length < 2) {
      toast.error('Please enter at least 2 historical data points');
      return;
    }

    setLoading(true);
    try {
      const res = await forecastsApi.calculate({
        materialId: selectedMaterial,
        alpha,
        historicalData: data,
      });
      setResults(res.data.data.results);
      toast.success('Forecast calculated successfully');
      // Refresh forecasts list
      forecastsApi.getAll().then((r) => setForecasts(r.data.data));
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to calculate forecast');
    } finally {
      setLoading(false);
    }
  };

  const addDataPoint = () => setHistoricalInputs([...historicalInputs, '']);
  const removeDataPoint = (i: number) => {
    if (historicalInputs.length <= 2) return;
    setHistoricalInputs(historicalInputs.filter((_, idx) => idx !== i));
  };
  const updateDataPoint = (i: number, val: string) => {
    setHistoricalInputs(historicalInputs.map((v, idx) => idx === i ? val : v));
  };

  // Build chart data
  const chartData = results ? [
    ...results.historicalLabels.map((label, i) => ({
      period: label,
      actual: results.historicalData[i],
      smoothed: parseFloat(results.smoothedData[i].toFixed(2)),
      forecast: null as number | null,
      type: 'historical',
    })),
    ...results.futureLabels.map((label, i) => ({
      period: label,
      actual: null as number | null,
      smoothed: null as number | null,
      forecast: parseFloat(results.futureForecasts[i].toFixed(2)),
      type: 'future',
    })),
  ] : [];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Demand Forecasting</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Single Exponential Smoothing: F<sub>t+1</sub> = α·D<sub>t</sub> + (1−α)·F<sub>t</sub>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Forecast Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Material selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-blue-500/40 focus:border-gray-300 dark:focus:border-blue-600"
              >
                <option value="">Select material...</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.materialCode})</option>
                ))}
              </select>
            </div>

            {/* Alpha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Smoothing Factor (α = {alpha})
              </label>
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 (Stable)</span>
                <span>1 (Reactive)</span>
              </div>
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                <strong>α = {alpha}</strong>: {alpha < 0.3 ? 'Slow adaptation, more weight on past forecasts' : alpha > 0.7 ? 'Fast adaptation, more weight on recent data' : 'Balanced between recent data and historical trend'}
              </div>
            </div>

            {/* Historical data input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Historical Demand</label>
                <Button type="button" variant="outline" size="sm" onClick={addDataPoint}>
                  <Plus size={13} />
                </Button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {historicalInputs.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={val}
                      onChange={(e) => updateDataPoint(i, e.target.value)}
                      placeholder="0"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    {historicalInputs.length > 2 && (
                      <button onClick={() => removeDataPoint(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCalculate} disabled={loading} className="w-full">
              {loading ? <Spinner className="h-4 w-4" /> : <Calculator size={16} />}
              {loading ? 'Calculating...' : 'Calculate Forecast'}
            </Button>
          </CardContent>
        </Card>

        {/* Chart Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Forecast Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            {!results ? (
              <EmptyState
                title="No forecast calculated yet"
                description="Select a material, set parameters, and click Calculate"
                icon={<TrendingUp size={40} />}
              />
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        value !== null ? Number(value).toFixed(1) : 'N/A',
                        name === 'actual' ? 'Actual Demand' : name === 'smoothed' ? 'Smoothed' : 'Forecast'
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine
                      x={results.historicalLabels[results.historicalLabels.length - 1]}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{ value: 'Forecast →', position: 'top', fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Line type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                    <Line type="monotone" dataKey="smoothed" name="Smoothed" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="8 4" dot={{ r: 4 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>

                {/* 6-Month Forecast Table */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">6-Month Demand Prediction</h4>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {results.futureLabels.map((label, i) => (
                      <div key={label} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-2 text-center">
                        <p className="text-xs text-amber-600 font-medium">{label}</p>
                        <p className="text-base font-bold text-gray-800 mt-0.5">
                          {results.futureForecasts[i].toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">units</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-500">
                  <strong>Formula:</strong> F<sub>t+1</sub> = {alpha}·D<sub>t</sub> + {(1 - alpha).toFixed(2)}·F<sub>t</sub>
                  {' '}| Alpha (α): <strong>{alpha}</strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Forecasts</CardTitle>
        </CardHeader>
        <CardContent>
          {forecastsLoading ? (
            <div className="flex items-center justify-center py-8"><Spinner className="h-5 w-5" /></div>
          ) : forecasts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No saved forecasts yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((f) => {
                const futureData = f.forecastData as { future: number[]; futureLabels: string[] };
                const nextMonthForecast = futureData?.future?.[0];
                return (
                  <div key={f.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={15} className="text-blue-500" />
                      <span className="font-medium text-gray-800 text-sm">{f.material?.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mb-2">{f.material?.materialCode}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-2">
                        <p className="text-gray-500 dark:text-gray-500">Alpha</p>
                        <p className="font-bold text-blue-700 dark:text-blue-400">{f.alpha}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2">
                        <p className="text-gray-500 dark:text-gray-500">Next Month</p>
                        <p className="font-bold text-amber-700 dark:text-amber-400">
                          {nextMonthForecast !== undefined ? nextMonthForecast.toFixed(0) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
