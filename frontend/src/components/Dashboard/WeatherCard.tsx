import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { 
  Sun, 
  Cloud, 
  CloudFog, 
  CloudRain, 
  CloudSnow, 
  CloudDrizzle, 
  CloudLightning, 
  Thermometer, 
  Droplets, 
  Wind,
  AlertTriangle,
  RefreshCw,
  Umbrella
} from "lucide-react";
import type { WeatherData } from "../../types";
import WeatherChart from "./WeatherChart";
import AlertBanner from "../UI/AlertBanner";

import { useAnalysisContext } from "../../context/AnalysisContext";

interface WeatherCardProps {
  fieldId: string;
}

interface WeatherInfo {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

/**
 * Maps WMO weather codes or OpenWeatherMap condition strings to Lucide icons and descriptive labels.
 */
export const getWeatherInfo = (condition: string | number): WeatherInfo => {
  // 1. If numerical WMO or OpenWeatherMap code
  if (typeof condition === "number") {
    // WMO Codes
    if (condition === 0) {
      return { label: "Clear sky", icon: Sun, colorClass: "text-amber-500" };
    }
    if (condition >= 1 && condition <= 3) {
      return { label: "Partly cloudy", icon: Cloud, colorClass: "text-slate-400" };
    }
    if (condition >= 45 && condition <= 48) {
      return { label: "Fog", icon: CloudFog, colorClass: "text-slate-300" };
    }
    if (condition >= 51 && condition <= 67) {
      return { label: "Rain", icon: CloudRain, colorClass: "text-blue-500" };
    }
    if (condition >= 71 && condition <= 77) {
      return { label: "Snow", icon: CloudSnow, colorClass: "text-sky-300" };
    }
    if (condition >= 80 && condition <= 82) {
      return { label: "Rain showers", icon: CloudDrizzle, colorClass: "text-blue-400" };
    }
    if (condition >= 95 && condition <= 99) {
      return { label: "Thunderstorm", icon: CloudLightning, colorClass: "text-purple-500" };
    }
    
    // OpenWeatherMap Codes (fallback)
    if (condition === 800) {
      return { label: "Clear sky", icon: Sun, colorClass: "text-amber-500" };
    }
    if (condition > 800 && condition <= 804) {
      return { label: "Partly cloudy", icon: Cloud, colorClass: "text-slate-400" };
    }
    if (condition >= 700 && condition < 800) {
      return { label: "Fog", icon: CloudFog, colorClass: "text-slate-300" };
    }
    if ((condition >= 500 && condition < 600) || (condition >= 300 && condition < 400)) {
      return { label: "Rain", icon: CloudRain, colorClass: "text-blue-500" };
    }
    if (condition >= 600 && condition < 700) {
      return { label: "Snow", icon: CloudSnow, colorClass: "text-sky-300" };
    }
    if (condition >= 200 && condition < 300) {
      return { label: "Thunderstorm", icon: CloudLightning, colorClass: "text-purple-500" };
    }
  }

  // 2. If string condition from OpenWeatherMap (e.g. "Clear", "Clouds", "Rain")
  if (typeof condition === "string") {
    const cond = condition.trim().toLowerCase();
    if (cond === "clear" || cond === "sunny") {
      return { label: "Clear sky", icon: Sun, colorClass: "text-amber-500" };
    }
    if (cond === "clouds" || cond === "cloudy" || cond.includes("partly") || cond === "haze") {
      return { label: "Partly cloudy", icon: Cloud, colorClass: "text-slate-400" };
    }
    if (cond === "fog" || cond === "mist" || cond === "smoke") {
      return { label: "Fog", icon: CloudFog, colorClass: "text-slate-300" };
    }
    if (cond === "rain" || cond === "drizzle" || cond === "rainy") {
      return { label: "Rain", icon: CloudRain, colorClass: "text-blue-500" };
    }
    if (cond === "snow" || cond === "snowy") {
      return { label: "Snow", icon: CloudSnow, colorClass: "text-sky-300" };
    }
    if (cond.includes("shower") || cond.includes("heavy rain")) {
      return { label: "Rain showers", icon: CloudDrizzle, colorClass: "text-blue-400" };
    }
    if (cond === "thunderstorm" || cond.includes("storm") || cond === "thunder") {
      return { label: "Thunderstorm", icon: CloudLightning, colorClass: "text-purple-500" };
    }
    
    // Default formatting
    const formattedLabel = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
    return { label: formattedLabel, icon: Cloud, colorClass: "text-slate-400" };
  }

  return { label: "Unknown", icon: Cloud, colorClass: "text-slate-400" };
};

// Unit Formatting Helpers
const formatTemp = (temp: number): string => `${Math.round(temp)}°F`;
const formatHumidity = (humidity: number): string => `${humidity}%`;
const formatWindSpeed = (speedMs: number): string => `${speedMs.toFixed(1)} mph`; // API already returns mph in imperial mode
const formatPrecipitation = (precip: number): string => `${precip.toFixed(1)} mm`;

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

const WeatherCard: React.FC<WeatherCardProps> = ({ fieldId }) => {
  const { data: contextData, isLoading: loading } = useAnalysisContext();
  const data = contextData?.weather as WeatherData | undefined;
  
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Reset alert dismissed state when field changes
  useEffect(() => {
    setIsAlertDismissed(false);
  }, [fieldId]);

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse h-full flex flex-col">
        <div className="h-6 w-32 bg-slate-800 rounded mb-6"></div>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-slate-800 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-8 w-24 bg-slate-800 rounded"></div>
            <div className="h-4 w-32 bg-slate-800 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="h-16 bg-slate-800/60 rounded-xl"></div>
          <div className="h-16 bg-slate-800/60 rounded-xl"></div>
          <div className="h-16 bg-slate-800/60 rounded-xl"></div>
        </div>
        <div className="h-4 w-40 bg-slate-800 rounded mb-4"></div>
        <div className="space-y-3 flex-1">
          <div className="h-10 bg-slate-800/60 rounded-lg"></div>
          <div className="h-10 bg-slate-800/60 rounded-lg"></div>
          <div className="h-10 bg-slate-800/60 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md text-center h-full flex flex-col items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-400 font-semibold mb-1">Weather Data Unavailable</p>
      </div>
    );
  }
  // Get weather metadata for mapping icons/colors
  const currentCondition = data.rainfall > 0 ? "Rain" : (data.forecast[0]?.condition || "Clear");
  const currentInfo = getWeatherInfo(currentCondition);
  const CurrentIcon = currentInfo.icon;

  // Calculate 7-day rainfall total for AlertBanner
  const totalRainfall = data.forecast.reduce((sum, day) => sum + day.precipitation, 0);
  const showAlert = !isAlertDismissed && totalRainfall > 30;
  const alertType = totalRainfall > 60 ? "danger" : "warning";
  const alertMessage = totalRainfall > 60
    ? `Heavy rainfall alert: ${totalRainfall.toFixed(1)}mm expected`
    : `Moderate rainfall expected: ${totalRainfall.toFixed(1)}mm`;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col text-slate-200">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xl font-bold text-white">Weather Forecast</h3>
          <p className="text-sm text-emerald-200 mt-0.5">Real-time local telemetry</p>
        </div>
        <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold tracking-wide uppercase text-emerald-200">
          Live
        </div>
      </div>

      {showAlert && (
        <AlertBanner
          type={alertType}
          message={alertMessage}
          onDismiss={() => setIsAlertDismissed(true)}
        />
      )}

      {/* Current Conditions Block */}
      <div className="flex items-center gap-5 mb-6 shrink-0 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className={`p-3 rounded-xl bg-slate-900 shadow-sm border border-white/10 ${currentInfo.colorClass}`}>
          <CurrentIcon className="w-10 h-10" />
        </div>
        <div>
          <p className="font-mono text-3xl font-black text-white leading-tight">
            {formatTemp(data.temperature)}
          </p>
          <p className="text-sm font-semibold text-slate-300">
            {currentInfo.label}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
          <Thermometer className="w-5 h-5 text-red-400 mb-1" />
          <p className="text-xs text-slate-400">Temp</p>
          <p className="font-mono text-sm font-bold text-white mt-0.5">{formatTemp(data.temperature)}</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
          <Droplets className="w-5 h-5 text-blue-400 mb-1" />
          <p className="text-xs text-slate-400">Humidity</p>
          <p className="font-mono text-sm font-bold text-white mt-0.5">{formatHumidity(data.humidity)}</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
          <Wind className="w-5 h-5 text-teal-400 mb-1" />
          <p className="text-xs text-slate-400">Wind</p>
          <p className="font-mono text-sm font-bold text-white mt-0.5 truncate max-w-full">{formatWindSpeed(data.windSpeed)}</p>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-white/10 pt-5">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Umbrella className="w-4 h-4 text-emerald-400" />
            7-Day Forecast
          </h4>
          <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10 shrink-0">
            <button 
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === "list" 
                  ? "bg-emerald-500 text-slate-950 shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode("chart")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === "chart" 
                  ? "bg-emerald-500 text-slate-950 shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chart
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[220px] md:max-h-none custom-scrollbar">
            {data.forecast.map((day, index) => {
              const dayInfo = getWeatherInfo(day.condition);
              const DayIcon = dayInfo.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-lg bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors"
                >
                  <div className="w-[100px] shrink-0">
                    <p className="text-xs font-semibold text-slate-300">{formatDate(day.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-start px-2">
                    <DayIcon className={`w-4 h-4 shrink-0 ${dayInfo.colorClass}`} />
                    <span className="text-xs text-slate-400 truncate max-w-[80px]">{dayInfo.label}</span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <p className="text-xs text-slate-400">
                      {day.precipitation > 0 ? (
                        <span className="text-blue-400 font-medium">{formatPrecipitation(day.precipitation)}</span>
                      ) : (
                        "0 mm"
                      )}
                    </p>
                    <p className="text-xs font-bold text-slate-200 w-[70px]">
                      {formatTemp(day.tempMin)} / {formatTemp(day.tempMax)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <WeatherChart forecast={data.forecast} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
