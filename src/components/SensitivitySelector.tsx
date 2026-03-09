"use client";
import { SensitivityLevel } from "@/lib/coaching/sensitivity";

interface Props {
  value: SensitivityLevel;
  onChange: (level: SensitivityLevel) => void;
}

export default function SensitivitySelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">Nudges:</span>
      {(["low", "medium", "high"] as SensitivityLevel[]).map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors capitalize ${
            value === level
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
