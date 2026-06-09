import React, { useEffect } from "react";
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "info" | "warning" | "success" | "error";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    info: <Info className="w-4 h-4 text-emerald-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />
  };

  const borders = {
    info: "border-emerald-500/20 bg-slate-900/90 text-emerald-100",
    warning: "border-amber-500/20 bg-slate-900/90 text-amber-100",
    success: "border-green-500/20 bg-slate-900/90 text-green-100",
    error: "border-red-500/20 bg-slate-900/90 text-red-100"
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border ${borders[type]} shadow-2xl backdrop-blur-md animate-slide-up text-xs sm:text-sm font-semibold max-w-sm`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button 
        onClick={onClose}
        className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Close toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default Toast;
