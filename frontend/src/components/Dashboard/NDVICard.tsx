import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Leaf, Info } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { useAnalysisContext } from "../../context/AnalysisContext";

interface NDVIData {
  averageNDVI: number;
  healthScore: string;
  healthPercentage: number;
  stressAreas: number;
  lastImageDate: string;
  warning?: string;
}

interface NDVICardProps {
  fieldId: string;
}

const NDVICard: React.FC<NDVICardProps> = ({ fieldId }) => {
  const { data: contextData, isLoading: loading } = useAnalysisContext();
  const data = contextData?.ndvi as NDVIData | undefined;
  
  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse h-full">
        <div className="h-6 w-48 bg-slate-800 rounded mb-6"></div>
        <div className="h-32 w-32 bg-slate-800 rounded-full mx-auto mb-6"></div>
        <div className="h-10 bg-slate-800 rounded-xl mb-4"></div>
        <div className="h-10 bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center h-full flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">Satellite data unavailable. Try running analysis again.</p>
      </div>
    );
  }
  let colorBadge = "text-emerald-400 border-emerald-500/30 bg-slate-900/40";
  let textColor = "text-emerald-400";
  let bgGlow = "";
  let outerBorder = "border-emerald-500/30";
  const healthyArea = 100 - data.stressAreas;

  if (data.healthScore === "Poor") {
    colorBadge = "text-red-400 border-red-500/50 bg-slate-900/40";
    textColor = "text-red-400";
    outerBorder = "border-red-500/50";
  } else if (data.healthScore === "Moderate") {
    colorBadge = "text-yellow-400 border-yellow-500/50 bg-slate-900/40";
    textColor = "text-yellow-400";
    outerBorder = "border-yellow-500/50";
  }

  const pieData = [
    { name: "Healthy", value: healthyArea },
    { name: "Stressed", value: data.stressAreas },
  ];
  const COLORS = ["#10b981", "#ef4444"];

  const dateStr = new Date(data.lastImageDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`rounded-2xl border ${outerBorder} bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col ${bgGlow}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span>Vegetation Health</span>
            <div className="relative group cursor-pointer inline-flex items-center">
              <Info className="w-4 h-4 text-slate-400 hover:text-emerald-400 transition-colors" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-72 p-3.5 text-xs text-white bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-black/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none text-center font-medium normal-case leading-relaxed">
                Monitors crop health and density using satellite-derived NDVI vegetation index data. Helps identify healthy areas vs. areas experiencing moisture or disease stress.
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 border-l border-t border-emerald-500/30 rotate-45"></div>
              </div>
            </div>
          </h3>
          <p className="text-sm text-emerald-200 mt-0.5">Satellite NDVI Analysis</p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-wide uppercase ${colorBadge}`}>
          {data.healthScore}
        </div>
      </div>

      {data.warning && (
        <div className="mb-4 text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-2 rounded-lg">
          {data.warning}
        </div>
      )}

      <div className="flex flex-col items-center justify-center mb-6">
        <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Average NDVI</p>
        <p className={`font-mono text-5xl font-black ${textColor}`}>
          {data.averageNDVI.toFixed(2)}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="w-24 h-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ color: "#e2e8f0" }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Area"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-emerald-400 font-medium">Healthy</span>
            <span className="text-slate-400">:</span>
            <span className="text-white font-bold">{healthyArea.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-red-400 font-medium">Stressed</span>
            <span className="text-slate-400">:</span>
            <span className="text-white font-bold">{data.stressAreas.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-white/5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <p>
            <span className="font-semibold text-slate-300">NDVI Guide:</span> &gt;0.6 Dense healthy canopy, 0.3-0.6 Moderate growth, &lt;0.3 Sparse/Stressed.
          </p>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Last image: {dateStr}
        </p>
      </div>
    </div>
  );
};

export default NDVICard;
