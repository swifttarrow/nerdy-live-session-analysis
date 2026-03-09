import { participationDescription } from "@analytics-dashboard/participation";
import type { SessionSummary } from "@analytics-dashboard/summary";

interface ParticipationSectionProps {
  summary: SessionSummary;
}

export function ParticipationSection({ summary }: ParticipationSectionProps) {
  if (!summary.participationLabel) return null;

  const participationBadgeColor =
    summary.participationLabel === "engaged"
      ? "bg-green-900/50 text-green-300 border border-green-700"
      : summary.participationLabel === "moderate"
        ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
        : "bg-red-900/50 text-red-300 border border-red-700";

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Participation</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${participationBadgeColor}`}
        >
          {summary.participationLabel}
        </span>
      </div>
      <p className="text-gray-400 text-sm">
        {summary.participationDescription ??
          participationDescription(summary.participationLabel)}
      </p>
    </div>
  );
}
