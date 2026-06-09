import { BarChart3, Map, AlertTriangle, Sprout, RefreshCw, CloudSun, Tractor } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";
import type { Field, RiskAlert } from "../types";
import SoilCard from "../components/Dashboard/SoilCard";
import IrrigationCard from "../components/Dashboard/IrrigationCard";
import WeatherCard from "../components/Dashboard/WeatherCard";
import CropSuitabilityCard from "../components/Dashboard/CropSuitabilityCard";
import FertilizerCard from "../components/Dashboard/FertilizerCard";
import NDVICard from "../components/Dashboard/NDVICard";
import PesticideCard from "../components/Dashboard/PesticideCard";
import BranchLocatorCard from "../components/Dashboard/BranchLocatorCard";
import RiskAlertCard from "../components/Dashboard/RiskAlertCard";
import CustomSelect from "../components/UI/CustomSelect";

function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [loadingFields, setLoadingFields] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState<RiskAlert[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "nutrition" | "operations">("overview");

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 8, label: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await api.get("/fields");
        if (res.data?.success) {
          setFields(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedFieldId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch fields", err);
      } finally {
        setLoadingFields(false);
      }
    };
    void fetchFields();
  }, []);

  const handleAnalyzeField = async () => {
    if (!selectedFieldId) return;
    setIsAnalyzing(true);
    try {
      const steps = [
        { label: "Analyzing Soil Profile...", endpoint: `/analysis/${selectedFieldId}/soil`, method: "post" },
        { label: "Fetching Satellite NDVI...", endpoint: `/analysis/${selectedFieldId}/ndvi`, method: "post" },
        { label: "Forecasting Weather...", endpoint: `/analysis/${selectedFieldId}/weather`, method: "post" },
        { label: "Assessing Irrigation Needs...", endpoint: `/analysis/${selectedFieldId}/irrigation`, method: "post" },
        { label: "Computing Crop Suitability...", endpoint: `/analysis/${selectedFieldId}/crop`, method: "post" },
        { label: "Calculating Fertilizer Plan...", endpoint: `/analysis/${selectedFieldId}/fertilizer`, method: "post" },
        { label: "Assessing Pesticide Risk...", endpoint: `/analysis/${selectedFieldId}/pesticide`, method: "post" },
        { label: "Compiling Risk Alerts...", endpoint: `/analysis/${selectedFieldId}/risks`, method: "post" },
      ];

      for (let i = 0; i < steps.length; i++) {
        setAnalyzeProgress({ current: i + 1, total: steps.length, label: steps[i].label });
        try {
          if (steps[i].method === "post") {
            // Note: pesticide and fertilizer endpoints might expect body, but they handle empty body or default if not provided
            await api.post(steps[i].endpoint);
          } else {
            await api.get(steps[i].endpoint);
          }
        } catch (e) {
          console.warn(`Failed step ${steps[i].label}`, e);
          // Continue with next steps even if one fails
        }
      }
      
      // Increment refresh key to remount and update all cards
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8 min-h-[calc(100vh-6rem)]">
      
      {/* Non-blocking Progress Banner */}
      {isAnalyzing && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-950/20 animate-fadeIn flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-200">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-semibold text-sm">Analyzing Field Data...</span>
          </div>
          <div className="flex-1 w-full max-w-md">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-emerald-300">{analyzeProgress.label}</span>
              <span className="text-emerald-400 font-medium">{analyzeProgress.current} / {analyzeProgress.total}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-emerald-900/30">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(analyzeProgress.current / analyzeProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Dashboard
              </p>
              <h2 className="text-3xl font-semibold text-white">
                Field Analytics
              </h2>
            </div>
          </div>
          
          {/* Segmented Control */}
          <div className="relative grid grid-cols-3 p-1 bg-slate-950/40 rounded-xl border border-white/10 w-full sm:w-[450px]">
            <div 
              className="absolute inset-y-1 bg-emerald-500 rounded-lg transition-all duration-300 ease-out shadow-md"
              style={{
                width: "calc((100% - 8px) / 3)",
                transform: 
                  activeTab === "overview" ? "translateX(4px)" : 
                  activeTab === "nutrition" ? "translateX(calc(100% + 4px))" : 
                  "translateX(calc(200% + 4px))"
              }}
            />
            <button
              onClick={() => setActiveTab("overview")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "overview" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <CloudSun className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("nutrition")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "nutrition" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sprout className="w-4 h-4" />
              Soil
            </button>
            <button
              onClick={() => setActiveTab("operations")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "operations" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Tractor className="w-4 h-4" />
              Operations
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Field Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
            {loadingFields ? (
              <span className="text-slate-300 animate-pulse bg-slate-950/50 px-4 py-2 rounded-xl border border-white/10 flex-1">Loading fields...</span>
            ) : fields.length > 0 ? (
              <div className="w-full">
                <CustomSelect
                  value={fields.find((f) => f.id === selectedFieldId) || null}
                  onChange={(val) => setSelectedFieldId(val.id as string)}
                  options={fields.map((f) => ({
                    id: f.id,
                    name: `${f.name} (${f.area.toFixed(1)} ha)`,
                  }))}
                />
              </div>
            ) : (
              <span className="text-slate-400 bg-slate-950/50 px-4 py-2 rounded-xl border border-white/10 flex-1">No fields saved</span>
            )}
          </div>

          {/* Analyze Button */}
          {fields.length > 0 && selectedFieldId && (
            <button
              onClick={handleAnalyzeField}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Analyzing..." : "Analyze Field"}
            </button>
          )}
        </div>
      </div>

      {!loadingFields && fields.length === 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
          <p className="text-yellow-200">You haven't saved any fields yet. Draw and save a field on the Map to view analytics.</p>
        </div>
      )}

      {selectedFieldId && (
        <>
          {/* Critical Warnings Banner */}
          {criticalAlerts.length > 0 && (
            <div 
              data-testid="critical-alerts-banner"
              className="mt-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/15 text-red-200 flex items-start gap-3 shadow-lg shadow-red-950/20 animate-fadeIn"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-sm">CRITICAL WARNING ACTIVE</p>
                <div className="mt-1 space-y-1.5 text-xs">
                  {criticalAlerts.map((alert, idx) => (
                    <p key={idx} className="leading-relaxed">
                      • <strong>{alert.message}</strong> (Expected: {alert.expectedDate}) — {alert.recommendation}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}



          {/* Tab Contents */}
          <div key={refreshKey}>
            {activeTab === "overview" && (
              <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch animate-fadeIn">
                <WeatherCard fieldId={selectedFieldId} />
                <div className="flex flex-col gap-4">
                  <RiskAlertCard 
                    fieldId={selectedFieldId} 
                    onCriticalAlerts={setCriticalAlerts} 
                  />
                  <NDVICard fieldId={selectedFieldId} />
                </div>
              </div>
            )}

            {activeTab === "nutrition" && (
              <div className="mt-8 grid gap-4 md:grid-cols-2 animate-fadeIn">
                <SoilCard fieldId={selectedFieldId} />
                <CropSuitabilityCard fieldId={selectedFieldId} />
              </div>
            )}

            {activeTab === "operations" && (
              <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch animate-fadeIn">
                <div className="flex flex-col gap-4">
                  <IrrigationCard fieldId={selectedFieldId} />
                  <BranchLocatorCard fieldId={selectedFieldId} />
                </div>
                <PesticideCard fieldId={selectedFieldId} />
                <div className="md:col-span-2">
                  <FertilizerCard fieldId={selectedFieldId} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
  </section>
  );
}

export default DashboardPage;
