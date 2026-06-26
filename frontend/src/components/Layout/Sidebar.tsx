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
    "flex flex-col bg-slate-950/40 backdrop-blur-2xl border-r border-white/10 h-screen transition-all duration-300 z-50 shadow-2xl shrink-0",
    "fixed md:sticky top-0 left-0",
    isOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 w-72 md:w-20"
  ].join(" ");

  return (
    <aside className={asideClasses}>
      <div className="flex items-center justify-center md:justify-start h-16 border-b border-white/10 shrink-0 relative overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-full flex items-center justify-center md:justify-start px-4 md:px-6 focus:outline-none relative group cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          {/* Small Logo (Visible when closed) */}
          <img 
            src="https://companieslogo.com/img/orig/NTR-d409ac3b.png?t=1720244493" 
            alt="Toggle Sidebar" 
            className={`absolute md:left-6 h-8 w-auto brightness-0 invert transition-all duration-500 ease-out origin-center
              ${isOpen ? 'opacity-0 scale-50 -rotate-180 pointer-events-none' : 'opacity-100 scale-100 rotate-0 group-hover:scale-110'}
            `}
          />
          
          {/* Full Logo (Visible when open) */}
          <img 
            src="/nutrien-logo.svg" 
            alt="Nutrien Logo" 
            className={`absolute md:left-6 h-16 w-auto brightness-0 invert transition-all duration-500 ease-out origin-left
              ${isOpen ? 'opacity-100 scale-[1.75] translate-x-4 md:translate-x-6' : 'opacity-0 scale-75 -translate-x-8 pointer-events-none'}
            `}
          />
        </button>
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
