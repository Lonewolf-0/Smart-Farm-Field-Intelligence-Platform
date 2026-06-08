import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { ShieldAlert, FlaskConical } from "lucide-react";
import SoilHistoryChart from "./SoilHistoryChart";
import type { HistoryRecord } from "./SoilHistoryChart";

interface SoilLayerData {
  depthLabel: string;
  ph: number | null;
  organicCarbon: number | null;
  clay: number | null;
  sand: number | null;
  nitrogen: number | null;
  texture: string;
}

interface SoilData {
  layers: SoilLayerData[];
}

interface SoilCardProps {
  fieldId: string;
}

interface SoilAlert {
  type: string;
  severity: "warning" | "critical";
  message: string;
}

const SoilCard: React.FC<SoilCardProps> = ({ fieldId }) => {
  const [data, setData] = useState<SoilData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [alerts, setAlerts] = useState<SoilAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSoilHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/analysis/${fieldId}/soil/history`);
      if (res.data?.success) {
        const { records, alerts } = res.data.data;
        setHistory(records || []);
        setAlerts(alerts || []);
        if (records && records.length > 0) {
          setData(records[0].data);
        } else {
          setData(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load soil data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/analysis/${fieldId}/soil`);
      if (res.data?.success) {
        await fetchSoilHistory();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to run analysis.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fieldId) {
      void fetchSoilHistory();
    }
  }, [fieldId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchSoilHistory}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.layers || data.layers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
        <p className="text-slate-300 mb-4">No soil analysis found for this field.</p>
        <button
          onClick={handleRunAnalysis}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-900/50"
        >
          Run First Analysis
        </button>
      </div>
    );
  }

  // Use top layer (0-5cm) for dashboard summary
  const topLayer = data.layers[0];
  
  // Calculations
  const ph = topLayer.ph;
  const phText = ph === null ? "Unknown" : ph < 6.0 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Neutral";
  const phColor = ph === null ? "text-slate-400" : (ph >= 6.0 && ph <= 7.5) ? "text-green-400" : (ph < 5.5 || ph > 8.0) ? "text-red-400" : "text-yellow-400";
  
  const ocPercentage = topLayer.organicCarbon !== null ? topLayer.organicCarbon / 10 : null;
  const ocColor = ocPercentage === null ? "text-slate-400" : ocPercentage > 1.5 ? "text-green-400" : ocPercentage < 0.5 ? "text-red-400" : "text-yellow-400";
  const ocRating = ocPercentage === null ? "Unknown" : ocPercentage > 1.5 ? "High" : ocPercentage < 0.5 ? "Poor" : "Moderate";

  // Health Score Calculation
  let score = 100;
  if (ph !== null) {
    if (ph < 5.5 || ph > 8.0) score -= 25;
    else if (ph < 6.0 || ph > 7.5) score -= 10;
  }
  if (ocPercentage !== null) {
    if (ocPercentage < 0.5) score -= 25;
    else if (ocPercentage <= 1.5) score -= 10;
  }
  if (topLayer.texture === "Clay" || topLayer.texture === "Sandy") score -= 15;
  else if (topLayer.texture === "Sandy Loam") score -= 5;
  
  const scoreColor = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><FlaskConical className="h-5 w-5 text-cyan-400" />Soil Profile</h3>
          <p className="text-sm text-cyan-200 mt-0.5">Top Layer (0-5cm)</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${scoreColor}`}>{score}</div>
          <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Health Score</div>
        </div>
      </div>

      <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/5 text-center shrink-0">
        <p className="text-sm text-slate-400 mb-1">Dominant Texture</p>
        <p className="text-2xl font-semibold text-white tracking-wide">{topLayer.texture || "Unknown"}</p>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${
              alert.severity === 'critical' ? 'bg-red-950/50 border-red-500/30 text-red-200' : 'bg-yellow-950/50 border-yellow-500/30 text-yellow-200'
            }`}>
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{alert.type} Alert</p>
                <p className="text-xs opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* pH */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <p className="text-xs text-slate-400 mb-1">pH Level</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${phColor}`}>{ph?.toFixed(1) || "-"}</span>
            <span className="text-xs text-slate-300">{phText}</span>
          </div>
        </div>

        {/* Organic Carbon */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <p className="text-xs text-slate-400 mb-1">Organic Carbon</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${ocColor}`}>{ocPercentage?.toFixed(2) || "-"}%</span>
            <span className="text-xs text-slate-300">{ocRating}</span>
          </div>
        </div>

        {/* Clay */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <p className="text-xs text-slate-400 mb-1">Clay Content</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{topLayer.clay?.toFixed(1) || "-"}%</span>
          </div>
        </div>

        {/* Sand */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <p className="text-xs text-slate-400 mb-1">Sand Content</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{topLayer.sand?.toFixed(1) || "-"}%</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white">Historical Trends</h3>
          <button
            onClick={handleRunAnalysis}
            className="px-4 py-2 bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 text-sm font-semibold rounded-lg transition-colors"
          >
            Update Analysis
          </button>
        </div>
        <SoilHistoryChart history={history} />
      </div>
    </div>
  );
};

export default SoilCard;
