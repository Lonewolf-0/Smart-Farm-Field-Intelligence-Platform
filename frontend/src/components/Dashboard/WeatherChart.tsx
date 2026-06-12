import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import type { ForecastDay } from "../../types";

interface WeatherChartProps {
  forecast: ForecastDay[];
}

const formatDayName = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return dateStr;
  }
};

const formatFullDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

// Custom tooltip to make data extremely clear to read
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const maxTemp = payload.find((p: any) => p.name === "Max Temp")?.value;
    const minTemp = payload.find((p: any) => p.name === "Min Temp")?.value;
    const precip = payload.find((p: any) => p.name === "Precipitation")?.value;

    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5">
        <p className="font-bold text-slate-200 border-b border-white/10 pb-1 mb-1">{data.fullDate}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Max Temp:
          </span>
          <span className="font-bold text-red-200">{maxTemp}°F</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Min Temp:
          </span>
          <span className="font-bold text-blue-200">{minTemp}°F</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Rainfall:
          </span>
          <span className="font-bold text-emerald-200">{precip} mm</span>
        </div>
      </div>
    );
  }
  return null;
};

const WeatherChart: React.FC<WeatherChartProps> = ({ forecast }) => {
  // Map forecast data to Recharts format
  const chartData = forecast.map((day) => ({
    name: formatDayName(day.date),
    fullDate: formatFullDate(day.date),
    "Max Temp": Math.round((day.tempMax * 9/5) + 32),
    "Min Temp": Math.round((day.tempMin * 9/5) + 32),
    Precipitation: parseFloat(day.precipitation.toFixed(1)),
  }));

  return (
    <div className="w-full h-[220px] bg-slate-950/20 rounded-xl p-2 border border-white/5">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 18, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
          
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            dy={8}
          />
          
          {/* Color-coded Left Y-Axis for Temperature */}
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#f87171"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}°F`}
            width={35}
          />
          
          {/* Color-coded Right Y-Axis for Precipitation */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#34d399"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}mm`}
            width={35}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend 
            verticalAlign="bottom" 
            height={24}
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "8px" }}
          />

          {/* Bar for Precipitation */}
          <Bar
            yAxisId="right"
            dataKey="Precipitation"
            fill="#34d399"
            opacity={0.3}
            barSize={16}
            radius={[3, 3, 0, 0]}
          />

          {/* Lines for Max & Min Temperature with high-contrast text labels */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Max Temp"
            stroke="#f87171"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            label={{ fill: "#fca5a5", fontSize: 9, position: "top", dy: -4 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Min Temp"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            label={{ fill: "#93c5fd", fontSize: 9, position: "bottom", dy: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeatherChart;
