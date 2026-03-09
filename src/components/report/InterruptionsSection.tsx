import type { SessionSummary } from "@analytics-dashboard/summary";

interface InterruptionsSectionProps {
  summary: SessionSummary;
}

export function InterruptionsSection({ summary }: InterruptionsSectionProps) {
  const interruptions = summary.interruptions;
  if (!interruptions) return null;

  const { classification, totalOverlaps } = interruptions;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4 space-y-3">
      <h2 className="text-lg font-semibold">Interruptions</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-950/40 rounded-xl p-3">
          <p className="text-2xl font-bold text-green-400">
            {classification.productive}
          </p>
          <p className="text-xs text-gray-400 mt-1">Productive</p>
          <p className="text-xs text-gray-500">student → tutor</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-3">
          <p className="text-2xl font-bold text-gray-300">
            {classification.neutral}
          </p>
          <p className="text-xs text-gray-400 mt-1">Neutral</p>
        </div>
        <div className="bg-red-950/40 rounded-xl p-3">
          <p className="text-2xl font-bold text-red-400">
            {classification.unproductive}
          </p>
          <p className="text-xs text-gray-400 mt-1">Unproductive</p>
          <p className="text-xs text-gray-500">tutor → student</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">
        Total overlaps: {totalOverlaps}
      </p>
    </div>
  );
}
