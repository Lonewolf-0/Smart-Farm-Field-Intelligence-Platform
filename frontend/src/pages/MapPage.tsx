import type { ComponentType } from "react";
import { MapPin, PencilRuler, Route } from "lucide-react";

function MapPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Map workspace
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Interactive field mapping placeholder
          </h2>
          <p className="mt-3 text-slate-300">
            This route is ready for the Leaflet map, drawing tools, and saved
            field overlays.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
          <InfoCard icon={MapPin} title="Locate" text="Center on the field." />
          <InfoCard icon={PencilRuler} title="Draw" text="Trace boundaries." />
          <InfoCard icon={Route} title="Save" text="Store polygons." />
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-dashed border-emerald-300/30 bg-slate-950/40 p-8 text-center">
        <p className="text-lg font-semibold text-white">
          Map canvas placeholder
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Replace this with the map component when the mapping module is
          implemented.
        </p>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <Icon className="h-5 w-5 text-emerald-200" />
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}

export default MapPage;
