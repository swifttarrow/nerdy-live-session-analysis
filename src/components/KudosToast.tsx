"use client";

import { useEffect } from "react";
import type { KudosEvent } from "@coaching-system/kudos";

interface Props {
  kudos: KudosEvent;
  onDismiss: (id: string) => void;
}

const ICON: Record<string, string> = {
  open_ended_question: "❓",
  probe_assumptions: "💡",
  hypothetical_scenario: "🔮",
};

export default function KudosToast({ kudos, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(kudos.id), 8000);
    return () => clearTimeout(timer);
  }, [kudos.id, onDismiss]);

  return (
    <div
      className="flex items-start gap-3 bg-emerald-900/40 border border-emerald-600/50 rounded-xl px-4 py-3 shadow-lg w-72 animate-in slide-in-from-right"
      role="status"
      aria-live="polite"
    >
      <span className="text-xl flex-shrink-0 mt-0.5">
        {ICON[kudos.type] ?? "🌟"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-100">{kudos.headline}</p>
        <p className="text-xs text-emerald-300/80 mt-0.5">{kudos.message}</p>
      </div>
      <button
        onClick={() => onDismiss(kudos.id)}
        className="text-emerald-400/70 hover:text-emerald-300 flex-shrink-0 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
