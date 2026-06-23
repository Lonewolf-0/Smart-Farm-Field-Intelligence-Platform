import React, { useState } from "react";
import { Activity, Droplets, AlertTriangle, ShieldCheck, FlaskConical, Leaf } from "lucide-react";
import { useAnalysisContext } from "../../context/AnalysisContext";
import type { RiskAlert } from "../../types";

interface SummaryCardProps {
  onNavigate?: (tab: "overview" | "crop_health" | "agronomy") => void;
  fieldId: string;
  selectedCrop: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ onNavigate, fieldId, selectedCrop }) => {
  const { data: contextData, isLoading } = useAnalysisContext();
  const [dismissedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("dismissed_risks");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-xl backdrop-blur-md animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!contextData) return null;

  const allAlerts = (contextData.risks as RiskAlert[]) || [];
  const activeAlerts = allAlerts.filter(alert => {
    const uniqueKey = `${fieldId}_${alert.type}_${alert.expectedDate}`;
    return !dismissedKeys.includes(uniqueKey);
  });
  const criticalAlerts = activeAlerts.filter(a => a.severity === "critical" || a.severity === "high");
  
  const pesticideData = contextData.pesticide as any;
  const pestAssessments = pesticideData?.assessments || [];
  const hasHighPestRisk = pestAssessments.some((a: any) => a.riskLevel === "High");
  const hasMediumPestRisk = pestAssessments.some((a: any) => a.riskLevel === "Medium");

  const isCriticalThreat = criticalAlerts.length > 0 || hasHighPestRisk;
  const hasRisks = isCriticalThreat || hasMediumPestRisk;

  let threatTitle = "Threat Level";
  let threatValue = "All Clear";
  let threatSubtext = "No critical risks";

  if (hasHighPestRisk) {
    threatTitle = "Pest Warning";
    threatValue = "High Pest Risk";
    threatSubtext = "Immediate spray recommended";
  } else if (criticalAlerts.length > 0) {
    threatTitle = "Active Alerts";
    threatValue = `${criticalAlerts.length} Critical`;
    threatSubtext = "Requires attention";
  } else if (hasMediumPestRisk) {
    threatTitle = "Pest Warning";
    threatValue = "Medium Pest Risk";
    threatSubtext = "Monitor closely";
  }

  // 2. Analyze Irrigation
  const irrigation = contextData.irrigation as any;
  const isIrrigationUrgent = irrigation && irrigation.nextIrrigationDays <= 1;

  // 3. Analyze Health
  const ndvi = contextData.ndvi as any;
  const healthScore = ndvi?.healthScore || "Unknown";
  const healthIsGood = healthScore === "Excellent" || healthScore === "Good" || healthScore === "Moderate";

  // 4. Analyze Soil Score
  const soilData = contextData.soil as any;
  let soilScore: number | string = "No Data";
  let soilHealth = "Unknown";
  let soilIsGood = false;
  if (soilData?.records?.length > 0) {
    const topLayer = soilData.records[0].data.layers[0];
    let s = 100;
    if (topLayer.ph !== null) {
      if (topLayer.ph < 5.5 || topLayer.ph > 8.0) s -= 25;
      else if (topLayer.ph < 6.0 || topLayer.ph > 7.5) s -= 10;
    }
    const oc = topLayer.organicCarbon !== null ? topLayer.organicCarbon / 10 : null;
    if (oc !== null) {
      if (oc < 0.5) s -= 25;
      else if (oc <= 1.5) s -= 10;
    }
    if (topLayer.texture === "Clay" || topLayer.texture === "Sandy") s -= 15;
    else if (topLayer.texture === "Sandy Loam") s -= 5;
    soilScore = s;
    soilHealth = s >= 80 ? "Optimal" : s >= 60 ? "Moderate" : "Poor";
    soilIsGood = s >= 80;
  }

  // 5. Most Suitable Crop
  const crops = (contextData.crop as any[]) || [];
  const bestCrop = crops.length > 0 ? crops.reduce((prev, current) => (prev.score > current.score) ? prev : current) : null;
  const suitableCropName = bestCrop ? bestCrop.name : "No Data";
  const suitableCropScore = bestCrop ? `${bestCrop.score}% Match` : "Run Analysis";

  // 6. Fertilizer Recommendations
  const fertilizer = contextData.fertilizer as any;
  // Fallback to checking context crop, but Ideally should match selectedCrop.
  const recs = fertilizer?.recommendations || [];
  const fertilizerText = fertilizer ? (recs.length > 0 ? `${recs.length} Products` : "Optimal") : "No Data";
  const fertilizerSubtext = fertilizer ? (recs.length > 0 ? `For ${selectedCrop}` : `For ${selectedCrop}`) : "Run Analysis";
  const needsFertilizer = recs.length > 0;

  const baseCardClasses = "rounded-2xl border cursor-pointer transition-colors p-5 shadow-xl backdrop-blur-md flex flex-col group bg-slate-950/80 hover:bg-slate-900";

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* 1. Field Health Summary */}
      <div 
        onClick={() => onNavigate?.("crop_health")}
        className={`${baseCardClasses} ${healthIsGood ? 'border-emerald-500/50' : 'border-yellow-500/50'}`}
      >
        <div className="flex items-center gap-3 mb-2 transition-transform group-hover:scale-105">
          <div className={`p-2 rounded-lg ${healthIsGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Crop Vigor</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          <p className="text-2xl font-black text-white">
            {ndvi && typeof ndvi.averageNDVI === "number" ? `${ndvi.averageNDVI.toFixed(2)} NDVI` : "No Data"}
          </p>
          <p className={`text-sm mt-1 font-medium ${healthIsGood ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {healthScore} Health
          </p>
        </div>
      </div>

      {/* 2. Irrigation Needs */}
      <div 
        onClick={() => onNavigate?.("agronomy")}
        className={`${baseCardClasses} ${isIrrigationUrgent ? 'border-red-500/50' : 'border-blue-500/50'}`}
      >
        <div className="flex items-center gap-3 mb-2 transition-transform group-hover:scale-105">
          <div className={`p-2 rounded-lg ${isIrrigationUrgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <Droplets className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Water Need</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          {irrigation ? (
            <>
              <p className={`text-2xl font-black ${isIrrigationUrgent ? 'text-red-400' : 'text-white'}`}>
                {irrigation.nextIrrigationDays === 0 ? "TODAY" : `In ${irrigation.nextIrrigationDays} Days`}
              </p>
              <p className={`text-sm mt-1 font-medium ${isIrrigationUrgent ? 'text-red-300' : 'text-blue-400'}`}>
                {irrigation.waterRequired > 0 ? `Needs ${irrigation.waterRequired} mm` : 'Optimal Moisture'}
              </p>
            </>
          ) : (
            <p className="text-2xl font-black text-white">No Data</p>
          )}
        </div>
      </div>

      {/* 3. Active Threats */}
      <div 
        onClick={() => onNavigate?.("crop_health")}
        className={`${baseCardClasses} ${isCriticalThreat ? 'border-red-500/50' : hasRisks ? 'border-orange-500/50' : 'border-emerald-500/50'}`}
      >
        <div className="flex items-center gap-3 mb-2 transition-transform group-hover:scale-105">
          <div className={`p-2 rounded-lg ${isCriticalThreat ? 'bg-red-500/20 text-red-400' : hasRisks ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isCriticalThreat ? <AlertTriangle className="w-5 h-5" /> : hasRisks ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{threatTitle}</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          <p className={`text-2xl font-black ${isCriticalThreat ? 'text-red-400' : hasRisks ? 'text-orange-400' : 'text-emerald-400'}`}>
            {threatValue}
          </p>
          <p className={`text-sm mt-1 font-medium ${isCriticalThreat ? 'text-red-300' : hasRisks ? 'text-orange-300' : 'text-emerald-300'}`}>
            {threatSubtext}
          </p>
        </div>
      </div>

      {/* 4. Soil Quality */}
      <div 
        onClick={() => onNavigate?.("crop_health")}
        className={`${baseCardClasses} ${soilIsGood ? 'border-emerald-500/50' : soilScore === "No Data" ? 'border-white/10' : 'border-yellow-500/50'}`}
      >
        <div className="flex items-center gap-3 mb-2 transition-transform group-hover:scale-105">
          <div className={`p-2 rounded-lg ${soilIsGood ? 'bg-emerald-500/20 text-emerald-400' : soilScore === "No Data" ? 'bg-slate-500/20 text-slate-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <FlaskConical className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Soil Profile</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          <p className={`text-2xl font-black ${soilScore === "No Data" ? 'text-white' : soilIsGood ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {soilScore}
          </p>
          <p className={`text-sm mt-1 font-medium ${soilScore === "No Data" ? 'text-slate-400' : soilIsGood ? 'text-emerald-300' : 'text-yellow-300'}`}>
            {soilScore === "No Data" ? "Run Analysis" : `${soilHealth} Health`}
          </p>
        </div>
      </div>

      {/* 5. Top Crop */}
      <div 
        onClick={() => onNavigate?.("agronomy")}
        className={`${baseCardClasses} border-green-500/50`}
      >
        <div className="flex items-center gap-3 mb-2 transition-transform group-hover:scale-105">
          <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
            <Leaf className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Top Crop</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          <p className="text-2xl font-black text-white">{suitableCropName}</p>
          <p className="text-sm mt-1 font-medium text-green-400">{suitableCropScore}</p>
        </div>
      </div>

      {/* 6. Fertilizer */}
      <div 
        onClick={() => onNavigate?.("agronomy")}
        className={`${baseCardClasses} ${needsFertilizer ? 'border-amber-500/50' : 'border-blue-500/50'}`}
      >
        <div className="flex items-center gap-3 mb-2 transition-transform group-hover:scale-105">
          <div className={`p-2 rounded-lg ${needsFertilizer ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <FlaskConical className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Fertilizer</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          <p className={`text-2xl font-black ${needsFertilizer ? 'text-amber-400' : 'text-white'}`}>
            {fertilizerText}
          </p>
          <p className={`text-sm mt-1 font-medium ${needsFertilizer ? 'text-amber-300' : 'text-blue-400'}`}>
            {fertilizerSubtext}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
