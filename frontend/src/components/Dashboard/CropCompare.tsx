import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Trophy, Trash2, BarChart3 } from "lucide-react";
import type { CropSuitability } from "../../types";

interface CropCompareProps {
  crops: CropSuitability[];
  onClear: () => void;
}

const colors = [
  { stroke: "#f87171", fill: "#f87171", bgClass: "bg-red-500/10", borderClass: "border-red-500/25", textClass: "text-red-400" },
  { stroke: "#38bdf8", fill: "#38bdf8", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/25", textClass: "text-cyan-400" },
  { stroke: "#34d399", fill: "#34d399", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/25", textClass: "text-emerald-400" }
];

const CropCompare: React.FC<CropCompareProps> = ({ crops, onClear }) => {
  if (crops.length < 2) return null;

  // Determine the winner (crop with highest overall score)
  const sortedCrops = [...crops].sort((a, b) => b.score - a.score);
  const winner = sortedCrops[0];

  // Map forecast data to Recharts Radar format
  const radarData = [
    {
      subject: "pH",
      ...crops.reduce((acc, c) => ({ ...acc, [c.name]: c.breakdown.ph }), {})
    },
    {
      subject: "Temperature",
      ...crops.reduce((acc, c) => ({ ...acc, [c.name]: c.breakdown.temperature }), {})
    },
    {
      subject: "Rainfall",
      ...crops.reduce((acc, c) => ({ ...acc, [c.name]: c.breakdown.rainfall }), {})
    },
    {
      subject: "Soil",
      ...crops.reduce((acc, c) => ({ ...acc, [c.name]: c.breakdown.soilTexture }), {})
    },
    {
      subject: "Overall",
      ...crops.reduce((acc, c) => ({ ...acc, [c.name]: c.score }), {})
    }
  ];

  return (
    <div className="mt-6 pt-6 border-t border-white/10 space-y-5 animate-fadeIn">
      <div className="flex justify-between items-center shrink-0">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-cyan-400" /> Crop Comparison</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] lowercase font-semibold border border-cyan-500/20">
            {crops.length} selected
          </span>
        </h4>
        <button
          onClick={onClear}
          className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 px-2.5 py-1 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Comparison
        </button>
      </div>

      {/* Winner Callout Banner */}
      <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-3.5 flex items-start gap-3 text-xs text-green-200">
        <Trophy className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white text-sm">Best Selection Match</p>
          <p className="mt-0.5 opacity-90 leading-relaxed">
            Based on current soil conditions and forecast telemetry, <strong className="text-green-300 font-bold">{winner.name}</strong> is the most suitable crop with a <strong className="text-green-300 font-bold">{winner.score}%</strong> match.
          </p>
        </div>
      </div>

      {/* Side-by-side Table & Radar Chart Grid */}
      <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr] items-center">
        {/* Comparison Table */}
        <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-900/40">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-semibold">
                <th className="p-3">Factor</th>
                {crops.map((crop, idx) => {
                  const isWinner = crop.name === winner.name;
                  const color = colors[idx % colors.length];
                  return (
                    <th key={crop.name} className="p-3 min-w-[90px]">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${color.textClass}`} style={{ backgroundColor: color.stroke }}></span>
                        <span className={`font-bold ${isWinner ? "text-green-300" : "text-white"}`}>
                          {crop.name}
                        </span>
                        {isWinner && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-slate-300">
              <tr>
                <td className="p-3 text-slate-400">pH Match</td>
                {crops.map((crop) => {
                  const isWinner = crop.name === winner.name;
                  return (
                    <td key={crop.name} className={`p-3 ${isWinner ? "bg-green-500/5 text-green-300 font-semibold" : ""}`}>
                      {crop.breakdown.ph}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 text-slate-400">Temp Match</td>
                {crops.map((crop) => {
                  const isWinner = crop.name === winner.name;
                  return (
                    <td key={crop.name} className={`p-3 ${isWinner ? "bg-green-500/5 text-green-300 font-semibold" : ""}`}>
                      {crop.breakdown.temperature}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 text-slate-400">Rain Match</td>
                {crops.map((crop) => {
                  const isWinner = crop.name === winner.name;
                  return (
                    <td key={crop.name} className={`p-3 ${isWinner ? "bg-green-500/5 text-green-300 font-semibold" : ""}`}>
                      {crop.breakdown.rainfall}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 text-slate-400">Soil Match</td>
                {crops.map((crop) => {
                  const isWinner = crop.name === winner.name;
                  return (
                    <td key={crop.name} className={`p-3 ${isWinner ? "bg-green-500/5 text-green-300 font-semibold" : ""}`}>
                      {crop.breakdown.soilTexture}%
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-white/5 border-t border-white/10 font-bold text-white">
                <td className="p-3 text-slate-300">Overall Score</td>
                {crops.map((crop) => {
                  const isWinner = crop.name === winner.name;
                  const style = getScoreStyles(crop.score);
                  return (
                    <td key={crop.name} className={`p-3 ${isWinner ? "text-green-300 bg-green-500/5" : style.textClass}`}>
                      {crop.score}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Radar Chart Visualizer */}
        <div className="h-[200px] w-full flex items-center justify-center bg-slate-900/20 border border-white/5 rounded-xl p-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#ffffff08" />
              <PolarAngleAxis 
                dataKey="subject" 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                stroke="#ffffff10" 
                fontSize={7} 
                tick={false}
              />
              {crops.map((crop, idx) => {
                const color = colors[idx % colors.length];
                const isWinner = crop.name === winner.name;
                return (
                  <Radar
                    key={crop.name}
                    name={isWinner ? `${crop.name} 🏆` : crop.name}
                    dataKey={crop.name}
                    stroke={color.stroke}
                    fill={color.fill}
                    fillOpacity={isWinner ? 0.35 : 0.1}
                    strokeWidth={isWinner ? 3 : 1.5}
                  />
                );
              })}
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "11px"
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "10px", color: "#94a3b8", paddingTop: "5px" }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Simple helper to get colors dynamically for Overall Score in table
const getScoreStyles = (score: number) => {
  if (score > 75) return { textClass: "text-green-400" };
  if (score >= 50) return { textClass: "text-yellow-400" };
  return { textClass: "text-red-400" };
};

export default CropCompare;
