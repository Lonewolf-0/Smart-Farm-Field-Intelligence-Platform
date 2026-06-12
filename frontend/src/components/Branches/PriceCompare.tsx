import React, { useState, useEffect } from "react";
import { DollarSign, MapPin, TrendingDown, ArrowRight } from "lucide-react";
import api from "../../services/api";
import type { Field } from "../../types";
import CustomSelect from "../UI/CustomSelect";

interface PriceCompareProps {
  userFields: Field[];
  onSelectBranch: (branchId: string) => void;
}

interface ComparisonResult {
  branchId: string;
  branchName: string;
  distance: number;
  product: string;
  price: number;
  unit: string;
}

const PRODUCTS = [
  "Urea",
  "DAP",
  "MOP",
  "NPK Complex",
  "SSP",
  "Ammonium Sulfate",
  "Seed",
];

const COST_PER_MILE_FACTOR = 0.8; // Example cost factor: $0.8 per mile travel cost

const PriceCompare: React.FC<PriceCompareProps> = ({ userFields, onSelectBranch }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>("Urea");
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      // Need user coordinates to compare
      if (userFields.length === 0 || !userFields[0].centroid) return;

      setIsLoading(true);
      try {
        const { lat, lng } = userFields[0].centroid;
        const res = await api.get(
          `/branches/compare?product=${encodeURIComponent(selectedProduct)}&lat=${lat}&lng=${lng}`
        );
        if (res.data?.success) {
          // Take top 5 nearest that have the product (the API sorts by price, let's sort by price here just in case)
          const sorted = [...res.data.data].sort((a, b) => a.price - b.price);
          setResults(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch price comparison", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchComparison();
  }, [selectedProduct, userFields]);

  if (userFields.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Please select a specific field to compare prices based on its location.
      </div>
    );
  }

  // Calculate Best Value (Price + Distance * factor)
  const resultsWithValue = results.map((r) => ({
    ...r,
    effectiveCost: r.price + (r.distance * 0.621371) * COST_PER_MILE_FACTOR,
  }));

  const cheapestPrice = results.length > 0 ? results[0].price : 0;
  
  // Find the index of the best value
  let bestValueIdx = -1;
  let minEffective = Infinity;
  resultsWithValue.forEach((r, idx) => {
    if (r.effectiveCost < minEffective) {
      minEffective = r.effectiveCost;
      bestValueIdx = idx;
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 w-full overflow-hidden">
      <div className="p-4 border-b border-white/10 shrink-0">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Compare Prices
        </h2>
        <div className="w-full">
          <CustomSelect
            value={{ id: selectedProduct, name: selectedProduct }}
            onChange={(val) => setSelectedProduct(val.id as string)}
            options={PRODUCTS.map((p) => ({ id: p, name: p }))}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No branches found selling {selectedProduct} nearby.
          </div>
        ) : (
          resultsWithValue.map((branch, index) => {
            const isCheapest = index === 0;
            const isBestValue = index === bestValueIdx;
            const diff = branch.price - cheapestPrice;

            return (
              <div
                key={branch.branchId}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  isBestValue
                    ? "bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "bg-slate-900 border-white/5"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-200">{branch.branchName}</h3>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-bold text-emerald-400">
                      ${branch.price} <span className="text-xs text-slate-500 font-normal">/{branch.unit}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-400">
                    {Math.round(branch.distance * 0.621371)} miles away
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {isCheapest && (
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Best Price
                    </span>
                  )}
                  {isBestValue && (
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Best Value
                    </span>
                  )}
                  {!isCheapest && diff > 0 && (
                    <span className="text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      +${diff} vs cheapest
                    </span>
                  )}
                </div>

                {!isCheapest && (
                  <p className="text-xs text-slate-400 mb-3 bg-white/5 p-2 rounded-lg border border-white/5">
                    Save <span className="text-emerald-400 font-bold">${diff}</span> by going to {results[0].branchName} instead.
                  </p>
                )}

                <button
                  onClick={() => onSelectBranch(branch.branchId)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-white/5 hover:border-white/10"
                >
                  View on Map <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PriceCompare;
