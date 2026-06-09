import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { 
  FlaskConical, 
  Info, 
  AlertCircle, 
  RefreshCw, 
  Leaf, 
  DollarSign, 
  Scale, 
  ToggleLeft, 
  ToggleRight 
} from "lucide-react";
import Toast from "../UI/Toast";
import type { Field, FertilizerPlan } from "../../types";
import FertilizerTimeline from "./FertilizerTimeline";
import { useAnalysisContext } from "../../context/AnalysisContext";

interface FertilizerCardProps {
  fieldId: string;
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

// Retail pricing constants for Urea, DAP, MOP per kg
const FERTILIZER_PRICES: Record<string, { pricePerKg: number; bagSizeKg: number; pricePerBag: number }> = {
  "Urea": { pricePerKg: 0.60, bagSizeKg: 50, pricePerBag: 30.00 },
  "DAP": { pricePerKg: 0.80, bagSizeKg: 50, pricePerBag: 40.00 },
  "MOP": { pricePerKg: 0.70, bagSizeKg: 50, pricePerBag: 35.00 }
};

const FertilizerCard: React.FC<FertilizerCardProps> = ({ fieldId }) => {
  const { data: contextData, isLoading: contextLoading } = useAnalysisContext();
  
  const [field, setField] = useState<Field | null>(null);
  const [cropsList] = useState<string[]>(Object.keys(cropNutrients));
  const [selectedCrop, setSelectedCrop] = useState<string>("Wheat");
  
  // Soil NPK input states (kg/ha)
  const [soilN, setSoilN] = useState<number>(60);
  const [soilP, setSoilP] = useState<number>(40);
  const [soilK, setSoilK] = useState<number>(50);
  const [useSoilTestData, setUseSoilTestData] = useState<boolean>(true);
  
  // API plan output state
  const [plan, setPlan] = useState<FertilizerPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" | "error" } | null>(null);

  // Sync context data
  useEffect(() => {
    if (contextData?.fertilizer && useSoilTestData && selectedCrop === "Wheat") {
      setPlan(contextData.fertilizer);
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
        setToast({ message: "No soil test records found. Please enter NPK values manually.", type: "warning" });
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
    setToast({ message: `Recalculating plan for ${selectedCrop}...`, type: "info" });
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

  // Required values
  const reqN = activeCropRequirements.n;
  const reqP = activeCropRequirements.p;
  const reqK = activeCropRequirements.k;

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
  const area = field?.area || 1;

  // Cost estimates based on recommendations
  let totalCostPerHa = 0;
  const pricedRecommendations = plan?.recommendations.map(prod => {
    const pricing = FERTILIZER_PRICES[prod.name];
    if (pricing) {
      const prodCostPerHa = prod.quantity * pricing.pricePerKg; // since quantity from backend is per-ha
      const totalProdCost = prodCostPerHa * area;
      const totalBags = Math.ceil((prod.quantity * area) / pricing.bagSizeKg);
      totalCostPerHa += prodCostPerHa;
      return {
        ...prod,
        pricePerKg: pricing.pricePerKg,
        costPerHa: prodCostPerHa,
        totalCost: totalProdCost,
        bagsNeeded: totalBags
      };
    }
    return {
      ...prod,
      pricePerKg: 0,
      costPerHa: 0,
      totalCost: 0,
      bagsNeeded: 0
    };
  }) || [];

  const grandTotalCost = totalCostPerHa * area;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col text-slate-200 md:col-span-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 shrink-0 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-400" />
            Fertilizer Recommendations
          </h3>
          <p className="text-sm text-emerald-200 mt-0.5">Optimized feeding plan for {field?.name || "field"}</p>
        </div>

        {/* Use Soil Test Data Toggle */}
        <button
          onClick={() => setUseSoilTestData(prev => !prev)}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold cursor-pointer shrink-0"
        >
          {useSoilTestData ? (
            <>
              <ToggleRight className="w-5 h-5 text-green-400" />
              <span className="text-green-300">Using Soil Test Data</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">Manual NPK Override</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="grid gap-6 md:grid-cols-4 mb-6 bg-white/5 p-4 rounded-xl border border-white/5 shrink-0">
        {/* Crop Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Crop</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            {cropsList.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* N input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>Soil N (kg/ha)</span>
            {useSoilTestData && (
              <span title="Loaded from database">
                <Info className="w-3 h-3 text-emerald-300" />
              </span>
            )}
          </label>
          <input
            type="number"
            value={soilN}
            disabled={useSoilTestData}
            onChange={(e) => setSoilN(Math.max(0, Number(e.target.value)))}
            className={`bg-slate-900 border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50 ${
              useSoilTestData ? "border-white/5 opacity-50 cursor-not-allowed" : "border-white/10"
            }`}
          />
        </div>

        {/* P input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>Soil P (kg/ha)</span>
            {useSoilTestData && (
              <span title="Defaulted available">
                <Info className="w-3 h-3 text-emerald-300" />
              </span>
            )}
          </label>
          <input
            type="number"
            value={soilP}
            disabled={useSoilTestData}
            onChange={(e) => setSoilP(Math.max(0, Number(e.target.value)))}
            className={`bg-slate-900 border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50 ${
              useSoilTestData ? "border-white/5 opacity-50 cursor-not-allowed" : "border-white/10"
            }`}
          />
        </div>

        {/* K input & Recalculate Button */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>Soil K (kg/ha)</span>
            {useSoilTestData && (
              <span title="Defaulted available">
                <Info className="w-3 h-3 text-emerald-300" />
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={soilK}
              disabled={useSoilTestData}
              onChange={(e) => setSoilK(Math.max(0, Number(e.target.value)))}
              className={`bg-slate-900 border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500/50 flex-1 ${
                useSoilTestData ? "border-white/5 opacity-50 cursor-not-allowed" : "border-white/10"
              }`}
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

      {error ? (
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
      ) : (
        <>
          {/* Live Recommendations & Alerts */}
          {plan?.liveDataAdjustments && plan.liveDataAdjustments.length > 0 && (
            <div className="grid gap-2.5 mb-6 shrink-0">
              {plan.liveDataAdjustments.map((adj, i) => {
                const isWarning = adj.type === "warning";
                const isInfo = adj.type === "info";
                const bgClass = isWarning 
                  ? "bg-red-500/10 border-red-500/20 text-red-200" 
                  : isInfo 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" 
                  : "bg-green-500/10 border-green-500/20 text-green-200";
                return (
                  <div key={i} className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${bgClass} animate-fadeIn`}>
                    <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isWarning ? "text-red-400" : isInfo ? "text-emerald-400" : "text-green-400"}`} />
                    <span className="leading-relaxed font-semibold">{adj.message}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] flex-1">
          
          {/* Deficit Visuals & Schedule */}
          <div className="space-y-6">
            
            {/* Visual deficit bars */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4.5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-green-400" />
                Nutrient Deficiency Profile
              </h4>

              {/* Nitrogen */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Nitrogen (N)</span>
                  <span className="text-slate-400">
                    Avail: <strong className="text-green-400">{availableN}</strong> / Req: <strong className="text-slate-200">{reqN}</strong> kg/ha
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                  {pctAvailableN > 0 && (
                    <div 
                      className="h-full bg-green-500/90 transition-all duration-500" 
                      style={{ width: `${pctAvailableN}%` }}
                      title={`Available N: ${availableN} kg/ha`}
                    ></div>
                  )}
                  {pctDeficitN > 0 && (
                    <div 
                      className="h-full bg-red-500/90 transition-all duration-500" 
                      style={{ width: `${pctDeficitN}%` }}
                      title={`Deficit N: ${defN} kg/ha`}
                    ></div>
                  )}
                </div>
                {defN > 0 ? (
                  <p className="text-[10px] text-red-400 font-medium">Deficit of {defN.toFixed(1)} kg/ha detected</p>
                ) : (
                  <p className="text-[10px] text-green-400 font-medium">Nitrogen is optimal</p>
                )}
              </div>

              {/* Phosphorus */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Phosphorus (P)</span>
                  <span className="text-slate-400">
                    Avail: <strong className="text-green-400">{availableP}</strong> / Req: <strong className="text-slate-200">{reqP}</strong> kg/ha
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                  {pctAvailableP > 0 && (
                    <div 
                      className="h-full bg-green-500/90 transition-all duration-500" 
                      style={{ width: `${pctAvailableP}%` }}
                      title={`Available P: ${availableP} kg/ha`}
                    ></div>
                  )}
                  {pctDeficitP > 0 && (
                    <div 
                      className="h-full bg-red-500/90 transition-all duration-500" 
                      style={{ width: `${pctDeficitP}%` }}
                      title={`Deficit P: ${defP} kg/ha`}
                    ></div>
                  )}
                </div>
                {defP > 0 ? (
                  <p className="text-[10px] text-red-400 font-medium">Deficit of {defP.toFixed(1)} kg/ha detected</p>
                ) : (
                  <p className="text-[10px] text-green-400 font-medium">Phosphorus is optimal</p>
                )}
              </div>

              {/* Potassium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Potassium (K)</span>
                  <span className="text-slate-400">
                    Avail: <strong className="text-green-400">{availableK}</strong> / Req: <strong className="text-slate-200">{reqK}</strong> kg/ha
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                  {pctAvailableK > 0 && (
                    <div 
                      className="h-full bg-green-500/90 transition-all duration-500" 
                      style={{ width: `${pctAvailableK}%` }}
                      title={`Available K: ${availableK} kg/ha`}
                    ></div>
                  )}
                  {pctDeficitK > 0 && (
                    <div 
                      className="h-full bg-red-500/90 transition-all duration-500" 
                      style={{ width: `${pctDeficitK}%` }}
                      title={`Deficit K: ${defK} kg/ha`}
                    ></div>
                  )}
                </div>
                {defK > 0 ? (
                  <p className="text-[10px] text-red-400 font-medium">Deficit of {defK.toFixed(1)} kg/ha detected</p>
                ) : (
                  <p className="text-[10px] text-green-400 font-medium">Potassium is optimal</p>
                )}
              </div>
            </div>

            {/* Products recommendations table */}
            <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-900/40">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-semibold">
                    <th className="p-3">Fertilizer Product</th>
                    <th className="p-3 text-right">Per Hectare</th>
                    <th className="p-3 text-right">Total ({area.toFixed(1)} ha)</th>
                    <th className="p-3 text-right">Bags needed (50kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                  {pricedRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        No fertilizer replenishment required. Available nutrients meet or exceed requirements.
                      </td>
                    </tr>
                  ) : (
                    pricedRecommendations.map((prod) => (
                      <tr key={prod.name} className="hover:bg-white/5">
                        <td className="p-3 font-semibold text-white">{prod.name}</td>
                        <td className="p-3 text-right text-slate-200">{prod.quantity.toFixed(1)} kg/ha</td>
                        <td className="p-3 text-right text-slate-200">{(prod.quantity * area).toFixed(1)} kg</td>
                        <td className="p-3 text-right text-slate-200">{prod.bagsNeeded}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Schedule & Cost Details */}
          <div className="space-y-6 flex flex-col justify-between">
            
            {/* Scheduling summary */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4.5 space-y-3.5 flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Application Timing & Schedule
              </h4>
              
              <div className="space-y-3 text-xs leading-relaxed">
                {pricedRecommendations.some(r => r.name === "DAP") && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <p className="font-semibold text-emerald-300">DAP (Diammonium Phosphate)</p>
                    <p className="text-slate-400 mt-1">Apply total dose at sowing. Incorporate into the root zone to secure initial root growth support.</p>
                  </div>
                )}

                {pricedRecommendations.some(r => r.name === "Urea") && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="font-semibold text-amber-300">Urea</p>
                    <p className="text-slate-400 mt-1">Apply in 2 split applications: 50% at sowing, and remaining 50% top-dressed after 30 days of planting.</p>
                  </div>
                )}

                {pricedRecommendations.some(r => r.name === "MOP") && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <p className="font-semibold text-emerald-300">MOP (Muriate of Potash)</p>
                    <p className="text-slate-400 mt-1">Apply total dose at sowing. Supports plant stress tolerance and overall cell water regulation.</p>
                  </div>
                )}

                {pricedRecommendations.length === 0 && (
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-center">
                    <p className="font-semibold text-green-300">No Action Required</p>
                    <p className="text-slate-400 mt-1">Soil reserves are adequate for this cropping season.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cost estimate dashboard */}
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4.5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                Cost Estimate Breakdown
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Field Area</span>
                  <span className="font-semibold text-white">{area.toFixed(2)} ha</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Estimate Per Hectare</span>
                  <span className="font-semibold text-white">${totalCostPerHa.toFixed(2)}</span>
                </div>

                <div className="border-t border-white/5 pt-2.5 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-200">Total Field Cost</span>
                  <span className="text-2xl font-black text-green-400">${grandTotalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Timeline Visualization */}
        {plan && (
          <FertilizerTimeline 
            scheduleSteps={plan.scheduleSteps} 
            fieldArea={area} 
          />
        )}
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default FertilizerCard;
