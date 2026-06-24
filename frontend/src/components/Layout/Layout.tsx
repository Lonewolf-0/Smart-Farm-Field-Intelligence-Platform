import React from "react";
import Navbar from "./Navbar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_45%),linear-gradient(180deg,_#08111f_0%,_#0f172a_45%,_#111827_100%)] text-slate-100 pt-16">
      <Navbar />
      <main className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
