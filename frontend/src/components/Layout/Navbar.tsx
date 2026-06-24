import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { LogOut, LogIn, UserPlus, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/map": return "Map";
      case "/analytics": return "Analytics";
      case "/branches": return "Branches";
      default: return "";
    }
  };
  const title = getPageTitle(location.pathname);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
        <div className="flex h-16 items-center justify-between relative">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/nutrien-logo.svg" 
                alt="Nutrien Logo" 
                className="h-22 w-auto brightness-0 invert"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-2">
          </nav>

          {title && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-slate-200 font-medium tracking-wide">{title}</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative group py-2">
                {/* Avatar */}
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#0b637a] text-white font-medium text-sm cursor-pointer border-2 border-transparent group-hover:border-white/20 transition-all">
                  {getInitials(user.name)}
                </div>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-0 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-2 bg-slate-800">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
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
            <div className="pt-2 border-t border-white/5">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#0b637a] text-white font-medium text-sm">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
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
