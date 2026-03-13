import { participationDescription } from "@analytics-dashboard/participation";
import { TALK_BALANCE_CENTER } from "@analytics-dashboard/talk-balance";
import type { SessionSummary } from "@analytics-dashboard/summary";
import type { SessionPreset } from "@coaching-system/presets";
const PRESET_LABELS: Record<SessionPreset, string> = {
  lecture: "Lecture",
  practice: "Practice",
  socratic: "Socratic",
};

interface ParticipationSectionProps {
  summary: SessionSummary;
  preset?: SessionPreset | string;
}

export function ParticipationSection({ summary, preset }: ParticipationSectionProps) {
  if (!summary.participationLabel) return null;

  // Colors: Engaged/Great = green, Good = yellow, Needs improvement = red
  const participationBadgeColor =
    summary.participationLabel === "great"
      ? "bg-green-900/50 text-green-300 border border-green-700"
      : summary.participationLabel === "good"
        ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
        : "bg-red-900/50 text-red-300 border border-red-700";

  const validPreset =
    preset && ["lecture", "practice", "socratic"].includes(preset)
      ? (preset as SessionPreset)
      : undefined;
  const idealPct = validPreset
    ? Math.round(TALK_BALANCE_CENTER[validPreset] * 100)
    : 50;
  const presetLabel = validPreset
    ? PRESET_LABELS[validPreset]
    : "this session type";
  const studentPct = Math.round(summary.studentTalkRatio * 100);

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Student Participation</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${participationBadgeColor}`}
        >
          {summary.participationLabel === "needs_improvement"
            ? "Needs improvement"
            : summary.participationLabel.charAt(0).toUpperCase() +
              summary.participationLabel.slice(1)}
        </span>
      </div>
      <p className="text-gray-400 text-sm">
        {summary.participationDescription ??
          participationDescription(summary.participationLabel)}
      </p>
      <p className="text-gray-500 text-xs mt-2">
        Ideal participation for {presetLabel} is {idealPct}%. Student
        participation was {studentPct}%.
      </p>
    </div>
  );
}
