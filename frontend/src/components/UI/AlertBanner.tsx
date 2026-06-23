import React from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

interface AlertBannerProps {
  type: "warning" | "danger";
  message: string;
  onDismiss: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, message, onDismiss }) => {
  const isDanger = type === "danger";

  // Glassmorphic color palettes that fit the dark dashboard theme while providing high visual hierarchy
  const containerStyle = isDanger
    ? "bg-slate-900/40 border-red-500/50 text-red-200"
    : "bg-slate-900/40 border-amber-500/50 text-amber-200";

  const iconStyle = isDanger ? "text-red-400" : "text-amber-400";
  const Icon = isDanger ? ShieldAlert : AlertTriangle;

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${containerStyle} shadow-lg shrink-0 mb-4 transition-all duration-300 animate-fadeIn`}>
      <div className="flex items-center gap-2.5">
        <Icon className={`w-5 h-5 shrink-0 ${iconStyle}`} />
        <span className="text-xs sm:text-sm font-semibold tracking-wide">{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AlertBanner;
