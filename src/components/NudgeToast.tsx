"use client";

import { useEffect } from "react";
import type { NudgeEvent } from "@coaching-system/engine";

interface Props {
  nudge: NudgeEvent;
  onDismiss: (id: string) => void;
}

const ICON: Record<string, string> = {
  student_silent: "🤔",
  tutor_talk_dominant: "💬",
  low_eye_contact: "👁️",
  interruptions_spike: "✋",
  student_hesitating: "⏳",
};

export default function NudgeToast({ nudge, onDismiss }: Props) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(nudge.id), 8000);
    return () => clearTimeout(timer);
  }, [nudge.id, onDismiss]);

  return (
    <div
      className="flex items-start gap-3 bg-gray-800/95 border border-gray-700 rounded-xl px-4 py-3 shadow-lg w-72 animate-in slide-in-from-right"
      role="status"
      aria-live="polite"
    >
      <span className="text-xl flex-shrink-0 mt-0.5">
        {ICON[nudge.type] ?? "💡"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{nudge.headline}</p>
        <p className="text-xs text-gray-400 mt-0.5">{nudge.suggestion}</p>
      </div>
      <button
        onClick={() => onDismiss(nudge.id)}
        className="text-gray-500 hover:text-gray-300 flex-shrink-0 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
