import { BarChart3, Map } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";
import type { Field } from "../types";
import SoilCard from "../components/Dashboard/SoilCard";
import IrrigationCard from "../components/Dashboard/IrrigationCard";
import WeatherCard from "../components/Dashboard/WeatherCard";
import CropSuitabilityCard from "../components/Dashboard/CropSuitabilityCard";
import FertilizerCard from "../components/Dashboard/FertilizerCard";
import NDVICard from "../components/Dashboard/NDVICard";
import PesticideCard from "../components/Dashboard/PesticideCard";
import SprayCalendar from "../components/Dashboard/SprayCalendar";

function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [loadingFields, setLoadingFields] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await api.get("/fields");
        if (res.data?.success) {
          setFields(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedFieldId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch fields", err);
      } finally {
        setLoadingFields(false);
      }
    };
    void fetchFields();
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8 min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Dashboard
            </p>
            <h2 className="text-3xl font-semibold text-white">
              Field Analytics
            </h2>
          </div>
        </div>

        {/* Field Selector */}
        <div className="flex items-center gap-3 bg-slate-950/50 p-2 pl-4 rounded-xl border border-white/10">
          <Map className="h-5 w-5 text-cyan-200" />
          {loadingFields ? (
            <span className="text-slate-300 pr-4 animate-pulse">Loading fields...</span>
          ) : fields.length > 0 ? (
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id} className="bg-slate-900 text-white">
                  {field.name} ({field.area.toFixed(1)} ha)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-slate-400 pr-4">No fields saved</span>
          )}
        </div>
      </div>

      {!loadingFields && fields.length === 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
          <p className="text-yellow-200">You haven't saved any fields yet. Draw and save a field on the Map to view analytics.</p>
        </div>
      )}

      {selectedFieldId && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SoilCard fieldId={selectedFieldId} />
          <IrrigationCard fieldId={selectedFieldId} />
          <NDVICard fieldId={selectedFieldId} />
          <WeatherCard fieldId={selectedFieldId} />
          <CropSuitabilityCard fieldId={selectedFieldId} />
          <FertilizerCard fieldId={selectedFieldId} />
          <div className="md:col-span-2">
            <PesticideCard fieldId={selectedFieldId} />
          </div>
          <div className="md:col-span-2">
            <SprayCalendar fieldId={selectedFieldId} />
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
