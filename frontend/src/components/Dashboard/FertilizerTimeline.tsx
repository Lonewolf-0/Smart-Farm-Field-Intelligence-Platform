import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import type { FertilizerStep } from "../../types";

interface FertilizerTimelineProps {
  scheduleSteps?: FertilizerStep[];
  fieldArea: number;
}

const FertilizerTimeline: React.FC<FertilizerTimelineProps> = ({ scheduleSteps = [], fieldArea }) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  useEffect(() => {
    setActiveStepIdx(0);
  }, [scheduleSteps]);

  if (!scheduleSteps || scheduleSteps.length === 0) return null;

  const activeStep = scheduleSteps[activeStepIdx] || scheduleSteps[0];

  return (
    <div className="mt-6 border-t border-white/5 pt-6 space-y-6">
      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-amber-400" />
        Fertilizer Application Timeline
      </h4>

      {/* Horizontal timeline visualizer */}
      <div className="relative py-8 px-4 bg-slate-905/30 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
        <div className="min-w-[450px] relative flex items-center justify-between py-2">
          
          {/* Horizontal connecting track */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
          
          {/* Active progress highlight */}
          <div 
            className="absolute top-1/2 left-4 h-1 bg-amber-500 -translate-y-1/2 transition-all duration-500 z-0"
            style={{ 
              width: `${scheduleSteps.length > 1 ? (activeStepIdx / (scheduleSteps.length - 1)) * 90 + 5 : 100}%` 
            }}
          ></div>

          {/* Timeline Nodes */}
          {scheduleSteps.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            const isCompleted = idx < activeStepIdx;
            const hasProducts = step.recommendations && step.recommendations.length > 0;
            
            return (
              <div 
                key={step.stage + idx}
                onClick={() => setActiveStepIdx(idx)}
                className="flex flex-col items-center cursor-pointer group relative z-10 select-none px-2"
              >
                {/* Node circle */}
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? "bg-amber-500 border-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-500/20 font-bold" 
                      : isCompleted
                      ? "bg-slate-950 border-amber-500 text-amber-400"
                      : "bg-slate-950 border-slate-700 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-200"
                  }`}
                >
                  {step.days === 0 ? "B" : `D${step.days}`}
                </div>

                {/* Growth Stage title below node */}
                <span className={`text-[10px] font-bold mt-2.5 text-center max-w-[110px] truncate transition-colors duration-200 ${
                  isActive ? "text-amber-400 font-extrabold" : "text-slate-400 group-hover:text-slate-200"
                }`}>
                  {step.stage.split(" (")[0]}
                </span>
                
                {/* Timing badge above node */}
                <span className="absolute -top-6 text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-white/10 text-slate-300 font-medium whitespace-nowrap">
                  {step.days === 0 ? "Sowing" : `Day ${step.days}`}
                </span>

                {/* Small indicator if products recommended at this step */}
                {hasProducts && !isActive && (
                  <span className="absolute top-0 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Active Step Details Panel */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4.5 space-y-4 animate-fadeIn">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h5 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider">
                {activeStep.days === 0 ? "Basal Dose" : `Top-dress (+${activeStep.days} days)`}
              </span>
              {activeStep.stage}
            </h5>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{activeStep.description}</p>
          </div>
        </div>

        {/* Products Split Table */}
        <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-950/20">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold">
                <th className="p-2.5">Product</th>
                <th className="p-2.5 text-right">Per Hectare</th>
                <th className="p-2.5 text-right font-medium">Total ({fieldArea.toFixed(1)} ha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-slate-300">
              {!activeStep.recommendations || activeStep.recommendations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-slate-500 text-xs italic">
                    No fertilizer application needed at this stage.
                  </td>
                </tr>
              ) : (
                activeStep.recommendations.map((rec) => (
                  <tr key={rec.name} className="hover:bg-white/5">
                    <td className="p-2.5 text-white font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {rec.name}
                    </td>
                    <td className="p-2.5 text-right text-slate-200">{rec.quantity.toFixed(1)} kg/ha</td>
                    <td className="p-2.5 text-right text-slate-200">{(rec.quantity * fieldArea).toFixed(1)} kg</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FertilizerTimeline;
