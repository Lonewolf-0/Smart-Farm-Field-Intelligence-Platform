import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Map, BarChart3, Store, LogOut, LogIn, UserPlus, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const NavItem = ({
    to,
    children,
    icon: Icon,
  }: {
    to: string;
    children: React.ReactNode;
    icon?: React.FC<{ className?: string }>;
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
          isActive
            ? "bg-emerald-300/20 text-emerald-200"
            : "text-slate-200 hover:bg-white/5 active:bg-white/10",
        ].join(" ")
      }
      onClick={() => setOpen(false)}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </NavLink>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-emerald-300/80 flex items-center justify-center text-slate-900 font-bold text-xs shrink-0">
                SF
              </div>
              <span className="font-semibold text-white text-sm sm:text-base">Smart Farm</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavItem to="/map" icon={Map}>Map</NavItem>
            <NavItem to="/dashboard" icon={BarChart3}>Dashboard</NavItem>
            <NavItem to="/branches" icon={Store}>Branches</NavItem>
          </nav>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-emerald-200 truncate max-w-[140px]">{user.name}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors min-h-[36px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-slate-200 transition-colors min-h-[36px]"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors min-h-[36px]"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-200 hover:bg-white/5 active:bg-white/10 transition-colors min-h-[44px] min-w-[44px]"
              aria-expanded={open}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — animated slide-down */}
      {open && (
        <div className="lg:hidden bg-slate-900/95 border-t border-white/5 animate-slide-down">
          <div className="px-3 pt-2 pb-4 space-y-1">
            <NavItem to="/map" icon={Map}>Map</NavItem>
            <NavItem to="/dashboard" icon={BarChart3}>Dashboard</NavItem>
            <NavItem to="/branches" icon={Store}>Branches</NavItem>

            <div className="pt-2 mt-2 border-t border-white/5">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-emerald-200 truncate max-w-[160px]">{user.name}</span>
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm transition-colors min-h-[44px]"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm bg-white/5 text-slate-200 transition-colors min-h-[44px]"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm bg-emerald-600 text-white transition-colors min-h-[44px]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
