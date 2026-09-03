import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Activity, Users, ShieldAlert, FileText, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDoctor } from "../../context/DoctorContext";

export function AdminDashboardPage() {
  const { stats, patients, isLoading, error, refreshPatients } = useDoctor();

  const totalDocs = patients.reduce((acc, p) => acc + (p.documents?.length || 0), 0);
  const priorityCount = patients.filter(p => p.priority && p.status !== "Completed").length;
  const completedCount = patients.filter(p => p.status === "Completed").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-mediblue-100 text-mediblue-800 text-xs font-bold">
              Live PostgreSQL Backend
            </span>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight mt-2">
              MediKiosk Administrative Control
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Monitor real-time patient throughput, priority triage alerts, medical document OCR processing pipelines, and system connectivity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshPatients}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-mediblue-600" : ""}`} />
              Refresh
            </button>
            <Link
              to="/admin/analytics"
              className="px-5 py-3 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Open Analytics</span>
            </Link>
            <Link
              to="/admin/system"
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>System Health</span>
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            ⚠ {error} — Make sure the FastAPI backend server is running on <code className="text-xs font-mono">http://127.0.0.1:8000</code>.
          </div>
        )}

        {/* 4 Live Cards — all values from PostgreSQL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clinical-card p-6 rounded-3xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-mediblue-50 text-mediblue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Live Queue</span>
            </div>
            <div className="text-3xl font-black text-navy-900 font-mono">
              {isLoading ? "—" : patients.length}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Active patients in OPD database</span>
          </div>

          <div className="clinical-card p-6 rounded-3xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Completed</span>
            </div>
            <div className="text-3xl font-black text-emerald-700 font-mono">
              {isLoading ? "—" : (stats.intakesCompleted ?? completedCount)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Consultations finished today</span>
          </div>

          <div className="clinical-card p-6 rounded-3xl bg-red-50/50 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-red-700 uppercase">Priority Alerts</span>
            </div>
            <div className="text-3xl font-black text-red-700 font-mono">
              {isLoading ? "—" : (stats.priorityReviews ?? priorityCount)}
            </div>
            <span className="text-xs text-red-600 font-medium mt-1 block">Flagged for immediate triage</span>
          </div>

          <div className="clinical-card p-6 rounded-3xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-mediblue-50 text-mediblue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Documents</span>
            </div>
            <div className="text-3xl font-black text-mediblue-700 font-mono">
              {isLoading ? "—" : (stats.totalDocumentsProcessed ?? totalDocs)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Medical records in database</span>
          </div>
        </div>

        {/* Live Patient List Preview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent Patient Intakes</h3>
            <Link to="/doctor/queue" className="text-xs text-mediblue-600 hover:text-mediblue-700 font-semibold transition">
              View Full Queue →
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading from database...</p>
            ) : patients.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No patients in database yet.</p>
            ) : (
              patients.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={`/doctor/patient/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-mediblue-50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:border-mediblue-300 transition font-mono">
                      {p.token?.split("-")[1] || "—"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.department} • {p.age}y {p.gender}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === "Priority" ? "bg-red-100 text-red-700" :
                    p.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                    p.status === "Consulting" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {p.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
