import React, { useState, useEffect, useCallback } from "react";
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

  // Fetch branches (either nearest based on field or all)
  const fetchBranchesAndFields = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let userFields: Field[] = [];
      if (isAuthenticated) {
        try {
          const fieldRes = await api.get("/fields");
          if (fieldRes.data?.success) {
            userFields = fieldRes.data.data;
            setFields(userFields);
          }
        } catch (err) {
          console.error("Failed to fetch fields:", err);
        }
      }

      // If user has fields, fetch nearest branches to the first field
      if (userFields.length > 0 && userFields[0].centroid) {
        const { lat, lng } = userFields[0].centroid;
        const res = await api.get(`/branches/nearest?lat=${lat}&lng=${lng}&limit=100`);
        if (res.data?.success) {
          setBranches(res.data.data);
        }
      } else {
        // Otherwise, fetch all branches
        const res = await api.get("/branches");
        if (res.data?.success) {
          setBranches(res.data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchBranchesAndFields();
  }, [fetchBranchesAndFields]);

  const [activeTab, setActiveTab] = useState<"list" | "compare">("list");

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden bg-slate-900">
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
                  userFields={fields}
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
              onSelectBranch={setSelectedBranchId}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BranchesPage;
