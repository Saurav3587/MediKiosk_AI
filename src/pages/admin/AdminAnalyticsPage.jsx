import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, TrendingUp, Users, Clock, FileText, ShieldAlert, Activity } from "lucide-react";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDoctor } from "../../context/DoctorContext";

const DEPT_COLORS = {
  "General Medicine": "#0267C1",
  "Orthopedics": "#0D9488",
  "Endocrinology": "#F59E0B",
  "Pediatrics": "#8B5CF6",
  "AYUSH / Ayurveda": "#10B981",
  "Neurology": "#6366F1",
  "Pulmonology": "#EC4899",
  "Dermatology": "#F97316",
  "Cardiology": "#EF4444",
  "Psychiatry": "#14B8A6",
};

const DEPT_COLOR_DEFAULT = "#94A3B8";

export function AdminAnalyticsPage() {
  const { stats, patients, isLoading } = useDoctor();

  // Compute department breakdown from live PostgreSQL patient data
  const departmentData = useMemo(() => {
    const counts = {};
    patients.forEach((p) => {
      const dept = p.department || "General Medicine";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, intakes]) => ({
        name,
        intakes,
        color: DEPT_COLORS[name] || DEPT_COLOR_DEFAULT,
      }));
  }, [patients]);

  // Compute language breakdown from live data
  const languageData = useMemo(() => {
    const counts = {};
    patients.forEach((p) => {
      const lang = p.language || "English";
      // Normalize language labels
      const key = lang.includes("Hindi") ? "Hindi" :
                  lang.includes("Tamil") ? "Tamil" :
                  lang.includes("Bengali") ? "Bengali" :
                  lang.includes("Marathi") ? "Marathi" :
                  lang.includes("Gujarati") ? "Gujarati" :
                  lang.includes("English") ? "English" : lang;
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = patients.length || 1;
    const colors = ["#0267C1", "#0D9488", "#F59E0B", "#8B5CF6", "#10B981", "#EC4899", "#94A3B8"];
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: colors[i % colors.length],
      }));
  }, [patients]);

  // Compute priority vs regular intakes breakdown
  const priorityBreakdown = useMemo(() => [
    { name: "Regular Intake", value: patients.filter((p) => !p.priority).length, color: "#0267C1" },
    { name: "Priority Triage", value: patients.filter((p) => p.priority).length, color: "#DC2626" },
  ], [patients]);

  // Status breakdown for bar chart
  const statusData = useMemo(() => {
    const counts = { Ready: 0, Priority: 0, Consulting: 0, Completed: 0 };
    patients.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [patients]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center space-y-2">
            <Activity className="w-8 h-8 mx-auto animate-pulse text-mediblue-600" />
            <p className="text-sm font-medium">Loading analytics from database...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-mediblue-50 text-mediblue-700 text-xs font-bold uppercase tracking-wider">
              Live PostgreSQL Analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mt-1">
              Hospital OPD & Intake Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              Real-time metrics computed directly from patient records in the database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-900 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {patients.length} Patients Live
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards — from database */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Patients</span>
            <div className="text-3xl font-black text-navy-900 font-mono mt-1">{patients.length}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active in OPD database</span>
          </div>

          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase">Completion Rate</span>
            <div className="text-3xl font-black text-emerald-700 font-mono mt-1">
              {stats.completionRate || (patients.length > 0
                ? `${Math.round((patients.filter(p => p.status === "Completed").length / patients.length) * 100)}%`
                : "—")}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {patients.filter(p => p.status === "Completed").length} completed today
            </span>
          </div>

          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase">Avg Intake Time</span>
            <div className="text-3xl font-black text-purple-700 font-mono mt-1">
              {stats.avgIntakeTime || "—"}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Backend computed metric</span>
          </div>

          <div className="clinical-card p-5 rounded-3xl bg-white border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase">Documents OCR'd</span>
            <div className="text-3xl font-black text-mediblue-700 font-mono mt-1">
              {stats.totalDocumentsProcessed ?? patients.reduce((acc, p) => acc + (p.documents?.length || 0), 0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Total in database</span>
          </div>
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Department Workload — from real patient data */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Department Workload</h3>
              <span className="text-xs text-slate-400">{patients.length} total patients</span>
            </div>
            <div className="h-64 w-full">
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={110} />
                    <Tooltip />
                    <Bar dataKey="intakes" fill="#0267C1" radius={[0, 8, 8, 0]} name="Patients">
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No department data yet</div>
              )}
            </div>
          </div>

          {/* Chart 2: Patient Status Breakdown — from real data */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Patient Status Breakdown</h3>
              <span className="text-xs text-slate-400">Live from DB</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="status" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0267C1" radius={[8, 8, 0, 0]} name="Count">
                    <Cell fill="#3B82F6" />
                    <Cell fill="#DC2626" />
                    <Cell fill="#8B5CF6" />
                    <Cell fill="#10B981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Language Distribution — from real data */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Language Distribution</h3>
              <span className="text-xs text-slate-400">% Patient Choice</span>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {languageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs">No language data yet</div>
              )}
            </div>
          </div>

          {/* Chart 4: Priority vs Regular Intakes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Priority vs Regular Intakes</h3>
              <span className="text-xs text-slate-400">Live triage data</span>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {priorityBreakdown.some(p => p.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs">No patients in database yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Live Patient Table — from PostgreSQL */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Live Patient Registry</h3>
            <span className="text-xs text-slate-400 font-mono">{patients.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold text-left border-b border-slate-100">
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4">Patient Name</th>
                  <th className="pb-2 pr-4">Age / Gender</th>
                  <th className="pb-2 pr-4">Department</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 pr-4 font-mono font-bold text-mediblue-700">{p.token}</td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{p.age}y • {p.gender}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{p.department}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "Priority" ? "bg-red-100 text-red-700" :
                        p.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                        p.status === "Consulting" ? "bg-purple-100 text-purple-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500">{p.documents?.length || 0}</td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No patients in database yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
