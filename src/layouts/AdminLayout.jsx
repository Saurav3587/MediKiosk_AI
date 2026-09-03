import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Activity, ShieldCheck, Stethoscope, Users, Home, Settings } from "lucide-react";
import { MediKioskLogo } from "../components/common/MediKioskLogo";
import { DemoToolbar } from "../components/common/DemoToolbar";

export function AdminLayout({ children }) {
  const location = useLocation();

  const links = [
    { label: "Executive Analytics", path: "/admin/analytics", icon: BarChart3 },
    { label: "System Status & APIs", path: "/admin/system", icon: Activity },
    { label: "Doctor Queue", path: "/doctor/queue", icon: Stethoscope },
    { label: "Patient Kiosk", path: "/patient/identify", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-mediblue-100">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-6">
          <Link to="/admin/analytics">
            <MediKioskLogo size="default" showTagline={false} light={true} />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-mediblue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Hospital Systems Active
          </span>
          <Link
            to="/"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            title="Landing Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {children}
      </main>
    </div>
  );
}
