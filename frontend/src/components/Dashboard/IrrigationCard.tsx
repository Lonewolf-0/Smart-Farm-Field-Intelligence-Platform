import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Droplets, CloudRain, Sun } from "lucide-react";

interface IrrigationPlan {
  nextIrrigationDays: number;
  waterRequired: number;
  currentSoilMoisture: number;
  dailyET: number;
  rainfallNext7Days: number;
}

interface IrrigationCardProps {
  fieldId: string;
}

const IrrigationCard: React.FC<IrrigationCardProps> = ({ fieldId }) => {
  const [data, setData] = useState<IrrigationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIrrigationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/analysis/${fieldId}/irrigation`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load irrigation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fieldId) {
      void fetchIrrigationData();
    }
  }, [fieldId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse h-full">
        <div className="h-6 w-32 bg-slate-800 rounded mb-6"></div>
        <div className="h-32 w-32 bg-slate-800 rounded-full mx-auto mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-800 rounded-xl"></div>
          <div className="h-16 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center h-full flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchIrrigationData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Urgency logic
  let urgencyColor = "text-green-400";
  let bgGlow = "shadow-green-900/20";
  let urgencyText = "Optimal";
  let gaugeColor = "#4ade80"; // green-400

  if (data.nextIrrigationDays <= 1) {
    urgencyColor = "text-red-400";
    bgGlow = "shadow-red-900/40";
    urgencyText = "Critical";
    gaugeColor = "#f87171"; // red-400
  } else if (data.nextIrrigationDays <= 5) {
    urgencyColor = "text-yellow-400";
    bgGlow = "shadow-yellow-900/30";
    urgencyText = "Approaching";
    gaugeColor = "#facc15"; // yellow-400
  }

  // Calculations
  const litersPerHectare = (data.waterRequired * 10000).toLocaleString();
  
  // SVG Gauge Calculations
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const moistureSafe = Math.max(0, Math.min(100, data.currentSoilMoisture));
  const dashoffset = circumference - (moistureSafe / 100) * circumference;

  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col ${bgGlow}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-emerald-400" />
            Irrigation Plan
          </h3>
          <p className="text-sm text-emerald-200 mt-0.5">Smart scheduling engine</p>
        </div>
        <div className={`px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold tracking-wide uppercase ${urgencyColor}`}>
          {urgencyText}
        </div>
      </div>

      {/* Main Countdown & Gauge */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6 relative">
        <div className="w-full max-w-[200px] relative">
          <svg viewBox="0 0 100 55" className="w-full drop-shadow-lg">
            {/* Background Track */}
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="8" 
              strokeLinecap="round" 
            />
            {/* MAD Marker (50%) */}
            <path 
              d="M 49 10 L 51 10" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="10" 
              opacity="0.5"
            />
            {/* Value Track */}
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke={gaugeColor} 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeDasharray={circumference} 
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 text-center">
            <p className="text-3xl font-black text-white">{data.currentSoilMoisture}%</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Soil Moisture</p>
          </div>
        </div>
      </div>

      {/* Primary Action Call */}
      <div className="text-center mb-8">
        <p className="text-slate-400 text-sm mb-1">Next irrigation in</p>
        <p className={`text-4xl font-black ${urgencyColor}`}>
          {data.nextIrrigationDays === 0 ? "TODAY" : `${data.nextIrrigationDays} Days`}
        </p>
        {data.waterRequired > 0 ? (
          <p className="text-sm text-emerald-200 mt-2 font-medium bg-emerald-950/30 inline-block px-4 py-1.5 rounded-full border border-emerald-900/50">
            Needs {data.waterRequired} mm ({litersPerHectare} L/ha)
          </p>
        ) : (
          <p className="text-sm text-green-200 mt-2 font-medium bg-green-950/30 inline-block px-4 py-1.5 rounded-full border border-green-900/50">
            No watering required
          </p>
        )}
      </div>

      {/* Supporting Data Grid */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
          <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Daily ET</p>
            <p className="text-sm font-bold text-slate-200">{data.dailyET} <span className="text-xs font-normal text-slate-500">mm/d</span></p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400">7-Day Rain</p>
            <p className="text-sm font-bold text-slate-200">{data.rainfallNext7Days} <span className="text-xs font-normal text-slate-500">mm</span></p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IrrigationCard;
