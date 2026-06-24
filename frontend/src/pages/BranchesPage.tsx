import React, { useState, useEffect } from "react";
import { Store, List, ArrowLeftRight, Map as MapIcon, ChevronUp, ChevronDown, Sprout } from "lucide-react";
import BranchMap from "../components/Branches/BranchMap";
import BranchList from "../components/Branches/BranchList";
import PriceCompare from "../components/Branches/PriceCompare";
import { useField } from "../context/FieldContext";
import api from "../services/api";
import type { NutrienBranch } from "../types";
import CustomSelect from "../components/UI/CustomSelect";

const BranchesPage: React.FC = () => {
  const { fields, selectedFieldId, setSelectedFieldId } = useField();
  const [branches, setBranches] = useState<(NutrienBranch & { distance?: number })[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "compare">("list");
  const [panelExpanded, setPanelExpanded] = useState(false); // mobile: panel collapsed by default

  // Fetch branches whenever selectedFieldId changes (or initially if no fields)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        
        const selectedField = fields.find(f => f.id === selectedFieldId);
        if (selectedField && selectedField.centroid) {
          const { lat, lng } = selectedField.centroid;
          const res = await api.get(`/branches/nearest?lat=${lat}&lng=${lng}&limit=100`);
          if (res.data?.success) {
            setBranches(res.data.data);
          }
        } else {
          // If no field selected or no fields available
          const res = await api.get("/branches");
          if (res.data?.success) {
            setBranches(res.data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (fields.length === 0 || selectedFieldId) {
      void fetchBranches();
    }
  }, [selectedFieldId, fields]);

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 lg:gap-6" style={{ minHeight: "calc(100vh - 5rem)" }}>
      {/* Header with Field Selector */}
      <div className="relative z-50 flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 shrink-0">
          <Store className="h-5 w-5 text-emerald-400" /> Branches Map
        </h2>
        
        {fields.length > 0 && (
          <div className="flex items-center gap-2 bg-black/20 p-2 pl-3 rounded-xl border border-white/10 flex-1 sm:max-w-xs w-full sm:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">Field:</span>
            <div className="flex-1">
              <CustomSelect
                value={fields.find((f) => f.id === selectedFieldId) || null}
                onChange={(val) => setSelectedFieldId(val.id as string)}
                options={fields.map((f) => ({ id: f.id, name: f.name }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-2 sm:p-4 lg:p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl overflow-hidden gap-2 sm:gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-12rem)]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 min-h-[400px]">
            <Sprout className="h-10 w-10 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Sidebar Panel — bottom sheet on mobile, left panel on desktop */}
            <div className={[
              "flex flex-col rounded-xl sm:rounded-2xl border border-white/10 bg-black/20 overflow-hidden",
              "lg:w-96 lg:shrink-0 lg:h-full",
              panelExpanded ? "h-72 sm:h-80" : "h-12",
              "lg:h-full transition-all duration-300 ease-in-out",
            ].join(" ")}>
              {/* Tab bar + mobile toggle */}
              <div className="flex bg-transparent border-b border-white/10 shrink-0">
                <button
                  className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
                    activeTab === "list" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                  onClick={() => { setActiveTab("list"); setPanelExpanded(true); }}
                >
                  <List className="h-4 w-4" /> Nearby Branches
                </button>
                <button
                  className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
                    activeTab === "compare" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                  onClick={() => { setActiveTab("compare"); setPanelExpanded(true); }}
                >
                  <ArrowLeftRight className="h-4 w-4" /> Compare
                </button>
                {/* Mobile collapse toggle */}
                <button
                  className="lg:hidden px-3 text-slate-400 hover:text-slate-200 min-h-[44px]"
                  onClick={() => setPanelExpanded(v => !v)}
                  aria-label="Toggle panel"
                >
                  {panelExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === "list" ? (
                  <BranchList
                    branches={branches}
                    selectedBranchId={selectedBranchId}
                    onSelectBranch={(id) => { setSelectedBranchId(id); setPanelExpanded(false); }}
                  />
                ) : (
                  <PriceCompare
                    userFields={fields.filter(f => f.id === selectedFieldId)}
                    onSelectBranch={setSelectedBranchId}
                  />
                )}
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 min-h-[300px] h-[320px] sm:h-[400px] lg:h-auto relative z-0 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10">
              <BranchMap
                branches={branches}
                savedFields={fields}
                selectedBranchId={selectedBranchId}
                selectedFieldId={selectedFieldId || undefined}
                onSelectBranch={setSelectedBranchId}
              />
              {/* Mobile: show map button to collapse panel */}
              {panelExpanded && (
                <button
                  className="lg:hidden absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/20 text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium min-h-[40px]"
                  onClick={() => setPanelExpanded(false)}
                >
                  <MapIcon className="h-3.5 w-3.5 text-emerald-400" /> Show Map
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BranchesPage;
