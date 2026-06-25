import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Map, BarChart3, Store } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/map", icon: Map, label: "Map" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/branches", icon: Store, label: "Branches" },
  ];

  const asideClasses = [
    "flex flex-col bg-emerald-950 border-r border-white/10 h-screen transition-all duration-300 z-50 shadow-2xl shrink-0",
    "fixed md:sticky top-0 left-0",
    isOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 w-72 md:w-20"
  ].join(" ");

  return (
    <aside className={asideClasses}>
      <div className="flex items-center justify-center md:justify-start h-16 border-b border-white/10 px-4 md:px-6 shrink-0">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 rounded bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors flex items-center justify-center text-emerald-400 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          aria-label="Toggle Sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        {isOpen && <span className="ml-3 font-bold text-white text-lg tracking-wide whitespace-nowrap">farm 24</span>}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsOpen(false);
              }
            }}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group overflow-hidden",
                isActive
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              ].join(" ")
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {isOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </div>

    </aside>
  );
};

export default Sidebar;
