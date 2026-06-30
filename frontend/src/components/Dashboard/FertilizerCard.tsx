import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { 
  FlaskConical, 
  AlertCircle, 
  RefreshCw, 
  Leaf, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import type { Field, FertilizerPlan } from "../../types";
import FertilizerTimeline from "./FertilizerTimeline";
import { useAnalysisContext } from "../../context/AnalysisContext";
import { calculateFertilizerMetrics } from "../../utils/fertilizerCalculations";

interface FertilizerCardProps {
  fieldId: string;
  selectedCrop: string;
  onCropChange: (c: string) => void;
}

// Static crop nutrient requirements mapping matching the backend's crop requirements
const cropNutrients: Record<string, { n: number; p: number; k: number }> = {
  "Wheat": { n: 120, p: 60, k: 40 },
  "Rice": { n: 150, p: 60, k: 60 },
  "Maize": { n: 180, p: 80, k: 60 },
  "Soybean": { n: 30, p: 60, k: 40 },
  "Cotton": { n: 150, p: 60, k: 60 },
  "Sugarcane": { n: 250, p: 100, k: 120 },
  "Mustard": { n: 80, p: 40, k: 20 },
  "Chickpea": { n: 20, p: 50, k: 20 },
  "Groundnut": { n: 25, p: 50, k: 40 },
  "Potato": { n: 180, p: 80, k: 100 },
  "Tomato": { n: 150, p: 60, k: 80 },
  "Onion": { n: 100, p: 50, k: 60 },
  "Sunflower": { n: 80, p: 60, k: 40 },
  "Barley": { n: 80, p: 40, k: 30 },
  "Millet": { n: 60, p: 30, k: 20 }
};

const FertilizerCard: React.FC<FertilizerCardProps> = ({ fieldId, selectedCrop, onCropChange }) => {
  const { data: contextData, isLoading: contextLoading, updateAnalysisData } = useAnalysisContext();
  
  const [field, setField] = useState<Field | null>(null);
  
  // Soil NPK input states (lbs/acre)
  const [soilN, setSoilN] = useState<number>(() => {
    const val = localStorage.getItem("soilN");
    return val !== null ? Number(val) : 60;
  });
  const [soilP, setSoilP] = useState<number>(() => {
    const val = localStorage.getItem("soilP");
    return val !== null ? Number(val) : 40;
  });
  const [soilK, setSoilK] = useState<number>(() => {
    const val = localStorage.getItem("soilK");
    return val !== null ? Number(val) : 50;
  });
  const [useSoilTestData, setUseSoilTestData] = useState<boolean>(() => {
    const val = localStorage.getItem("useSoilTestData");
    return val !== null ? val === "true" : true;
  });

  const hasSyncedInitialCrop = useRef(false);

  useEffect(() => {
    hasSyncedInitialCrop.current = false;
  }, [fieldId]);
  
  useEffect(() => {
    localStorage.setItem("useSoilTestData", useSoilTestData.toString());
  }, [useSoilTestData]);

  useEffect(() => {
    localStorage.setItem("soilN", soilN.toString());
  }, [soilN]);

  useEffect(() => {
    localStorage.setItem("soilP", soilP.toString());
  }, [soilP]);

  useEffect(() => {
    localStorage.setItem("soilK", soilK.toString());
  }, [soilK]);

  // API plan output state
  const [plan, setPlan] = useState<FertilizerPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCostExpanded, setIsCostExpanded] = useState<boolean>(false);
  const [isRecsExpanded, setIsRecsExpanded] = useState<boolean>(true);

  // Sync context data
  useEffect(() => {
    if (contextData?.fertilizer && useSoilTestData) {
      setPlan(contextData.fertilizer);
      if (!hasSyncedInitialCrop.current && selectedCrop === "Wheat") {
        const calculatedCrop = contextData.fertilizer.crop || "Wheat";
        if (calculatedCrop !== "Wheat") {
          hasSyncedInitialCrop.current = true;
          onCropChange(calculatedCrop);
        }
      }
      if (contextData.fertilizer.soilBaselines) {
        setSoilN(contextData.fertilizer.soilBaselines.nitrogen);
        setSoilP(contextData.fertilizer.soilBaselines.phosphorus);
        setSoilK(contextData.fertilizer.soilBaselines.potassium);
      }
    }
  }, [contextData, useSoilTestData, selectedCrop]);

  // Fetch field details to obtain field area
  const fetchFieldDetails = async () => {
    try {
      const res = await api.get("/fields");
      if (res.data?.success) {
        const foundField = res.data.data.find((f: Field) => f.id === fieldId);
        if (foundField) {
          setField(foundField);
        }
      }
    } catch (err) {
      console.error("Failed to load field details", err);
    }
  };

  // Fetch the initial/latest soil test data for this field (if context isn't enough)
  const fetchSoilTestData = async () => {
    if (contextData?.fertilizer?.soilBaselines) return; // already got from context
    try {
      const res = await api.get(`/analysis/${fieldId}/soil/history`);
      if (res.data?.success && res.data.data?.records?.length > 0) {
        const topLayer = res.data.data.records[0].data.layers[0];
        setSoilN(topLayer.nitrogen || 0);
        setSoilP(40);
        setSoilK(50);
        setError(null);
      } else {
        setUseSoilTestData(false);
      }
    } catch (err) {
      console.error("Failed to load soil data", err);
      setUseSoilTestData(false);
    }
  };

  // Call the fertilizer recommendation API endpoint
  const calculatePlan = async () => {
    try {
      setCalculating(true);
      setError(null);

      const payload: any = { crop: selectedCrop };
      if (!useSoilTestData) {
        payload.soilN = soilN;
        payload.soilP = soilP;
        payload.soilK = soilK;
      }

      const res = await api.post(`/analysis/${fieldId}/fertilizer`, payload);
      if (res.data?.success) {
        const planData = res.data.data;
        setPlan(planData);
        if (updateAnalysisData && useSoilTestData) {
          updateAnalysisData(prev => prev ? { ...prev, fertilizer: planData } : prev);
        }
        if (useSoilTestData && planData.soilBaselines) {
          setSoilN(planData.soilBaselines.nitrogen);
          setSoilP(planData.soilBaselines.phosphorus);
          setSoilK(planData.soilBaselines.potassium);
        }
      } else {
        throw new Error(res.data?.error || "Calculation failed");
      }
    } catch (err: any) {
      console.error("Fertilizer calculation error:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch fertilizer plan.");
    } finally {
      setCalculating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fieldId) {
      void fetchFieldDetails();
      if (useSoilTestData) {
        void fetchSoilTestData();
      }
    }
  }, [fieldId, useSoilTestData]);

  useEffect(() => {
    // Only recalculate if it's not the default setup already handled by context
    if (fieldId && !(useSoilTestData && selectedCrop === "Wheat" && contextData?.fertilizer)) {
      void calculatePlan();
    }
  }, [fieldId, useSoilTestData, selectedCrop]);

  const handleRecalculate = () => {
    void calculatePlan();
  };

  const isInitializing = loading || (contextLoading && !plan);

  if (isInitializing) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse h-full flex flex-col md:col-span-2 min-h-[350px]">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-56 bg-slate-800 rounded"></div>
          <div className="h-6 w-24 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-4 flex-1">
          <div className="h-10 bg-slate-800 rounded-lg"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-slate-800 rounded-lg"></div>
            <div className="h-12 bg-slate-800 rounded-lg"></div>
            <div className="h-12 bg-slate-800 rounded-lg"></div>
          </div>
          <div className="h-28 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Calculate local values for deficit bars
  const activeCropRequirements = cropNutrients[selectedCrop] || { n: 100, p: 50, k: 50 };
  
  // Available values based on NPK inputs
  const availableN = Number((soilN * 0.5).toFixed(1));
  const availableP = Number((soilP * 0.4).toFixed(1));
  const availableK = Number((soilK * 0.6).toFixed(1));

  // Required values (converted from kg/ha to lbs/acre)
  const reqN = activeCropRequirements.n * 0.892179;
  const reqP = activeCropRequirements.p * 0.892179;
  const reqK = activeCropRequirements.k * 0.892179;

  // Deficit values
  const defN = Math.max(0, reqN - availableN);
  const defP = Math.max(0, reqP - availableP);
  const defK = Math.max(0, reqK - availableK);

  // Percentages for stacked progress bar
  const pctAvailableN = Math.min(100, (availableN / reqN) * 100);
  const pctDeficitN = Math.min(100 - pctAvailableN, (defN / reqN) * 100);

  const pctAvailableP = Math.min(100, (availableP / reqP) * 100);
  const pctDeficitP = Math.min(100 - pctAvailableP, (defP / reqP) * 100);

  const pctAvailableK = Math.min(100, (availableK / reqK) * 100);
  const pctDeficitK = Math.min(100 - pctAvailableK, (defK / reqK) * 100);

  // Field area
  const area = (field?.area || 1) * 2.47105; // Convert Hectares to Acres

  // Cost estimates based on recommendations
  let totalCostPerAcre = 0;
  
  const pricedRecommendations = plan?.recommendations.map(prod => {
    const metrics = calculateFertilizerMetrics(prod.name, prod.quantity, area);
    totalCostPerAcre += metrics.costPerAcre;
    
    return {
      ...prod,
      quantityPerAcre: metrics.quantityPerAcre,
      pricePerLb: metrics.pricePerLb,
      costPerAcre: metrics.costPerAcre,
      totalCost: metrics.totalCost,
      bagsNeeded: metrics.totalBags
    };
  }) || [];

  const grandTotalCost = totalCostPerAcre * area;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col text-slate-200 md:col-span-2">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 ${isRecsExpanded ? "mb-6 border-b border-white/5 pb-4" : ""}`}>
        <div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsRecsExpanded(!isRecsExpanded)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsRecsExpanded(!isRecsExpanded);
              }
            }}
            className="flex items-center gap-2 cursor-pointer select-none outline-none group"
          >
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-400" />
              <span>Fertilizer Recommendations</span>
              <div 
                className="relative group cursor-pointer inline-flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Info className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-72 p-3.5 text-xs text-white bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-black/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none text-center font-medium normal-case leading-relaxed">
                  Computes custom Nitrogen, Phosphorus, and Potassium requirements for the selected crop. Provides commercial fertilizer products and retail cost estimates.
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 border-l border-t border-emerald-500/30 rotate-45"></div>
                </div>
              </div>
              {isRecsExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              )}
            </h3>
          </div>
          <p className="text-sm text-emerald-200 mt-0.5">Optimized feeding plan for {field?.name || "field"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">


          {/* Use Soil Test Data Toggle */}
          <button
            onClick={() => setUseSoilTestData(prev => !prev)}
            className={`flex items-center gap-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer shrink-0 transition-all duration-300 w-[145px] h-[34px] ${
              useSoilTestData 
                ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20 hover:border-amber-500/30 text-amber-300"
            }`}
          >
            {useSoilTestData ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-400 transition-colors duration-300 shrink-0" />
                <span className="truncate">Soil Data</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-amber-400 transition-colors duration-300 shrink-0" />
                <span className="truncate">Manual NPK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Settings Panel - Visible only under Manual NPK Override */}
      {isRecsExpanded && !useSoilTestData && (
        <div className="grid gap-6 md:grid-cols-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/5 shrink-0 animate-fadeIn">
          {/* N input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="soil-n-input" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Soil N (lbs/acre)
            </label>
            <input
              id="soil-n-input"
              type="number"
              value={soilN}
              onChange={(e) => setSoilN(Math.max(0, Number(e.target.value)))}
              className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* P input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="soil-p-input" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Soil P (lbs/acre)
            </label>
            <input
              id="soil-p-input"
              type="number"
              value={soilP}
              onChange={(e) => setSoilP(Math.max(0, Number(e.target.value)))}
              className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* K input & Recalculate Button */}
          <div className="flex flex-col gap-1.5 relative">
            <label htmlFor="soil-k-input" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Soil K (lbs/acre)
            </label>
            <div className="flex gap-2">
              <input
                id="soil-k-input"
                type="number"
                value={soilK}
                onChange={(e) => setSoilK(Math.max(0, Number(e.target.value)))}
                className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50 flex-1"
              />
              <button
                onClick={handleRecalculate}
                disabled={calculating}
                className="px-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="Calculate fertilizer requirements"
              >
                {calculating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        isRecsExpanded && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-950/20 border border-red-500/20 rounded-xl min-h-[200px]">
            <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-red-400 font-semibold mb-1">Failed to Calculate Recommendations</p>
            <p className="text-slate-400 text-xs max-w-[320px] mb-4">{error}</p>
            <button
              onClick={handleRecalculate}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )
      ) : (
        <>
          {isRecsExpanded && (
            <div className="grid gap-6 md:grid-cols-2 items-stretch mb-6">
              {/* Left side: Nutrient Deficiency Profile */}
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4.5 space-y-4 flex flex-col justify-between h-full">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-green-400" />
                  Nutrient Deficiency Profile
                </h4>

                {/* Nitrogen */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Nitrogen (N)</span>
                    <span className="text-slate-400">
                      Avail: <strong className="text-green-400">{availableN}</strong> / Req: <strong className="text-slate-200">{reqN}</strong> lbs/acre
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                    {pctAvailableN > 0 && (
                      <div 
                        className="h-full bg-green-500/90 transition-all duration-500" 
                        style={{ width: `${pctAvailableN}%` }}
                        title={`Available N: ${availableN} lbs/acre`}
                      ></div>
                    )}
                    {pctDeficitN > 0 && (
                      <div 
                        className="h-full bg-red-500/90 transition-all duration-500" 
                        style={{ width: `${pctDeficitN}%` }}
                        title={`Deficit N: ${defN} lbs/acre`}
                      ></div>
                    )}
                  </div>
                  {defN > 0 ? (
                    <p className="text-[10px] text-red-400 font-medium">Deficit of {defN.toFixed(1)} lbs/acre detected</p>
                  ) : (
                    <p className="text-[10px] text-green-400 font-medium">Nitrogen is optimal</p>
                  )}
                </div>

                {/* Phosphorus */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Phosphorus (P)</span>
                    <span className="text-slate-400">
                      Avail: <strong className="text-green-400">{availableP}</strong> / Req: <strong className="text-slate-200">{reqP}</strong> lbs/acre
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                    {pctAvailableP > 0 && (
                      <div 
                        className="h-full bg-green-500/90 transition-all duration-500" 
                        style={{ width: `${pctAvailableP}%` }}
                        title={`Available P: ${availableP} lbs/acre`}
                      ></div>
                    )}
                    {pctDeficitP > 0 && (
                      <div 
                        className="h-full bg-red-500/90 transition-all duration-500" 
                        style={{ width: `${pctDeficitP}%` }}
                        title={`Deficit P: ${defP} lbs/acre`}
                      ></div>
                    )}
                  </div>
                  {defP > 0 ? (
                    <p className="text-[10px] text-red-400 font-medium">Deficit of {defP.toFixed(1)} lbs/acre detected</p>
                  ) : (
                    <p className="text-[10px] text-green-400 font-medium">Phosphorus is optimal</p>
                  )}
                </div>

                {/* Potassium */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Potassium (K)</span>
                    <span className="text-slate-400">
                      Avail: <strong className="text-green-400">{availableK}</strong> / Req: <strong className="text-slate-200">{reqK}</strong> lbs/acre
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                    {pctAvailableK > 0 && (
                      <div 
                        className="h-full bg-green-500/90 transition-all duration-500" 
                        style={{ width: `${pctAvailableK}%` }}
                        title={`Available K: ${availableK} lbs/acre`}
                      ></div>
                    )}
                    {pctDeficitK > 0 && (
                      <div 
                        className="h-full bg-red-500/90 transition-all duration-500" 
                        style={{ width: `${pctDeficitK}%` }}
                        title={`Deficit K: ${defK} lbs/acre`}
                      ></div>
                    )}
                  </div>
                  {defK > 0 ? (
                    <p className="text-[10px] text-red-400 font-medium">Deficit of {defK.toFixed(1)} lbs/acre detected</p>
                  ) : (
                    <p className="text-[10px] text-green-400 font-medium">Potassium is optimal</p>
                  )}
                </div>
              </div>

              {/* Right side: Products recommendations table + Cost estimate breakdown */}
              <div className="flex flex-col gap-4">
                {/* Products recommendations table */}
                <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-900/40">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-semibold">
                        <th className="p-2.5">Fertilizer Product</th>
                        <th className="p-2.5 text-right">Per Acre</th>
                        <th className="p-2.5 text-right">Total ({area.toFixed(1)} acres)</th>
                        <th className="p-2.5 text-right">Bags (50lbs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                      {pricedRecommendations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">
                            No fertilizer replenishment required. Available nutrients meet or exceed requirements.
                          </td>
                        </tr>
                      ) : (
                        pricedRecommendations.map((prod) => (
                          <tr key={prod.name} className="hover:bg-white/5">
                            <td className="p-2.5 font-semibold text-white">{prod.name}</td>
                            <td className="p-2.5 text-right text-slate-200">{prod.quantityPerAcre?.toFixed(1)} lbs/acre</td>
                            <td className="p-2.5 text-right text-slate-200">{((prod.quantityPerAcre || 0) * area).toFixed(1)} lbs</td>
                            <td className="p-2.5 text-right text-slate-200">{prod.bagsNeeded}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cost estimate dashboard */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4.5 space-y-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsCostExpanded(!isCostExpanded)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setIsCostExpanded(!isCostExpanded);
                      }
                    }}
                    className="w-full flex items-center justify-between cursor-pointer select-none outline-none"
                  >
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-green-400" />
                      <span>Cost Estimation</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {!isCostExpanded && (
                        <span className="text-green-400 font-bold text-xs normal-case">
                          ${(totalCostPerAcre * area).toFixed(2)}
                        </span>
                      )}
                      {isCostExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isCostExpanded && (
                    <div className="space-y-2 pt-2.5 border-t border-white/5 animate-fadeIn">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Field Area</span>
                        <span className="font-semibold text-white">{area.toFixed(2)} acres</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Estimate Per Acre</span>
                        <span className="font-semibold text-white">${totalCostPerAcre.toFixed(2)}/ac</span>
                      </div>

                      <div className="border-t border-white/5 pt-2 flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-slate-200">Total Field Cost</span>
                        <span className="text-lg font-black text-green-400">${grandTotalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Visualization */}
          <FertilizerTimeline 
            scheduleSteps={plan?.scheduleSteps} 
            fieldArea={area} 
            isLoading={calculating}
          />
        </>
      )}
    </div>
  );
};

export default FertilizerCard;
