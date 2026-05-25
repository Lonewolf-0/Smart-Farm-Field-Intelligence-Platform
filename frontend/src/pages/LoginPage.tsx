import { LogIn } from "lucide-react";

function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Login
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Placeholder form
          </h2>
        </div>
      </div>

      <form className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Email
          </span>
          <input
            type="email"
            placeholder="farmer@example.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Password
          </span>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
          />
        </label>
        <button
          type="button"
          className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          Sign in placeholder
        </button>
      </form>
    </section>
  );
}

export default LoginPage;
