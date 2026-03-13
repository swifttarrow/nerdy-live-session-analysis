import { participationDescription } from "@analytics-dashboard/participation";
import type { SessionSummary } from "@analytics-dashboard/summary";

interface ParticipationSectionProps {
  summary: SessionSummary;
}

export function ParticipationSection({ summary }: ParticipationSectionProps) {
  if (!summary.participationLabel) return null;

  const participationBadgeColor =
    summary.participationLabel === "great"
      ? "bg-green-900/50 text-green-300 border border-green-700"
      : summary.participationLabel === "good"
        ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
        : "bg-red-900/50 text-red-300 border border-red-700";

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
    </div>
  );
}
