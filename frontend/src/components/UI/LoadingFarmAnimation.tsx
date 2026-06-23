import { useEffect, useState } from "react";
import { Sun, Sprout, Tractor, CloudSun, Leaf } from "lucide-react";

const MESSAGES = [
  "Analyzing field soil data...",
  "Computing crop suitability scores...",
  "Calculating fertilizer recommendations...",
  "Building irrigation plan...",
  "Finalizing your agronomy report...",
  "Almost done — harvesting insights...",
];

const AGRONOMY_FACTS = [
  "🌾 Healthy soil contains billions of microbes per gram.",
  "💧 Drip irrigation can save up to 50% more water.",
  "🌱 Crop rotation replenishes essential soil nutrients.",
  "☀️ Smart sensors can predict yield 3 weeks in advance.",
  "🐛 60% of crop losses can be prevented with early pest alerts.",
];

export default function LoadingFarmAnimation() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [tractorPos, setTractorPos] = useState(0); // 0 to 100 (percentage)
  const [tractorDir, setTractorDir] = useState(1);  // 1 = right, -1 = left

  // Cycle through status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Cycle through agronomy facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % AGRONOMY_FACTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Animate tractor back-and-forth
  useEffect(() => {
    const interval = setInterval(() => {
      setTractorPos((pos) => {
        const next = pos + tractorDir * 2;
        if (next >= 100 || next <= 0) {
          setTractorDir((d) => -d);
          return Math.max(0, Math.min(100, next));
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [tractorDir]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-emerald-500/20 bg-slate-900/90 p-10 shadow-2xl shadow-emerald-950/40 max-w-md w-full mx-4">

        {/* Top icon row */}
        <div className="flex items-end gap-4">
          <Sun className="w-10 h-10 text-amber-400" style={{ animation: "spin 8s linear infinite" }} />
          <CloudSun className="w-8 h-8 text-sky-400" style={{ animation: "bounce 2s ease-in-out infinite" }} />
          <Leaf className="w-8 h-8 text-emerald-400" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          <Sprout className="w-10 h-10 text-emerald-500" style={{ animation: "bounce 1.6s ease-in-out infinite 0.3s" }} />
        </div>

        {/* Tractor Track */}
        <div className="relative w-full h-14 rounded-xl bg-emerald-950/40 border border-emerald-800/30 overflow-hidden flex items-end">
          {/* Ground line */}
          <div className="absolute bottom-3 left-0 right-0 h-0.5 bg-emerald-800/40" />
          {/* Tractor icon moving */}
          <div
            className="absolute bottom-3 transition-transform"
            style={{
              left: `${tractorPos}%`,
              transform: `translateX(-50%) scaleX(${tractorDir === -1 ? -1 : 1})`,
            }}
          >
            <Tractor className="w-9 h-9 text-emerald-400" />
          </div>
        </div>

        {/* Status message */}
        <div className="text-center">
          <p className="text-emerald-300 font-semibold text-sm tracking-wide">{MESSAGES[msgIndex]}</p>
        </div>

        {/* Pulsing dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
              style={{ animation: `bounce 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* Did you know fact */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-900/20 px-4 py-3 text-center w-full">
          <p className="text-xs text-amber-300/80 font-medium leading-relaxed">{AGRONOMY_FACTS[factIndex]}</p>
        </div>
      </div>
    </div>
  );
}
