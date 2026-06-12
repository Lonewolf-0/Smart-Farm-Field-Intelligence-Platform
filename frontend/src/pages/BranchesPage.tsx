import React, { useState, useEffect } from "react";
import { Store, List, ArrowLeftRight } from "lucide-react";
import BranchMap from "../components/Branches/BranchMap";
import BranchList from "../components/Branches/BranchList";
import PriceCompare from "../components/Branches/PriceCompare";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Field, NutrienBranch } from "../types";
import CustomSelect from "../components/UI/CustomSelect";

const BranchesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [branches, setBranches] = useState<(NutrienBranch & { distance?: number })[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFieldId, setSelectedFieldId] = useState<string>(() => localStorage.getItem("selectedFieldId") || "");

  // Fetch fields once on mount
  useEffect(() => {
    const fetchFields = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get("/fields");
        if (res.data?.success) {
          const fetchedFields = res.data.data;
          setFields(fetchedFields);
          const savedId = localStorage.getItem("selectedFieldId");
          if (savedId && fetchedFields.some((f: Field) => f.id === savedId)) {
            setSelectedFieldId(savedId);
          } else if (fetchedFields.length > 0) {
            setSelectedFieldId("all");
          }
        }
      } catch (err) {
        console.error("Failed to fetch fields:", err);
      }
    };
    void fetchFields();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedFieldId && selectedFieldId !== "all") {
      localStorage.setItem("selectedFieldId", selectedFieldId);
    }
  }, [selectedFieldId]);

  // Fetch branches whenever selectedFieldId changes (or initially if no fields)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        
        if (selectedFieldId === "all") {
          const res = await api.get("/branches");
          if (res.data?.success) {
            setBranches(res.data.data);
          }
        } else {
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
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // If we have fields but none selected yet, wait.
    // If we have no fields (e.g. empty list returned), fetch all.
    // If we have a selected field, fetch nearest.
    if (fields.length === 0 || selectedFieldId) {
      void fetchBranches();
    }
  }, [selectedFieldId, fields]);

  const [activeTab, setActiveTab] = useState<"list" | "compare">("list");

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-slate-900">
      {/* Header with Field Selector */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-slate-950">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Store className="h-5 w-5 text-emerald-400" /> Branches Map
        </h2>
        
        {fields.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-900 p-2 pl-4 rounded-xl border border-white/10 w-full sm:w-auto">
            <span className="text-sm text-slate-400 whitespace-nowrap">Current Field:</span>
            <div className="w-full sm:w-64">
              <CustomSelect
                value={
                  selectedFieldId === "all"
                    ? { id: "all", name: "Show All Branches" }
                    : fields.find((f) => f.id === selectedFieldId) || { id: "all", name: "Show All Branches" }
                }
                onChange={(val) => setSelectedFieldId(val.id as string)}
                options={[
                  { id: "all", name: "Show All Branches" },
                  ...fields.map((f) => ({ id: f.id, name: f.name }))
                ]}
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex-1 flex flex-col lg:flex-row overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col h-full bg-slate-950 border-r border-white/10 w-full lg:w-96 shrink-0 overflow-hidden">
              <div className="flex bg-slate-900 border-b border-white/10 shrink-0">
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "list" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("list")}
              >
                <List className="h-4 w-4" /> Branch List
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "compare" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("compare")}
              >
                <ArrowLeftRight className="h-4 w-4" /> Compare Prices
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeTab === "list" ? (
                <BranchList
                  branches={branches}
                  selectedBranchId={selectedBranchId}
                  onSelectBranch={setSelectedBranchId}
                />
              ) : (
                <PriceCompare
                  userFields={fields.filter(f => f.id === selectedFieldId)}
                  onSelectBranch={setSelectedBranchId}
                />
              )}
            </div>
          </div>
            <div className="flex-1 h-full relative z-0 p-4">
              <BranchMap
                branches={branches}
                savedFields={fields}
                selectedBranchId={selectedBranchId}
                selectedFieldId={selectedFieldId}
                onSelectBranch={setSelectedBranchId}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BranchesPage;
