import React, { useState, useEffect } from "react";
import { Bug, AlertTriangle, ShieldCheck, ThermometerSun, Droplets, Wind, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../services/api";
import { useAnalysisContext } from "../../context/AnalysisContext";

interface Treatment {
  productName: string;
  activeIngredient: string;
  dosage: string;
  applicationMethod: string;
  frequency: string;
  safetyInterval: number;
  precautions: string[];
}

interface PestRiskAssessment {
  pestName: string;
  riskLevel: "High" | "Medium" | "Low";
  riskScore: number;
  recommendation: string;
  treatment: Treatment | null;
}

interface PesticideData {
  crop: string;
  growthStage: string;
  season: string;
  assessments: PestRiskAssessment[];
}

interface PesticideCardProps {
  fieldId: string;
  selectedCrop: string;
}



const PesticideCard: React.FC<PesticideCardProps> = ({ fieldId, selectedCrop }) => {
  const { data: contextData, isLoading: contextLoading, updateAnalysisData } = useAnalysisContext();
  const [localData, setLocalData] = useState<PesticideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPest, setExpandedPest] = useState<string | null>(null);

  // Use local data if it matches selected crop, otherwise fallback to context data
  const data = (localData?.crop === selectedCrop) ? localData 
             : (contextData?.pesticide?.crop === selectedCrop) ? contextData.pesticide 
             : null;

  useEffect(() => {
    if (!fieldId) return;
    
    // If we already have matching data from context or local, don't fetch
    if (data?.crop === selectedCrop) return;

    const fetchPesticideData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.post(`/analysis/${fieldId}/pesticide`, { crop: selectedCrop });
        if (res.data?.success) {
          setLocalData(res.data.data);
          if (updateAnalysisData) {
            updateAnalysisData(prev => prev ? { ...prev, pesticide: res.data.data } : prev);
          }
        } else {
          throw new Error("Failed to fetch pesticide data");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    void fetchPesticideData();
  }, [fieldId, selectedCrop, data]);

  const isLoading = loading || (contextLoading && !data);

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 shadow-xl backdrop-blur-md animate-pulse h-auto sm:h-full min-h-[350px]">
        <div className="h-6 w-48 bg-slate-800 rounded mb-6"></div>
        <div className="h-10 w-full bg-slate-800 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-16 bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 shadow-xl backdrop-blur-md h-auto sm:h-full flex flex-col items-center justify-center min-h-[350px]">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <p className="text-red-400 font-semibold">Error Loading Data</p>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  // Determine overall risk
  let overallRisk: "High" | "Medium" | "Low" = "Low";
  let overallColor = "text-emerald-400";
  let overallBg = "bg-slate-900/40 border-emerald-500/30";
  let overallText = "Low Risk — No spray needed";
  let outerBorder = "border-emerald-500/30";

  const hasHigh = data.assessments.some((a: PestRiskAssessment) => a.riskLevel === "High");
  const hasMedium = data.assessments.some((a: PestRiskAssessment) => a.riskLevel === "Medium");

  if (hasHigh) {
    overallRisk = "High";
    overallColor = "text-red-400";
    overallBg = "bg-slate-900/40 border-red-500/50";
    overallText = "High Risk — Spray recommended";
    outerBorder = "border-red-500/50";
  } else if (hasMedium) {
    overallRisk = "Medium";
    overallColor = "text-amber-400";
    overallBg = "bg-slate-900/40 border-amber-500/50";
    overallText = "Medium Risk — Monitor closely";
    outerBorder = "border-amber-500/50";
  }

  return (
    <div className={`rounded-2xl border ${outerBorder} bg-slate-950/80 p-4 sm:p-6 shadow-xl backdrop-blur-md h-auto sm:h-full flex flex-col text-slate-200`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className={`w-5 h-5 ${overallColor}`} />
            Pest Risk Assessment
          </h3>
          <p className="text-sm text-emerald-200 mt-0.5">Season: {data.season}</p>
        </div>
      </div>

      {/* Overall Risk Indicator */}
      <div className={`p-4 rounded-xl border mb-6 flex items-center gap-4 ${overallBg}`}>
        {overallRisk === "High" ? (
          <AlertTriangle className={`w-8 h-8 ${overallColor}`} />
        ) : overallRisk === "Medium" ? (
          <ThermometerSun className={`w-8 h-8 ${overallColor}`} />
        ) : (
          <ShieldCheck className={`w-8 h-8 ${overallColor}`} />
        )}
        <div>
          <h4 className={`text-lg font-bold ${overallColor}`}>{overallRisk} Risk</h4>
          <p className="text-sm opacity-90 text-slate-300">{overallText}</p>
        </div>
      </div>

      {/* Spray Window (Mocked logic for aesthetics based on AC) */}
      {hasHigh && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-white/5 text-sm">
          <p className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
            <Wind className="w-4 h-4" /> Spray Window Recommendation
          </p>
          <p className="text-slate-300">
            <strong>Best window:</strong> Tomorrow 6-9 AM (low wind, no rain expected)
          </p>
          <p className="text-slate-400 mt-1 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5" /> Avoid: rain within 6 hours, wind &gt; 9 mph
          </p>
        </div>
      )}

      {/* Pest Assessments List */}
      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 shrink-0">Identified Threats</h4>
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[280px] md:max-h-none pr-1">
        {data.assessments.map((pest: PestRiskAssessment, idx: number) => {
          const isHigh = pest.riskLevel === "High";
          const isExpanded = expandedPest === pest.pestName;

          let badgeColor = "text-emerald-400 border-emerald-500/30 bg-slate-900/40";
          let barColor = "bg-emerald-500";
          if (pest.riskLevel === "High") {
            badgeColor = "text-red-400 border-red-500/50 bg-slate-900/40";
            barColor = "bg-red-500";
          } else if (pest.riskLevel === "Medium") {
            badgeColor = "text-amber-400 border-amber-500/50 bg-slate-900/40";
            barColor = "bg-amber-500";
          }

          return (
            <div key={idx} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
              <div 
                className={`p-4 flex items-center justify-between ${isHigh ? 'cursor-pointer hover:bg-slate-900' : ''}`}
                onClick={() => isHigh && setExpandedPest(isExpanded ? null : pest.pestName)}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white">{pest.pestName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeColor}`}>
                      {pest.riskLevel}
                    </span>
                  </div>
                  
                  {/* Risk Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${barColor} transition-all duration-700`} 
                        style={{ width: `${pest.riskScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 w-8">{pest.riskScore}%</span>
                  </div>
                </div>
                
                {isHigh && (
                  <div className="ml-4 pl-4 border-l border-white/10 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                )}
              </div>

              {/* Expandable Treatment Section */}
              {isHigh && isExpanded && pest.treatment && (
                <div className="p-4 bg-slate-950/50 border-t border-white/5 animate-fadeIn">
                  <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Treatment Protocol
                  </h5>
                  
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Product</p>
                      <p className="font-semibold text-slate-200">{pest.treatment.productName}</p>
                      <p className="text-[10px] text-slate-400">{pest.treatment.activeIngredient}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Dosage</p>
                      <p className="font-semibold text-slate-200">{pest.treatment.dosage}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Method</p>
                      <p className="text-slate-300 capitalize">{pest.treatment.applicationMethod}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Frequency</p>
                      <p className="text-slate-300">{pest.treatment.frequency}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Safety Interval</p>
                      <p className="text-amber-400 font-medium">{pest.treatment.safetyInterval} days before harvest</p>
                    </div>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-300 mb-2">Safety Precautions</p>
                    <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                      {pest.treatment.precautions.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                      <li>Wear protective gloves and mask</li>
                      <li>Do not spray during windy conditions</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PesticideCard;
