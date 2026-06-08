import { BarChart3, Map, AlertTriangle, Eye, Sprout, ShieldAlert } from "lucide-react";
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

function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [loadingFields, setLoadingFields] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState<RiskAlert[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "nutrition" | "operations">("overview");

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

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8 min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Dashboard
            </p>
            <h2 className="text-3xl font-semibold text-white">
              Field Analytics
            </h2>
          </div>
        </div>

        {/* Field Selector */}
        <div className="flex items-center gap-3 bg-slate-950/50 p-2 pl-4 rounded-xl border border-white/10">
          <Map className="h-5 w-5 text-cyan-200" />
          {loadingFields ? (
            <span className="text-slate-300 pr-4 animate-pulse">Loading fields...</span>
          ) : fields.length > 0 ? (
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id} className="bg-slate-900 text-white">
                  {field.name} ({field.area.toFixed(1)} ha)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-slate-400 pr-4">No fields saved</span>
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

          {/* Premium Glassmorphism Tab Selector */}
          <div className="mt-6 flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950/45 border border-white/10 backdrop-blur-md max-w-lg">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Eye className="w-4 h-4" />
              Overview & Weather
            </button>
            <button
              onClick={() => setActiveTab("nutrition")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                activeTab === "nutrition"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sprout className="w-4 h-4" />
              Soil & Nutrients
            </button>
            <button
              onClick={() => setActiveTab("operations")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                activeTab === "operations"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Operations
            </button>
          </div>

          {/* Tab Contents */}
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
        </>
      )}
  </section>
  );
}

export default DashboardPage;
