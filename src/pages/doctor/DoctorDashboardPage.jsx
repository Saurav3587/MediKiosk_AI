import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, AlertTriangle, Clock, CheckCircle2, Search, Filter, RefreshCw, Sparkles, Building2 } from "lucide-react";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { PatientQueue } from "../../components/doctor/PatientQueue";
import { useDoctor } from "../../context/DoctorContext";

export function DoctorDashboardPage() {
  const { doctorProfile, patients, stats, refreshPatients, isLoading } = useDoctor();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'priority' | 'ready' | 'completed'
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    if (activeTab === "priority" && !p.priority) return false;
    if (activeTab === "ready" && p.status !== "Ready" && p.status !== "Priority") return false;
    if (activeTab === "completed" && p.status !== "Completed") return false;

    if (deptFilter !== "all" && p.department?.toLowerCase() !== deptFilter.toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchToken = p.token.toLowerCase().includes(q);
      const matchComplaint = p.chiefComplaint.toLowerCase().includes(q);
      return matchName || matchToken || matchComplaint;
    }

    return true;
  });

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-mediblue-100 text-mediblue-800 text-xs font-bold">
                Live Outpatient Queue
              </span>
              <span className="text-xs text-slate-400 font-mono">Room 14</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Good morning, {doctorProfile.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {doctorProfile.title} • {doctorProfile.department}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshPatients}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-mediblue-600" : ""}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Waiting */}
          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Waiting</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-mediblue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-navy-900 font-mono">
              {stats.patientsWaiting ?? patients.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">In OPD waiting area</span>
          </div>

          {/* Card 2: Intakes Ready */}
          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Intakes Ready</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {stats.intakesReady ?? patients.filter(p => p.status === "Ready" || p.status === "Priority").length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">AI intake completed</span>
          </div>

          {/* Card 3: Priority Reviews */}
          <div className="clinical-card p-5 rounded-3xl bg-red-50/50 border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-red-700 uppercase">Priority Triage</span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-700 font-mono">
              {stats.priorityReviews ?? patients.filter(p => p.priority && p.status !== "Completed").length}
            </div>
            <span className="text-[11px] text-red-600 font-medium mt-1 block">Prompt review flagged</span>
          </div>

          {/* Card 4: Avg Time */}
          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Avg Intake Time</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-700 font-mono">
              {stats.avgIntakeTime || "—"}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Saved per consultation</span>
          </div>
        </div>

        {/* Filter Strip & Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "All Patients", count: patients.length },
              { id: "priority", label: "Priority Reviews", count: stats.priorityReviews ?? patients.filter(p => p.priority).length, isRed: true },
              { id: "ready", label: "Ready for Doctor", count: stats.intakesReady ?? patients.filter(p => p.status === "Ready" || p.status === "Priority").length },
              { id: "completed", label: "Completed", count: stats.intakesCompleted ?? patients.filter(p => p.status === "Completed").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? tab.isRed
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-navy-900 text-white shadow-sm"
                    : tab.isRed
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Department filter & Search */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mediblue-500"
            >
              <option value="all">All Departments</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Neurology">Neurology</option>
              <option value="AYUSH / Ayurveda">AYUSH / Ayurveda</option>
              <option value="Pulmonology">Pulmonology</option>
            </select>
          </div>
        </div>

        {/* Patient Queue List / Table */}
        <PatientQueue patients={filteredPatients} />
      </div>
    </DoctorLayout>
  );
}
