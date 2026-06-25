import React, { useState, useEffect } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { FertilizerStep } from "../../types";

interface FertilizerTimelineProps {
  scheduleSteps?: FertilizerStep[];
  fieldArea: number;
  isLoading?: boolean;
}

const FertilizerTimeline: React.FC<FertilizerTimelineProps> = ({ 
  scheduleSteps = [], 
  fieldArea,
  isLoading = false 
}) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false);

  useEffect(() => {
    setActiveStepIdx(0);
  }, [scheduleSteps]);

  if (!isLoading && (!scheduleSteps || scheduleSteps.length === 0)) return null;

  const activeStep = scheduleSteps[activeStepIdx] || scheduleSteps[0];

  return (
    <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsTimelineExpanded(!isTimelineExpanded);
          }
        }}
        className="flex items-center gap-1.5 cursor-pointer select-none outline-none group mb-2 w-fit"
      >
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Fertilizer Application Timeline</span>
          {isTimelineExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          )}
        </h4>
      </div>

      {isTimelineExpanded && (
        isLoading || scheduleSteps.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-12 items-stretch animate-pulse">
            {/* Left Column: Skeleton Timeline */}
            <div className="md:col-span-4 bg-slate-900/20 border border-white/5 rounded-xl p-5 flex flex-col justify-start min-h-[220px]">
              <div className="relative pl-6 py-2 flex flex-col gap-6">
                <div className="absolute left-[44px] top-6 bottom-6 w-0.5 bg-slate-800/30"></div>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700/50 shrink-0 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                      ...
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-slate-800 rounded w-20"></div>
                      <div className="h-2 bg-slate-850 rounded w-10"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right Column: Skeleton Details */}
            <div className="md:col-span-8 bg-slate-900/40 border border-white/5 rounded-xl p-5 flex flex-col justify-start min-h-[250px] space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              </div>
              <div className="h-24 bg-slate-800/30 rounded-lg border border-white/5"></div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-12 items-stretch">
            {/* Left Column: Vertical Timeline */}
            <div className="md:col-span-4 bg-slate-900/20 border border-white/5 rounded-xl p-5 flex flex-col justify-start">
              <div className="relative pl-6 py-2 flex flex-col gap-6">
                {/* Vertical connecting track */}
                <div className="absolute left-[44px] top-6 bottom-6 w-0.5 bg-slate-800 z-0"></div>
                
                {/* Active progress highlight track */}
                <div 
                  className="absolute left-[44px] top-6 w-0.5 bg-amber-500 transition-all duration-500 z-0"
                  style={{ 
                    height: `${scheduleSteps.length > 1 ? (activeStepIdx / (scheduleSteps.length - 1)) * 100 : 100}%`,
                    maxHeight: "calc(100% - 48px)"
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
                      className="flex items-center gap-4 cursor-pointer group relative z-10 select-none"
                    >
                      {/* Node circle */}
                      <div 
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isActive 
                            ? "bg-amber-500 border-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-500/20 font-bold" 
                            : isCompleted
                            ? "bg-slate-950 border-amber-500 text-amber-400"
                            : "bg-slate-950 border-slate-700 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-200"
                        }`}
                      >
                        {step.days === 0 ? "B" : `D${step.days}`}
                      </div>

                      {/* Growth Stage & Timing details next to node */}
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold transition-colors duration-200 ${
                          isActive ? "text-amber-400" : "text-slate-300 group-hover:text-white"
                        }`}>
                          {step.stage.split(" (")[0]}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {step.days === 0 ? "Sowing" : `Day ${step.days}`}
                        </span>
                      </div>

                      {/* Small indicator if products recommended at this step */}
                      {hasProducts && !isActive && (
                        <span className="absolute left-8 top-1.5 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Step Details & Recommendations Table */}
            <div className="md:col-span-8 bg-slate-900/40 border border-white/5 rounded-xl p-5 flex flex-col justify-start animate-fadeIn min-h-[250px]">
              <div>
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider shrink-0">
                    {activeStep.days === 0 ? "Basal Dose" : `Top-dress (+${activeStep.days} days)`}
                  </span>
                  {activeStep.stage}
                </h5>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{activeStep.description}</p>
              </div>

              {/* Products Split Table */}
              <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-950/20 mt-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold">
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-right">Per Acre</th>
                      <th className="p-2.5 text-right font-medium">Total ({fieldArea.toFixed(1)} acres)</th>
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
                          <td className="p-2.5 text-right text-slate-200">{rec.quantity.toFixed(1)} lbs/acre</td>
                          <td className="p-2.5 text-right text-slate-200">{(rec.quantity * fieldArea).toFixed(1)} lbs</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default FertilizerTimeline;
