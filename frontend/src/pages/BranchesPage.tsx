import React, { useState, useEffect } from "react";
import BranchMap from "../components/Branches/BranchMap";
import BranchList from "../components/Branches/BranchList";
import PriceCompare from "../components/Branches/PriceCompare";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Field, NutrienBranch } from "../types";

const BranchesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [branches, setBranches] = useState<(NutrienBranch & { distance?: number })[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFieldId, setSelectedFieldId] = useState<string>("");

  // Fetch fields once on mount
  useEffect(() => {
    const fetchFields = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get("/fields");
        if (res.data?.success) {
          const fetchedFields = res.data.data;
          setFields(fetchedFields);
          if (fetchedFields.length > 0) {
            setSelectedFieldId(fetchedFields[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch fields:", err);
      }
    };
    void fetchFields();
  }, [isAuthenticated]);

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
          Branches Map
        </h2>
        
        {fields.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 p-2 pl-4 rounded-xl border border-white/10">
            <span className="text-sm text-slate-400">Current Field:</span>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id} className="bg-slate-900 text-white">
                  {field.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="w-full flex-1 flex flex-col lg:flex-row overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col h-full bg-slate-950 border-r border-white/10 w-full lg:w-96 shrink-0 overflow-hidden">
              <div className="flex bg-slate-900 border-b border-white/10 shrink-0">
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "list" ? "text-green-400 border-b-2 border-green-400" : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("list")}
              >
                Branch List
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "compare" ? "text-green-400 border-b-2 border-green-400" : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab("compare")}
              >
                Compare Prices
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
