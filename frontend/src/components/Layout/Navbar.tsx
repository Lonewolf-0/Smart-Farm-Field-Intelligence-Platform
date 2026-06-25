import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, Bell, Menu, MapPin, Cloud, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useWeather } from "../../hooks/useWeather";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [timeStr, setTimeStr] = useState("");
  const weather = useWeather();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' (Local)');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-6 shrink-0">
      <div className="flex-1 flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Info Group: Location, Weather, Time */}
        <div className="hidden md:flex items-center gap-3 bg-slate-800/50 px-4 py-1.5 rounded-full border border-white/5">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-semibold whitespace-nowrap">{weather.loading ? "Locating..." : weather.locationName}</span>
          </div>
          
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          
          <div className="flex items-center gap-2 text-slate-200">
            {weather.loading || weather.error ? (
               <span className="text-sm font-medium">--°F</span>
            ) : (
              <>
                <span className="text-sm font-medium">{weather.temp}°F</span>
                {weather.condition?.toLowerCase().includes("cloud") ? (
                  <Cloud className="h-4 w-4 text-slate-400" />
                ) : (
                  <Sun className="h-4 w-4 text-yellow-400" />
                )}
              </>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 mx-1"></div>

          <div className="flex items-center text-slate-300">
            <span className="text-sm font-medium">{timeStr.split(' ')[0]}</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border-2 border-slate-900"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative group py-2">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold text-white">{user.name}</span>
                  <span className="text-xs text-slate-400">Active</span>
                </div>
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-700 text-white font-medium text-sm border-2 border-transparent group-hover:border-emerald-400 transition-all">
                  {getInitials(user.name)}
                </div>
              </div>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-0 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-2 bg-slate-800">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-slate-200 transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
