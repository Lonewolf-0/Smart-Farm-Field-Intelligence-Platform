import type { ComponentType } from "react";
import { Building2, MapPinned, ShoppingCart } from "lucide-react";

function BranchesPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-xl sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
        Branches
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Nearby store locator placeholder
      </h2>
      <p className="mt-3 max-w-2xl text-slate-300">
        This route is ready for the branch map, distance sorting, and product
        comparison UI.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <BranchFeature
          icon={MapPinned}
          title="Locate"
          text="Show branches on a map."
        />
        <BranchFeature
          icon={Building2}
          title="Compare"
          text="Sort by distance and price."
        />
        <BranchFeature
          icon={ShoppingCart}
          title="Buy"
          text="Show products and stock details."
        />
      </div>
    </section>
  );
}

function BranchFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <Icon className="h-5 w-5 text-amber-200" />
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

export default BranchesPage;
