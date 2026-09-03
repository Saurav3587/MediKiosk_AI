import React, { useState } from "react";
import { Calendar, FileText, FlaskConical, Stethoscope, ChevronRight, Filter, Sparkles, Activity } from "lucide-react";

export function MedicalTimeline({ timeline = [], onSelectDocument }) {
  const [filter, setFilter] = useState("all");

  const filterOptions = [
    { id: "all", label: "All Events" },
    { id: "Diagnosis", label: "Diagnoses" },
    { id: "Prescription", label: "Prescriptions" },
    { id: "Investigation", label: "Lab Investigations" },
    { id: "Current Visit", label: "Visits" },
  ];

  const filteredItems = timeline.filter((item) => {
    if (filter === "all") return true;
    if (filter === "Investigation") return item.type?.toLowerCase().includes("investigation") || item.type?.toLowerCase().includes("lab");
    return item.type?.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-6">
      {/* Header & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-mediblue-100 text-mediblue-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">Patient Medical Timeline</h4>
            <p className="text-xs text-slate-500">Chronological synthesis of clinical history and past medical records</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                filter === opt.id
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Timeline Track */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredItems.map((event, index) => {
          const isLatest = event.year === "2026" || event.date === "Today";
          const isPrescription = event.type?.toLowerCase().includes("prescription");
          const isLab = event.type?.toLowerCase().includes("lab") || event.type?.toLowerCase().includes("investigation");

          return (
            <div key={index} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                  isLatest
                    ? "bg-mediblue-600 border-mediblue-200 text-white shadow-glow-blue animate-pulse"
                    : isPrescription
                    ? "bg-blue-500 border-blue-100 text-white"
                    : isLab
                    ? "bg-teal-500 border-teal-100 text-white"
                    : "bg-slate-400 border-white text-white"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>

              {/* Event Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isLatest
                    ? "bg-mediblue-50/60 border-mediblue-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-soft"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg font-mono">
                      {event.year}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{event.date}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isLatest
                        ? "bg-mediblue-100 text-mediblue-800"
                        : isPrescription
                        ? "bg-blue-100 text-blue-800"
                        : isLab
                        ? "bg-teal-100 text-teal-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {event.type}
                  </span>
                </div>

                <h5 className="font-bold text-slate-900 text-sm">{event.title}</h5>
                <p className="text-xs text-slate-600 mt-1">{event.summary}</p>

                {event.facility && (
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Facility: {event.facility}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
