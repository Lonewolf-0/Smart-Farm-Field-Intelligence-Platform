import React, { useEffect, useState } from "react";
import { Cloud, Sun, Droplets, Wind, MapPin } from "lucide-react";

interface WeatherState {
  loading: boolean;
  error?: string;
  locationName?: string;
  temp?: number;
  condition?: string;
  humidity?: number;
  wind?: number;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherState>({ loading: true });

  useEffect(() => {
    const loadFallbackWeather = () => {
      setWeather({
        loading: false,
        locationName: "Default Location",
        temp: 72,
        condition: "Partly Cloudy",
        humidity: 45,
        wind: 12,
      });
    };

    if (!navigator.geolocation) {
      loadFallbackWeather();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Mock API call using the coordinates
        setTimeout(() => {
          setWeather({
            loading: false,
            locationName: "Current Location",
            temp: 72,
            condition: "Partly Cloudy",
            humidity: 45,
            wind: 12,
          });
        }, 500);
      },
      (error) => {
        console.warn("Geolocation failed or timed out, using fallback:", error.message);
        loadFallbackWeather();
      },
      { timeout: 3000, maximumAge: 60000 }
    );
  }, []);

  if (weather.loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md h-full flex items-center justify-center min-h-[160px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Cloud className="h-8 w-8 text-slate-500" />
          <span className="text-sm text-slate-400">Locating...</span>
        </div>
      </div>
    );
  }

  if (weather.error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md h-full flex flex-col items-center justify-center text-center min-h-[160px]">
        <MapPin className="h-8 w-8 text-slate-500 mb-2" />
        <p className="text-sm text-slate-400">{weather.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-6 shadow-xl backdrop-blur-md h-full relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 text-emerald-500/5 pointer-events-none">
        <Sun className="h-40 w-40" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">{weather.locationName}</span>
            </div>
            <h3 className="text-4xl font-bold text-white">{weather.temp}°F</h3>
            <p className="text-slate-300 font-medium mt-1">{weather.condition}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
            <Cloud className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="mt-6 flex gap-6">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-slate-300">{weather.wind} mph</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
