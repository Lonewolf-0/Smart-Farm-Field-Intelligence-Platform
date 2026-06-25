import React, { useState } from "react";
import { Cloud, Sun, Droplets, Wind, MapPin, Maximize2 } from "lucide-react";
import { useWeather } from "../../hooks/useWeather";
import type { ForecastDay } from "../../hooks/useWeather";

const WeatherWidget: React.FC = () => {
  const weather = useWeather();
  const [forecastTab, setForecastTab] = useState<"24h" | "weekly">("weekly");

  // Get today's date formatted
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dayName = dateStr.split(',')[0];
  const dateRest = dateStr.substring(dateStr.indexOf(',') + 2);

  if (weather.loading) {
    return (
      <div className="rounded-3xl border border-white/5 bg-slate-800/30 p-6 flex flex-col items-center justify-center min-h-[600px] h-full">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Cloud className="h-8 w-8 text-slate-500" />
          <span className="text-sm text-slate-400">Loading Weather Data...</span>
        </div>
      </div>
    );
  }

  if (weather.error) {
    return (
      <div className="rounded-3xl border border-white/5 bg-slate-800/30 p-6 flex flex-col items-center justify-center text-center min-h-[600px] h-full">
        <MapPin className="h-8 w-8 text-slate-500 mb-2" />
        <p className="text-sm text-slate-400">{weather.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-800/30 rounded-3xl border border-white/5 overflow-hidden h-[800px]">
      {/* Top Section: Heatmap */}
      <div className="relative h-48 w-full shrink-0">
        <img 
          src="/weather-heatmap.png" 
          alt="Weather Radar" 
          className="w-full h-full object-cover"
        />
        <button className="absolute top-4 right-4 h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Middle Section: Weather's today */}
      <div className="p-6 border-b border-white/5">
        <h4 className="text-sm font-semibold text-slate-400 mb-2">Weather's today</h4>
        <p className="text-emerald-400 text-lg font-medium mb-5">
          {dayName} <span className="text-xs text-slate-500 font-normal">({dateRest})</span>
        </p>

        <div className="flex items-center gap-6 mb-8">
          <div className="h-16 w-16 flex items-center justify-center shrink-0">
            {weather.condition?.toLowerCase().includes("cloud") ? (
               <Cloud className="h-full w-full text-slate-400" />
            ) : (
               <Sun className="h-full w-full text-yellow-400" />
            )}
          </div>
          <div>
            <div className="text-5xl font-bold text-white tracking-tight">{weather.temp}°F</div>
            {/* Mocking sunshine duration as per image */}
            <div className="text-xs text-slate-500 mt-1.5 font-medium">11:43 hours (7:19 / 18:30)</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300 font-medium px-2">
           <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-400"/> {weather.humidity}%</div>
           <div className="flex items-center gap-2"><Wind className="h-4 w-4 text-teal-400"/> {weather.wind} mph</div>
           <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-slate-400"/> {weather.pressure ? weather.pressure.toFixed(2) : "30.21"} inHg</div>
        </div>
      </div>

      {/* Bottom Section: Weather forecast */}
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <h4 className="text-sm font-semibold text-slate-400 mb-4">Weather forecast</h4>
        
        {/* Toggle */}
        <div className="flex bg-slate-900/50 rounded-full p-1 mb-6 shrink-0">
          <button 
            onClick={() => setForecastTab("24h")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors ${forecastTab === "24h" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            24 hours
          </button>
          <button 
            onClick={() => setForecastTab("weekly")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors ${forecastTab === "weekly" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            Weekly
          </button>
        </div>

        {/* Forecast List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-5">
          {weather.forecast?.map((day: ForecastDay, idx: number) => {
             return (
               <div key={idx} className="flex items-center justify-between group">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 flex items-center justify-center shrink-0">
                     {day.condition?.toLowerCase().includes("cloud") ? (
                       <Cloud className="h-full w-full text-slate-400" />
                     ) : (
                       <Sun className="h-full w-full text-yellow-400" />
                     )}
                   </div>
                   <div>
                     <div className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{Math.round(day.tempMax)}°F</div>
                     <div className="text-xs text-slate-500 font-medium">{Math.round(day.tempMin)}°F (Night)</div>
                   </div>
                 </div>
                 
                 <div className="flex gap-4 text-xs text-slate-400 font-medium">
                   <div className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-blue-400/80"/> {day.precipitation > 0 ? "80%" : "20%"}</div>
                   <div className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-teal-400/80"/> {Math.round(weather.wind || 0)} mph</div>
                 </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
