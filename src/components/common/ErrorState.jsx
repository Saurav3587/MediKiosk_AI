import React from "react";
import { AlertCircle, RotateCcw, MessageSquare, Mic } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't process your voice or action clearly.",
  onRetry,
  onSwitchType,
  retryLabel = "Try Again",
  typeLabel = "Type Response Instead",
}) {
  return (
    <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-left">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <div>
            <h5 className="text-xs font-semibold text-amber-900">{title}</h5>
            <p className="text-xs text-amber-800">{message}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition"
              >
                <RotateCcw className="w-3 h-3" />
                {retryLabel}
              </button>
            )}
            {onSwitchType && (
              <button
                type="button"
                onClick={onSwitchType}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100 transition"
              >
                <MessageSquare className="w-3 h-3" />
                {typeLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
