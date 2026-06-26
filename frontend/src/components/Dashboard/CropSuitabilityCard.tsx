import React, { useState, useEffect } from "react";
import { 
  Sprout, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle2,
  Filter,
  Info
} from "lucide-react";
import type { CropSuitability } from "../../types";
import { useAnalysisContext } from "../../context/AnalysisContext";

interface CropSuitabilityCardProps {
  fieldId: string;
}

// Local static crop-to-season mapping matching the backend's crop requirements database
const cropSeasons: Record<string, "Kharif" | "Rabi" | "Zaid"> = {
  "Wheat": "Rabi",
  "Rice": "Kharif",
  "Maize": "Kharif",
  "Soybean": "Kharif",
  "Cotton": "Kharif",
  "Sugarcane": "Kharif",
  "Mustard": "Rabi",
  "Chickpea": "Rabi",
  "Groundnut": "Kharif",
  "Potato": "Rabi",
  "Tomato": "Zaid",
  "Onion": "Rabi",
  "Sunflower": "Kharif",
  "Barley": "Rabi",
  "Millet": "Kharif"
};

const getScoreStyles = (score: number) => {
  if (score > 75) {
    return {
      barClass: "bg-green-500",
      textClass: "text-green-400",
      bgClass: "bg-green-500/10",
      borderClass: "border-green-500/20"
    };
  }
  if (score >= 50) {
    return {
      barClass: "bg-yellow-500",
      textClass: "text-yellow-400",
      bgClass: "bg-yellow-500/10",
      borderClass: "border-yellow-500/20"
    };
  }
  return {
    barClass: "bg-red-500",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20"
  };
};

const getSeasonBadge = (season: "Kharif" | "Rabi" | "Zaid" | undefined) => {
  if (!season) return null;
  const classes = 
    season === "Kharif" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
    season === "Rabi" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
    "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      {season}
    </span>
  );
};

const CropSuitabilityCard: React.FC<CropSuitabilityCardProps> = ({ fieldId }) => {
  const { data: contextData, isLoading: loading } = useAnalysisContext();
  const crops = (contextData?.crop as CropSuitability[]) || [];

  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<"All" | "Kharif" | "Rabi" | "Zaid">("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  if (loading && crops.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-48 bg-slate-800 rounded"></div>
          <div className="flex gap-2">
            <div className="h-6 w-12 bg-slate-800 rounded-md"></div>
            <div className="h-6 w-12 bg-slate-800 rounded-md"></div>
          </div>
        </div>
        <div className="space-y-4 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-800 rounded"></div>
                <div className="h-4 w-12 bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!contextData?.crop) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center h-full flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-400 font-semibold mb-1">Failed to Load Suitability</p>
      </div>
    );
  }

  // Filter crops based on local season dictionary
  const filteredCrops = crops.filter((crop) => {
    if (selectedSeason === "All") return true;
    const season = cropSeasons[crop.name];
    return season === selectedSeason;
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col text-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-400" />
            <span>Crop Suitability</span>
            <div className="relative group cursor-pointer inline-flex items-center">
              <Info className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-72 p-3.5 text-xs text-white bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-black/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none text-center font-medium normal-case leading-relaxed">
                Ranks crop suitability for this field based on historical climate patterns, soil composition, and crop requirements. Use it to optimize planting choices.
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 border-l border-t border-emerald-500/30 rotate-45"></div>
              </div>
            </div>
          </h3>
          <p className="text-sm text-emerald-200 mt-0.5">Top field recommendations</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                isFilterOpen || selectedSeason !== "All"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {selectedSeason === "All" ? "Filter" : selectedSeason}
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                {(["All", "Kharif", "Rabi", "Zaid"] as const).map((season) => (
                  <button
                    key={season}
                    onClick={() => {
                      setSelectedSeason(season);
                      setIsFilterOpen(false);
                      setExpandedCrop(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-white/5 ${
                      selectedSeason === season ? "text-amber-400 bg-amber-500/10" : "text-slate-300"
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredCrops.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/5 border border-white/5 rounded-xl border-dashed">
          <p className="text-sm text-slate-400">No recommended crops found for {selectedSeason}.</p>
        </div>
      ) : (
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            {filteredCrops.map((crop) => {
            const season = cropSeasons[crop.name];
            const score = crop.score;
            const style = getScoreStyles(score);
            const isExpanded = expandedCrop === crop.name;

            return (
              <div 
                key={crop.name}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isExpanded 
                    ? `bg-white/5 border-white/15` 
                    : `bg-slate-900/40 border-white/5 hover:bg-white/5 hover:border-white/10`
                }`}
              >
                <div 
                  onClick={() => setExpandedCrop(isExpanded ? null : crop.name)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-semibold text-white text-sm truncate">{crop.name}</span>
                    {getSeasonBadge(season)}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-black ${style.textClass}`}>{score}%</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Suitability Score Progress Bar */}
                <div 
                  onClick={() => setExpandedCrop(isExpanded ? null : crop.name)}
                  className="h-2 w-full bg-slate-950 rounded-full mt-2.5 overflow-hidden cursor-pointer"
                >
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${style.barClass}`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>

                {/* Expandable breakdown content */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      Suitability Factor Breakdown
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>pH match</span>
                          <span className="font-semibold text-slate-200">{crop.breakdown.ph}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${crop.breakdown.ph}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Temperature match</span>
                          <span className="font-semibold text-slate-200">{crop.breakdown.temperature}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${crop.breakdown.temperature}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Rainfall match</span>
                          <span className="font-semibold text-slate-200">{crop.breakdown.rainfall}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${crop.breakdown.rainfall}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Soil texture match</span>
                          <span className="font-semibold text-slate-200">{crop.breakdown.soilTexture}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${crop.breakdown.soilTexture}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

    </div>
  );
};

export default CropSuitabilityCard;
