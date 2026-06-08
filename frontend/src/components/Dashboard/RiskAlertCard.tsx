import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Sun, 
  Snowflake, 
  CloudRain, 
  CloudLightning, 
  AlertCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import api from "../../services/api";
import type { RiskAlert } from "../../types";

interface RiskAlertCardProps {
  fieldId: string;
  onCriticalAlerts?: (alerts: RiskAlert[]) => void;
}

// Map alert severity to Tailwind classes
const severityStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    label: "Critical Alert"
  },
  high: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    label: "High Risk"
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    label: "Medium Risk"
  },
  low: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    label: "Informational"
  }
};

// Map alert type to matching icons
const getAlertIcon = (type: string, severity: string) => {
  const iconClass = "w-5 h-5 shrink-0 mt-0.5";
  if (severity === "critical") {
    return <AlertTriangle className={`${iconClass} text-red-400`} />;
  }

  switch (type.toLowerCase()) {
    case "heat_stress":
    case "drought":
      return <Sun className={`${iconClass} text-orange-400`} />;
    case "frost":
      return <Snowflake className={`${iconClass} text-blue-400`} />;
    case "heavy_rain":
    case "flooding":
      return <CloudRain className={`${iconClass} text-cyan-400`} />;
    case "hail":
      return <CloudLightning className={`${iconClass} text-purple-400`} />;
    default:
      return <AlertCircle className={`${iconClass} text-slate-400`} />;
  }
};

// Map raw alert type to human readable title
const getAlertTitle = (type: string): string => {
  switch (type.toLowerCase()) {
    case "drought":
      return "Drought Risk Warning";
    case "frost":
      return "Frost Warning";
    case "heat_stress":
      return "Heat Stress Warning";
    case "heavy_rain":
      return "Heavy Rain Alert";
    case "flooding":
      return "Flooding Risk";
    case "hail":
      return "Hailstorm Alert";
    default:
      return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
};

const RiskAlertCard: React.FC<RiskAlertCardProps> = ({ fieldId, onCriticalAlerts }) => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [dismissedKeys, setDismissedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("dismissed_risks");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchRisks = async () => {
    if (!fieldId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/analysis/${fieldId}/risks`);
      if (res.data?.success) {
        const fetchedAlerts: RiskAlert[] = res.data.data || [];
        setAlerts(fetchedAlerts);
      } else {
        throw new Error(res.data?.error || "Failed to load risk analysis");
      }
    } catch (err: any) {
      console.error("Failed to load risks", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch risk alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRisks();
  }, [fieldId]);

  // Synchronize critical alerts to parent component whenever alerts or dismissed keys change
  useEffect(() => {
    if (!onCriticalAlerts) return;
    const activeCritical = alerts.filter(alert => {
      const uniqueKey = `${fieldId}_${alert.type}_${alert.expectedDate}`;
      const isDismissed = dismissedKeys.includes(uniqueKey);
      return alert.severity === "critical" && !isDismissed;
    });
    onCriticalAlerts(activeCritical);
  }, [alerts, dismissedKeys, fieldId, onCriticalAlerts]);

  const toggleExpand = (uniqueKey: string) => {
    setExpandedAlerts(prev => ({ ...prev, [uniqueKey]: !prev[uniqueKey] }));
  };

  const handleDismiss = (alert: RiskAlert) => {
    const uniqueKey = `${fieldId}_${alert.type}_${alert.expectedDate}`;
    const newDismissed = [...dismissedKeys, uniqueKey];
    setDismissedKeys(newDismissed);
    try {
      localStorage.setItem("dismissed_risks", JSON.stringify(newDismissed));
    } catch (err) {
      console.error("Failed to save dismissal to localStorage", err);
    }
  };

  // Filter out any dismissed alerts for rendering
  const activeAlerts = alerts.filter(alert => {
    const uniqueKey = `${fieldId}_${alert.type}_${alert.expectedDate}`;
    return !dismissedKeys.includes(uniqueKey);
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse h-full min-h-[200px] flex flex-col justify-between">
        <div className="h-5 w-40 bg-slate-800 rounded mb-4"></div>
        <div className="space-y-3 flex-1">
          <div className="h-14 bg-slate-800/60 rounded-xl"></div>
          <div className="h-14 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full min-h-[200px] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <p className="text-red-400 font-semibold mb-1">Risk Assessment Failed</p>
        <p className="text-slate-400 text-xs mb-4">{error}</p>
        <button
          onClick={fetchRisks}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full flex flex-col text-slate-200">
      <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3 shrink-0">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Active Risk Warnings
        </h3>
        {activeAlerts.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[10px] text-slate-300 font-medium">
            {activeAlerts.length} active
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] custom-scrollbar">
        {activeAlerts.length === 0 ? (
          <div 
            data-testid="no-risk-state"
            className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 animate-fadeIn"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">All Clear</p>
              <p className="text-xs opacity-90 leading-relaxed mt-0.5">
                No active risks. Your field conditions are normal.
              </p>
            </div>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const uniqueKey = `${fieldId}_${alert.type}_${alert.expectedDate}`;
            const isExpanded = !!expandedAlerts[uniqueKey];
            const styles = severityStyles[alert.severity] || severityStyles.low;
            const isCritical = alert.severity === "critical";

            return (
              <div
                key={uniqueKey}
                data-testid={`risk-alert-${alert.severity}`}
                className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${styles.bg} ${styles.border} ${isCritical ? "font-bold shadow-lg shadow-red-500/5" : ""}`}
              >
                <div className="flex justify-between items-start gap-2.5">
                  <div className="flex gap-2.5 flex-1">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {getAlertTitle(alert.type)}
                        </h4>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded border ${styles.text} ${styles.border}`}>
                          {styles.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5 font-medium">
                        <span>Expected: <strong>{alert.expectedDate}</strong></span>
                        {alert.duration && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>Duration: <strong>{alert.duration}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {alert.recommendation && (
                      <button
                        onClick={() => toggleExpand(uniqueKey)}
                        className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={isExpanded ? "Hide action steps" : "View action steps"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(alert)}
                      className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && alert.recommendation && (
                  <div className="mt-1 pl-7 text-xs border-t border-white/5 pt-3 animate-slideDown">
                    <p className="font-bold text-white uppercase tracking-wider text-[10px] mb-1">
                      Recommended Action:
                    </p>
                    <p className="text-slate-300 leading-relaxed font-normal">
                      {alert.recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RiskAlertCard;
