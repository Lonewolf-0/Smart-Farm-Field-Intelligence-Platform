import React, { useState, useEffect } from "react";
import { ShieldAlert, FlaskConical, ChevronDown } from "lucide-react";
import SoilHistoryChart from "./SoilHistoryChart";
import type { HistoryRecord } from "./SoilHistoryChart";
import { useAnalysisContext } from "../../context/AnalysisContext";

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
  const { data: contextData, isLoading: loading } = useAnalysisContext();
  const historyData = contextData?.soil as { records: HistoryRecord[]; alerts: SoilAlert[] } | undefined;
  
  const history = historyData?.records || [];
  const alerts = historyData?.alerts || [];
  const data = history.length > 0 ? history[0].data : null;

  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

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

  if (!historyData && !loading) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center">
        <p className="text-red-400 mb-4">Failed to load soil data.</p>
      </div>
    );
  }

  if (!data || !data.layers || data.layers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
        <p className="text-slate-300 mb-4">No soil analysis found for this field. Run a full field analysis from the dashboard.</p>
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
  const calculateScore = (layer: SoilLayerData) => {
    let s = 100;
    if (layer.ph !== null) {
      if (layer.ph < 5.5 || layer.ph > 8.0) s -= 25;
      else if (layer.ph < 6.0 || layer.ph > 7.5) s -= 10;
    }
    const oc = layer.organicCarbon !== null ? layer.organicCarbon / 10 : null;
    if (oc !== null) {
      if (oc < 0.5) s -= 25;
      else if (oc <= 1.5) s -= 10;
    }
    if (layer.texture === "Clay" || layer.texture === "Sandy") s -= 15;
    else if (layer.texture === "Sandy Loam") s -= 5;
    return s;
  };

  const score = calculateScore(topLayer);
  const scoreColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const outerBorder = score >= 80 ? "border-emerald-500/30" : score >= 60 ? "border-yellow-500/50" : "border-red-500/50";

  let trendText = null;
  let trendColor = "text-slate-400 bg-slate-900/40";
  if (history.length > 1 && history[1].data?.layers?.[0]) {
    const prevScore = calculateScore(history[1].data.layers[0]);
    const diff = score - prevScore;
    if (diff > 0) {
      trendText = `Score: +${diff} pts`;
      trendColor = "text-emerald-400 bg-slate-900/40 border-emerald-500/30";
    } else if (diff < 0) {
      trendText = `Score: ${diff} pts`;
      trendColor = "text-red-400 bg-slate-900/40 border-red-500/50";
    } else {
      trendText = "Score: Unchanged";
      trendColor = "text-slate-400 bg-slate-900/40 border-slate-500/30";
    }
  }

  const lastFetched = history.length > 0 ? history[0].created_at : null;
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`rounded-2xl border ${outerBorder} bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><FlaskConical className="h-5 w-5 text-emerald-400" />Soil Profile</h3>
          <p className="text-sm font-semibold text-emerald-100 mt-0.5">Top Layer (0-5cm)</p>
          {lastFetched && (
            <p className="text-[11px] font-bold text-slate-200 uppercase tracking-wider mt-1.5">
              Updated: {formatDate(lastFetched)}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${scoreColor}`}>{score}</div>
          <div className="text-xs font-bold text-slate-200 uppercase tracking-widest mt-1">Health Score</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${
              alert.severity === 'critical' ? 'bg-slate-900/40 border-red-500/50 text-red-400' : 'bg-slate-900/40 border-yellow-500/50 text-yellow-400'
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

      <div className="flex flex-col gap-6 flex-1 justify-center mt-2">
        {/* pH Bar */}
        <div>
          <div className="mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">pH Level</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tracking-tight ${phColor}`}>{ph?.toFixed(1) || "-"}</span>
              <span className="text-sm font-medium text-slate-400">{phText}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
            {/* Ideal zone indicator for pH (6.0 - 7.5) -> 42% to 53% */}
            <div className="absolute top-0 bottom-0 left-[42%] w-[11%] bg-green-500/10 border-x border-green-500/20 z-0"></div>
            <div 
              className={`h-full rounded-full transition-all duration-1000 relative z-10 ${ph === null ? "bg-slate-400" : (ph >= 6.0 && ph <= 7.5) ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : (ph < 5.5 || ph > 8.0) ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" : "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"}`}
              style={{ width: `${Math.min((ph || 0) / 14 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Organic Carbon Bar */}
        <div>
          <div className="mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Organic Carbon</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tracking-tight ${ocColor}`}>{ocPercentage?.toFixed(2) || "-"}%</span>
              <span className="text-sm font-medium text-slate-400">{ocRating}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 relative z-10 ${ocPercentage === null ? "bg-slate-400" : ocPercentage > 1.5 ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : ocPercentage < 0.5 ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" : "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"}`}
              style={{ width: `${Math.min(((ocPercentage || 0) / 3) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Composition Bar */}
        <div>
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Composition</span>
            <span className="text-2xl font-black text-white tracking-tight">{topLayer.texture || "Unknown"}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
            {/* Clay */}
            <div 
              className="h-full bg-amber-600 transition-all duration-1000"
              style={{ width: `${topLayer.clay || 0}%` }}
              title={`Clay: ${topLayer.clay}%`}
            />
            {/* Sand */}
            <div 
              className="h-full bg-yellow-500 transition-all duration-1000"
              style={{ width: `${topLayer.sand || 0}%` }}
              title={`Sand: ${topLayer.sand}%`}
            />
            {/* Silt (the rest) */}
            <div 
              className="h-full bg-slate-600 transition-all duration-1000"
              style={{ width: `${Math.max(0, 100 - (topLayer.clay || 0) - (topLayer.sand || 0))}%` }}
              title={`Silt/Other: ${Math.max(0, 100 - (topLayer.clay || 0) - (topLayer.sand || 0))}%`}
            />
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Clay ({topLayer.clay?.toFixed(0)}%)</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Sand ({topLayer.sand?.toFixed(0)}%)</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span> Silt</div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <button 
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">Historical Trends</h3>
            {trendText && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${trendColor}`}>
                {trendText}
              </span>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-200 font-bold transition-transform duration-300 group-hover:text-white ${isHistoryExpanded ? "rotate-180" : ""}`} />
        </button>
        
        <div className={`grid transition-all duration-300 ease-in-out ${isHistoryExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <SoilHistoryChart history={history} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoilCard;
