import React, { useState, useEffect } from "react";
import { Store, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import type { NutrienBranch, Field } from "../../types";

interface BranchLocatorCardProps {
  fieldId: string;
}

const BranchLocatorCard: React.FC<BranchLocatorCardProps> = ({ fieldId }) => {
  const [nearestBranch, setNearestBranch] = useState<(NutrienBranch & { distance: number }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearestBranch = async () => {
      if (!fieldId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch field to get centroid
        const fieldRes = await api.get("/fields");
        if (!fieldRes.data?.success) throw new Error("Failed to fetch fields");
        
        const field = fieldRes.data.data.find((f: Field) => f.id === fieldId);
        if (!field || !field.centroid) throw new Error("Field location not found");

        // 2. Fetch nearest branch
        const { lat, lng } = field.centroid;
        const branchRes = await api.get(`/branches/nearest?lat=${lat}&lng=${lng}&limit=1`);
        
        if (branchRes.data?.success && branchRes.data.data.length > 0) {
          setNearestBranch(branchRes.data.data[0]);
        } else {
          setError("No branches found nearby.");
        }
      } catch (err) {
        console.error("Failed to load nearest branch", err);
        setError("Unable to locate nearest branch.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchNearestBranch();
  }, [fieldId]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full min-h-[250px] animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-slate-800 rounded-xl"></div>
          <div className="h-6 w-32 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !nearestBranch) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col justify-center items-center text-center">
        <Store className="w-8 h-8 text-slate-500 mb-3" />
        <p className="text-slate-400">{error || "Branch data unavailable"}</p>
      </div>
    );
  }

  // Find key products if available
  const urea = nearestBranch.products.find(p => p.name.toLowerCase().includes("urea"));
  const dap = nearestBranch.products.find(p => p.name.toLowerCase().includes("dap") || p.name.toLowerCase().includes("ammonium sulfate")); // fallback to something seeded

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full text-slate-200 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Nearest Branch</h3>
            <div className="flex items-center gap-1 text-sm text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{nearestBranch.distance.toFixed(1)} km away</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-emerald-300 font-medium text-lg mb-1">{nearestBranch.name}</h4>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{nearestBranch.address}</p>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-3 mb-4">
          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Inputs</h5>
          
          <div className="space-y-2">
            {urea && (
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {urea.name}
                </span>
                <span className="font-medium text-emerald-400">₹{urea.price}<span className="text-xs text-slate-500">/{urea.unit}</span></span>
              </div>
            )}
            {dap && (
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {dap.name}
                </span>
                <span className="font-medium text-emerald-400">₹{dap.price}<span className="text-xs text-slate-500">/{dap.unit}</span></span>
              </div>
            )}
            {!urea && !dap && (
              <p className="text-sm text-slate-500 italic">Inventory details unavailable online.</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-2">
          {nearestBranch.services.slice(0, 3).map((service, i) => (
            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
              {service}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <Link 
          to="/branches"
          className="flex items-center justify-between w-full text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors group"
        >
          View all branches & compare prices
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default BranchLocatorCard;
