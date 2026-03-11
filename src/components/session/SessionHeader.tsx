import SensitivitySelector from "@/components/SensitivitySelector";
import SessionTypeSelector from "@/components/SessionTypeSelector";
import type { SessionPreset } from "@coaching-system/presets";
import type { SessionStatus } from "@/hooks/useSessionRoom";

type SessionRole = "teacher" | "student";

interface SessionHeaderProps {
  roomName: string;
  role: SessionRole;
  status: SessionStatus;
  sessionPreset: SessionPreset;
  sensitivityPercent: number;
  onPresetChange: (preset: SessionPreset) => void;
  onSensitivityChange: (percent: number) => void;
  onEndSession: () => void;
  /** If false, mode controls (preset, sensitivity) are hidden (student view) */
  showModeControls?: boolean;
}

export function SessionHeader({
  roomName,
  role,
  status,
  sessionPreset,
  sensitivityPercent,
  onPresetChange,
  onSensitivityChange,
  onEndSession,
  showModeControls = true,
}: SessionHeaderProps) {
  const statusClass =
    status === "connected"
      ? "bg-green-900 text-green-300"
      : status === "connecting"
        ? "bg-yellow-900 text-yellow-300"
        : status === "error"
          ? "bg-red-900 text-red-300"
          : "bg-gray-800 text-gray-400";

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-white">SessionLens</span>
        <span className="text-gray-400 text-sm">Room: {roomName}</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            role === "teacher"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          }`}
        >
          You're the {role === "teacher" ? "Teacher" : "Student"}
        </span>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {showModeControls && (
          <>
            <SessionTypeSelector value={sessionPreset} onChange={onPresetChange} />
            <SensitivitySelector value={sensitivityPercent} onChange={onSensitivityChange} />
          </>
        )}
        <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
          {status}
        </span>
        <button
          onClick={onEndSession}
          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
