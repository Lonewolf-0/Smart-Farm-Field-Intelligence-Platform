import { BarChart3, AlertTriangle, Sprout, RefreshCw, CloudSun, Tractor, FlaskConical } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";
import type { Field, RiskAlert } from "../types";
import { connectRiskStream } from "../services/riskStream";
import { showNotification } from "../utils/notification";
import SoilCard from "../components/Dashboard/SoilCard";
import IrrigationCard from "../components/Dashboard/IrrigationCard";
import WeatherCard from "../components/Dashboard/WeatherCard";
import CropSuitabilityCard from "../components/Dashboard/CropSuitabilityCard";
import FertilizerCard from "../components/Dashboard/FertilizerCard";
import NDVICard from "../components/Dashboard/NDVICard";
import PesticideCard from "../components/Dashboard/PesticideCard";
import RiskAlertCard from "../components/Dashboard/RiskAlertCard";
import CustomSelect from "../components/UI/CustomSelect";
import { AnalysisProvider, type AnalysisData } from "../context/AnalysisContext";
import { useField } from "../context/FieldContext";

function DashboardPage() {
  const { fields, isLoadingFields: loadingFields, selectedFieldId, setSelectedFieldId } = useField();
  const [criticalAlerts, setCriticalAlerts] = useState<RiskAlert[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "nutrition" | "operations" | "fertilizer">("overview");

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 8, label: "" });
  
  // Cache State
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [lastAnalyzedTimestamp, setLastAnalyzedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedFieldId) return;
    const cacheKey = `dashboard_analysis_${selectedFieldId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAnalysisData(parsed.results);
        setLastAnalyzedTimestamp(parsed.timestamp);
      } catch (e) {
        console.warn("Invalid cache", e);
        setAnalysisData(null);
        setLastAnalyzedTimestamp(null);
      }
    } else {
      setAnalysisData(null);
      setLastAnalyzedTimestamp(null);
    }
  }, [selectedFieldId]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        void Notification.requestPermission();
      }
    }
  }, []);

  // SSE Real-time Risk Alerts listener
  useEffect(() => {
    if (!selectedFieldId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const eventSource = connectRiskStream(selectedFieldId, token, (newAlerts: RiskAlert[]) => {
      // 1. Filter out already-dismissed alerts from triggering notifications
      let dismissed: string[] = [];
      try {
        const stored = localStorage.getItem("dismissed_risks");
        dismissed = stored ? JSON.parse(stored) : [];
      } catch (err) {
        console.error(err);
      }

      newAlerts.forEach((alert) => {
        const uniqueKey = `${selectedFieldId}_${alert.type}_${alert.expectedDate}`;
        if (!dismissed.includes(uniqueKey)) {
          const notificationSessionKey = `notified_${uniqueKey}`;
          if (!sessionStorage.getItem(notificationSessionKey)) {
            showNotification(alert);
            sessionStorage.setItem(notificationSessionKey, "true");
          }
        }
      });

      // 2. Dynamically merge incoming high/critical alerts into the active Analysis context
      setAnalysisData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          risks: newAlerts,
        };
      });
    });

    return () => {
      eventSource.close();
    };
  }, [selectedFieldId]);

  const handleAnalyzeField = async () => {
    if (!selectedFieldId) return;
    setIsAnalyzing(true);
    try {
      const steps = [
        { key: "soil", label: "Analyzing Soil Profile...", endpoint: `/analysis/${selectedFieldId}/soil` },
        { key: "ndvi", label: "Fetching Satellite NDVI...", endpoint: `/analysis/${selectedFieldId}/ndvi` },
        { key: "weather", label: "Forecasting Weather...", endpoint: `/analysis/${selectedFieldId}/weather` },
        { key: "irrigation", label: "Assessing Irrigation Needs...", endpoint: `/analysis/${selectedFieldId}/irrigation` },
        { key: "crop", label: "Computing Crop Suitability...", endpoint: `/analysis/${selectedFieldId}/crop` },
        { key: "fertilizer", label: "Calculating Fertilizer Plan...", endpoint: `/analysis/${selectedFieldId}/fertilizer` },
        { key: "pesticide", label: "Assessing Pesticide Risk...", endpoint: `/analysis/${selectedFieldId}/pesticide` },
        { key: "risks", label: "Compiling Risk Alerts...", endpoint: `/analysis/${selectedFieldId}/risks` },
      ];

      const newResults: Partial<AnalysisData> = {};

      for (let i = 0; i < steps.length; i++) {
        setAnalyzeProgress({ current: i + 1, total: steps.length, label: steps[i].label });
        try {
          const res = await api.post(steps[i].endpoint);
          if (steps[i].key === "soil") {
            const histRes = await api.get(`/analysis/${selectedFieldId}/soil/history`);
            newResults.soil = histRes.data?.data;
          } else {
            newResults[steps[i].key as keyof AnalysisData] = res.data?.data;
          }
        } catch (e) {
          console.warn(`Failed step ${steps[i].label}`, e);
        }
      }
      
      const timestamp = Date.now();
      localStorage.setItem(`dashboard_analysis_${selectedFieldId}`, JSON.stringify({ timestamp, results: newResults }));
      setAnalysisData(newResults as AnalysisData);
      setLastAnalyzedTimestamp(timestamp);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isStale24h = lastAnalyzedTimestamp ? Date.now() - lastAnalyzedTimestamp > 24 * 60 * 60 * 1000 : false;
  const isStale7d = lastAnalyzedTimestamp ? Date.now() - lastAnalyzedTimestamp > 7 * 24 * 60 * 60 * 1000 : false;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
    });
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

      <div className="relative z-50 flex flex-col md:flex-row md:items-start justify-between gap-6">
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
          <div className="relative grid grid-cols-4 p-1 bg-slate-950/40 rounded-xl border border-white/10 w-full sm:w-[580px]">
            <div 
              className="absolute inset-y-1 bg-emerald-500 rounded-lg transition-all duration-300 ease-out shadow-md"
              style={{
                width: "calc((100% - 8px) / 4)",
                transform: 
                  activeTab === "overview" ? "translateX(4px)" : 
                  activeTab === "nutrition" ? "translateX(calc(100% + 4px))" : 
                  activeTab === "operations" ? "translateX(calc(200% + 4px))" :
                  "translateX(calc(300% + 4px))"
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
            <button
              onClick={() => setActiveTab("fertilizer")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "fertilizer" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Fertilizer
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

          {/* Time & Analyze Button */}
          {fields.length > 0 && selectedFieldId && (
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {lastAnalyzedTimestamp && (
                <div className="hidden sm:block text-xs text-slate-400 text-right">
                  <p>Last analyzed</p>
                  <p className="font-medium text-slate-300">{formatDate(lastAnalyzedTimestamp)}</p>
                </div>
              )}
              <button
                onClick={handleAnalyzeField}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                {analysisData ? (isAnalyzing ? "Refreshing..." : "Refresh") : (isAnalyzing ? "Analyzing..." : "Analyze Field")}
              </button>
            </div>
          )}
        </div>
      </div>

      {!loadingFields && fields.length === 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
          <p className="text-yellow-200">You haven't saved any fields yet. Draw and save a field on the Map to view analytics.</p>
        </div>
      )}

      {selectedFieldId && (
        <AnalysisProvider value={{
          data: analysisData,
          timestamp: lastAnalyzedTimestamp,
          isLoading: isAnalyzing,
          isStale24h,
          isStale7d,
          refreshAnalysis: handleAnalyzeField,
          hasCachedData: !!analysisData
        }}>
          {/* Stale Warnings Banner */}
          {analysisData && isStale7d && (
            <div className="mt-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/15 text-red-200 flex items-start gap-3 shadow-lg shadow-red-950/20 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-sm">DATA IS STALE</p>
                <p className="text-xs leading-relaxed mt-1">This analysis data is older than 7 days. Please click Refresh to get the latest insights.</p>
              </div>
            </div>
          )}
          {analysisData && isStale24h && !isStale7d && (
            <div className="mt-6 p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/15 text-yellow-200 flex items-start gap-3 shadow-lg shadow-yellow-950/20 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-sm">DATA MAY BE OUTDATED</p>
                <p className="text-xs leading-relaxed mt-1">This analysis data is older than 24 hours. Click Refresh for the latest updates.</p>
              </div>
            </div>
          )}

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
          {analysisData ? (
            <div>
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
                <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch animate-fadeIn">
                  <SoilCard fieldId={selectedFieldId} />
                  <CropSuitabilityCard fieldId={selectedFieldId} />
                </div>
              )}

              {activeTab === "operations" && (
                <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch animate-fadeIn">
                  <IrrigationCard fieldId={selectedFieldId} />
                  <PesticideCard fieldId={selectedFieldId} />
                </div>
              )}

              {activeTab === "fertilizer" && (
                <div className="mt-8 animate-fadeIn">
                  <FertilizerCard fieldId={selectedFieldId} />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Analysis Data</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-6">Run your first analysis to generate soil profiles, weather forecasts, and vegetation health metrics.</p>
              <button
                onClick={handleAnalyzeField}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
              >
                {isAnalyzing ? "Analyzing..." : "Run First Analysis"}
              </button>
            </div>
          )}
        </AnalysisProvider>
      )}
  </section>
  );
}

export default DashboardPage;
