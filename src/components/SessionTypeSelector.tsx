"use client";
import { SESSION_PRESETS, type SessionPreset } from "@coaching-system/presets";

interface Props {
  value: SessionPreset;
  onChange: (preset: SessionPreset) => void;
}

export default function SessionTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">Mode:</span>
      {SESSION_PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          title={p.tooltip}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
            value === p.id
              ? "bg-violet-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
