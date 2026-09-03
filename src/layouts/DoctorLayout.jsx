import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FileText,
  Clock,
  Settings,
  Bell,
  Search,
  LogOut,
  Stethoscope,
  ChevronLeft,
  Menu,
  Sparkles,
  Building2,
  ShieldAlert
} from "lucide-react";
import { MediKioskLogo } from "../components/common/MediKioskLogo";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { DemoToolbar } from "../components/common/DemoToolbar";
import { useDoctor } from "../context/DoctorContext";

export function DoctorLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctorProfile, stats, logoutDoctor } = useDoctor();

  const handleLogout = () => {
    logoutDoctor();
    navigate("/doctor");
  };

  const getInitials = (name) => {
    if (!name) return "DR";
    const parts = name.replace(/^Dr\.\s*/i, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.substring(0, 2) || "DR").toUpperCase();
  };
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navItems = [
    { label: "Patient Queue", path: "/doctor/queue", icon: Users, badge: stats.intakesReady },
    { label: "Priority Review", path: "/doctor/priority", icon: ShieldAlert, badge: stats.priorityReviews, badgeColor: "bg-red-500 text-white animate-pulse" },
    { label: "Admin Analytics", path: "/admin/analytics", icon: LayoutDashboard },
    { label: "System Status", path: "/admin/system", icon: Settings },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/doctor/queue?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans selection:bg-mediblue-100">
      {/* Sidebar (Desktop) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 z-30 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!isCollapsed ? (
            <Link to="/doctor/queue" className="hover:opacity-90 transition">
              <MediKioskLogo size="compact" showTagline={false} light={true} />
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-mediblue-600 flex items-center justify-center font-bold text-white text-xs mx-auto">
              MK
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-4 h-4 transform transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-mediblue-600 text-white shadow-md shadow-mediblue-900/40"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
                title={item.label}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Doctor Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-mediblue-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {getInitials(doctorProfile.name)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <h5 className="font-bold text-slate-200 text-xs truncate">{doctorProfile.name}</h5>
                <p className="text-[10px] text-slate-400 truncate">{doctorProfile.department}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
                title="Sign out of Physician Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Clinical Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Mobile Menu Trigger & OPD Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-mediblue-50 text-mediblue-600">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-slate-800">{doctorProfile.opdRoom}</h2>
                <p className="text-[10px] text-slate-400 hidden sm:block">{doctorProfile.hospital}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient name, token (e.g. A-104), or chief complaint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-mediblue-500 transition"
              />
            </div>
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              to="/doctor/priority"
              className="relative p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 transition"
              title="Priority Alerts"
            >
              <Bell className="w-4 h-4" />
              {stats.priorityReviews > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {stats.priorityReviews}
                </span>
              )}
            </Link>

            <Link
              to="/patient/identify"
              className="px-3.5 py-1.5 rounded-full bg-navy-900 dark:bg-mediblue-600 hover:bg-slate-800 dark:hover:bg-mediblue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Patient Kiosk</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 space-y-2 border-b border-slate-800">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-mediblue-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Main Work Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
