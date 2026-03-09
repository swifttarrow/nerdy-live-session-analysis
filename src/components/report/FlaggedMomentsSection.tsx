import { formatOffset } from "@/lib/post-session/flagged-moments";
import type { FlaggedMoment } from "@/lib/post-session/flagged-moments";

interface FlaggedMomentsSectionProps {
  flaggedMoments: FlaggedMoment[];
}

export function FlaggedMomentsSection({
  flaggedMoments,
}: FlaggedMomentsSectionProps) {
  if (flaggedMoments.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <h2 className="text-lg font-semibold mb-3">Flagged Moments</h2>
      <div className="space-y-2">
        {flaggedMoments.map((moment, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-xl ${
              moment.severity === "alert"
                ? "bg-red-950/30 border border-red-800/50"
                : moment.severity === "warning"
                  ? "bg-yellow-950/30 border border-yellow-800/50"
                  : "bg-gray-800/60 border border-gray-700/50"
            }`}
          >
            <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">
              {formatOffset(moment.sessionOffsetSec)}
            </span>
            <div>
              <p className="text-sm text-gray-200">{moment.reason}</p>
              <span
                className={`text-xs capitalize ${
                  moment.severity === "alert"
                    ? "text-red-400"
                    : moment.severity === "warning"
                      ? "text-yellow-400"
                      : "text-gray-400"
                }`}
              >
                {moment.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
