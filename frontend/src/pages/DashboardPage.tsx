import { BarChart3, Brain, CloudSun, ShieldAlert } from "lucide-react";

const cards = [
  {
    title: "Weather",
    text: "Forecast and current conditions will appear here.",
    icon: CloudSun,
  },
  {
    title: "Soil",
    text: "Soil health metrics and trends are placeholder-ready.",
    icon: Brain,
  },
  {
    title: "Risk alerts",
    text: "Environmental warnings will surface in this card.",
    icon: ShieldAlert,
  },
];

function DashboardPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Dashboard
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Analytics placeholders
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, text, icon: Icon }) => (
          <article
            key={title}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
          >
            <Icon className="h-5 w-5 text-cyan-200" />
            <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;
