import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const NavItem = ({
    to,
    children,
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-md text-sm font-medium",
          isActive
            ? "bg-emerald-300/20 text-emerald-200"
            : "text-slate-200 hover:bg-white/5",
        ].join(" ")
      }
      onClick={() => setOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <NavItem to="/map">Map</NavItem>
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/branches">Branches</NavItem>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-emerald-200">{user.name}</span>
                <button
                  onClick={logout}
                  className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1 rounded text-sm bg-white/5 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 rounded text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-200 hover:bg-white/5"
              aria-expanded={open}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900/80 border-t border-white/5">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <NavItem to="/map">Map</NavItem>
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/branches">Branches</NavItem>

            <div className="pt-2 border-t border-white/5">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-200">{user.name}</span>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1 rounded text-sm bg-white/5"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1 rounded text-sm bg-emerald-600 text-white"
                  >
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
