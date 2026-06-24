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
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-emerald-300/20 text-emerald-200"
            : "text-slate-200 hover:bg-white/5",
        ].join(" ")
      }
      onClick={() => setOpen(false)}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </NavLink>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-300/80 flex items-center justify-center text-slate-900 font-bold">
                SF
              </div>
              <span className="font-semibold text-white">Smart Farm</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <NavItem to="/map" icon={Map}>Map</NavItem>
            <NavItem to="/analytics" icon={BarChart3}>Analytics</NavItem>
            <NavItem to="/branches" icon={Store}>Branches</NavItem>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-emerald-200">{user.name}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-200 hover:bg-white/5"
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900/80 border-t border-white/5">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <NavItem to="/map" icon={Map}>Map</NavItem>
            <NavItem to="/analytics" icon={BarChart3}>Analytics</NavItem>
            <NavItem to="/branches" icon={Store}>Branches</NavItem>

            <div className="pt-2 border-t border-white/5">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-200">{user.name}</span>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 text-slate-200 transition-colors"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
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
