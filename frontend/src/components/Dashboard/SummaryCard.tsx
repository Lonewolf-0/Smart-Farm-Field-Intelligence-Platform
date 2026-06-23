import React from "react";
import { AlertTriangle, Droplets, Leaf, ShieldCheck, Activity } from "lucide-react";
import { useAnalysisContext } from "../../context/AnalysisContext";
import type { RiskAlert } from "../../types";

const SummaryCard: React.FC = () => {
  const { data: contextData, isLoading } = useAnalysisContext();

  if (isLoading && !contextData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-xl backdrop-blur-md animate-pulse h-28"></div>
        ))}
      </div>
    );
  }

  if (!contextData) return null;

  // 1. Analyze General Risks & Pest Risks
  const alerts = (contextData.risks as RiskAlert[]) || [];
  const criticalAlerts = alerts.filter(a => a.severity === "critical" || a.severity === "high");
  
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

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Field Health Summary */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-xl backdrop-blur-md flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${healthIsGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Crop Vigor</h3>
        </div>
        <div>
          <p className="text-2xl font-black text-white">
            {ndvi && typeof ndvi.averageNDVI === "number" ? `${ndvi.averageNDVI.toFixed(2)} NDVI` : "No Data"}
          </p>
          <p className={`text-sm mt-1 font-medium ${healthIsGood ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {healthScore} Health
          </p>
        </div>
      </div>

      {/* Irrigation Needs */}
      <div className={`rounded-2xl border ${isIrrigationUrgent ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-slate-950/80'} p-5 shadow-xl backdrop-blur-md flex flex-col justify-center`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isIrrigationUrgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <Droplets className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Water Need</h3>
        </div>
        <div>
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

      {/* Active Threats */}
      <div className={`rounded-2xl border ${isCriticalThreat ? 'border-red-500/30 bg-red-500/10' : hasRisks ? 'border-orange-500/30 bg-orange-500/10' : 'border-emerald-500/30 bg-emerald-500/10'} p-5 shadow-xl backdrop-blur-md flex flex-col justify-center`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isCriticalThreat ? 'bg-red-500/20 text-red-400' : hasRisks ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isCriticalThreat ? <AlertTriangle className="w-5 h-5" /> : hasRisks ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{threatTitle}</h3>
        </div>
        <div>
          <p className={`text-2xl font-black ${isCriticalThreat ? 'text-red-400' : hasRisks ? 'text-orange-400' : 'text-emerald-400'}`}>
            {threatValue}
          </p>
          <p className={`text-sm mt-1 font-medium ${isCriticalThreat ? 'text-red-300' : hasRisks ? 'text-orange-300' : 'text-emerald-300'}`}>
            {threatSubtext}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
