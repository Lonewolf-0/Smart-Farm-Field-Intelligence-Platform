import React, { useState } from "react";
import { Search, MapPin, Filter } from "lucide-react";
import type { NutrienBranch } from "../../types";

interface BranchListProps {
  branches: (NutrienBranch & { distance?: number })[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string) => void;
}

const BranchList: React.FC<BranchListProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string>("All");

  // Extract unique services for the filter dropdown
  const allServices = React.useMemo(() => {
    const services = new Set<string>();
    branches.forEach((b) => b.services.forEach((s) => services.add(s)));
    return ["All", ...Array.from(services)].sort();
  }, [branches]);

  // Filter branches based on search term and selected service
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          branch.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = selectedService === "All" || branch.services.includes(selectedService);
    return matchesSearch && matchesService;
  });

  return (
    <div className="flex flex-col h-full bg-transparent w-full lg:w-96 shrink-0 overflow-hidden">
      {/* Header & Filters */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <h2 className="text-xl font-bold text-white mb-4">Nearby Branches</h2>
        
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Service Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-400 appearance-none transition-colors"
            >
              {allServices.map((service) => (
                <option key={service} value={service}>
                  {service === "All" ? "All Services" : service}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredBranches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No branches found matching your criteria.</p>
          </div>
        ) : (
          filteredBranches.map((branch, index) => {
            const isSelected = branch.id === selectedBranchId;
            const isNearest = index === 0 && branch.distance !== undefined && branch.distance < 50;

            return (
              <button
                key={branch.id}
                onClick={() => onSelectBranch(branch.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-900/20 border-emerald-500/50 shadow-sm shadow-emerald-900/20"
                    : "bg-white/5 border-white/10 hover:border-emerald-500/30 hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold ${isSelected ? "text-emerald-400" : "text-white"}`}>
                    {branch.name}
                  </h3>
                  {isNearest && (
                    <span className="shrink-0 ml-2 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      Nearest
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-400 leading-snug">
                    {branch.address}
                    {branch.distance !== undefined && (
                      <span className="block mt-1 text-slate-300 font-medium">
                        {(branch.distance * 0.621371).toFixed(1)} miles away
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {branch.services.slice(0, 3).map((service, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded-full border border-white/10"
                    >
                      {service}
                    </span>
                  ))}
                  {branch.services.length > 3 && (
                    <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">
                      +{branch.services.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BranchList;
