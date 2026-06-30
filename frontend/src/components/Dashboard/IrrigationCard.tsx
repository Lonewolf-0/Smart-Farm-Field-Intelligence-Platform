import React from "react";
import { Droplets, CloudRain, Sun, Info } from "lucide-react";
import { useAnalysisContext } from "../../context/AnalysisContext";

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
  const { data: contextData, isLoading: loading } = useAnalysisContext();
  const data = contextData?.irrigation as IrrigationPlan | undefined;

  if (loading && !data) {
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

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center h-full flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">Failed to load irrigation data.</p>
      </div>
    );
  }

  // Urgency logic
  let urgencyColor = "text-emerald-400";
  let urgencyText = "Optimal";
  let gaugeColor = "#34d399"; // emerald-400
  let outerBorder = "border-emerald-500/30";

  if (data.nextIrrigationDays <= 1) {
    urgencyColor = "text-red-400";
    urgencyText = "Critical";
    gaugeColor = "#ef4444"; // red-500
    outerBorder = "border-red-500/50";
  } else if (data.nextIrrigationDays <= 5) {
    urgencyColor = "text-yellow-400";
    urgencyText = "Approaching";
    gaugeColor = "#eab308"; // yellow-500
    outerBorder = "border-yellow-500/50";
  }

  // Calculations
  const waterRequiredInches = data.waterRequired / 25.4;
  const gallonsPerAcre = Math.round(waterRequiredInches * 27154).toLocaleString();
  
  // SVG Gauge Calculations
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const moistureSafe = Math.max(0, Math.min(100, data.currentSoilMoisture));
  const dashoffset = circumference - (moistureSafe / 100) * circumference;

  return (
    <div className={`rounded-2xl border ${outerBorder} bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-emerald-400" />
            <span>Irrigation Plan</span>
            <div className="relative group cursor-pointer inline-flex items-center">
              <Info className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-72 p-3.5 text-xs text-white bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-black/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none text-center font-medium normal-case leading-relaxed">
                Calculates soil moisture levels and predicts the next optimal irrigation schedule. Helps avoid overwatering or crop stress by computing exact water requirements.
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 border-l border-t border-emerald-500/30 rotate-45"></div>
              </div>
            </div>
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
            Needs {waterRequiredInches.toFixed(2)} in ({gallonsPerAcre} Gal/acre)
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
            <p className="text-sm font-bold text-slate-200">{(data.dailyET / 25.4).toFixed(1)} <span className="text-xs font-normal text-slate-500">in/d</span></p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400">7-Day Rain</p>
            <p className="text-sm font-bold text-slate-200">{(data.rainfallNext7Days / 25.4).toFixed(1)} <span className="text-xs font-normal text-slate-500">in</span></p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-white/5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <p>
            <span className="font-semibold text-slate-300">Irrigation Guide:</span> &gt;5 Days Optimal, 2-5 Days Approaching, &le;1 Day Critical.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IrrigationCard;
