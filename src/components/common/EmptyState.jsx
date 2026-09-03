import React from "react";
import { FolderOpen, Plus } from "lucide-react";

export function EmptyState({
  title = "No Records Found",
  description = "No items matching the current filter criteria.",
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-xs mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-mediblue-600 text-white hover:bg-mediblue-700 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
