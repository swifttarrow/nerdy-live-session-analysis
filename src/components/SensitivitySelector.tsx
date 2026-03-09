"use client";

interface Props {
  value: number;
  onChange: (percent: number) => void;
}

export default function SensitivitySelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm min-w-[140px]">
      <span className="text-gray-400 whitespace-nowrap">Nudge sensitivity:</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}
