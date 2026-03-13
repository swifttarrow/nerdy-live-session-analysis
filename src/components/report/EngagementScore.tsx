export interface EngagementBreakdown {
  talkBalance: number;
  tutorEyeContact: number;
  studentEyeContact: number;
}

interface EngagementScoreProps {
  engagementScore: number;
  /** Component breakdown for chart (40% talk balance, 20% tutor eye contact, 40% student eye contact) */
  engagementBreakdown?: EngagementBreakdown;
  /** Raw student talk ratio (0–1) for displaying "% time student talked" instead of talk-balance score */
  studentTalkRatio?: number;
}

const COMPONENT_CONFIG = [
  {
    key: "talkBalance" as const,
    label: "% time student talked",
    weight: 0.4,
    color: "bg-cyan-500",
    getSubScore: (b: EngagementBreakdown) => b.talkBalance / 0.4,
    getContribution: (b: EngagementBreakdown) => b.talkBalance,
    /** When studentTalkRatio is provided, use it for display instead of the Gaussian score */
    getDisplayPct: (studentTalkRatio?: number) =>
      studentTalkRatio !== undefined ? studentTalkRatio * 100 : undefined,
  },
  {
    key: "tutorEyeContact" as const,
    label: "Tutor eye contact",
    weight: 0.2,
    color: "bg-amber-500",
    getSubScore: (b: EngagementBreakdown) => b.tutorEyeContact / 0.2,
    getContribution: (b: EngagementBreakdown) => b.tutorEyeContact,
    getDisplayPct: undefined,
  },
  {
    key: "studentEyeContact" as const,
    label: "Student eye contact",
    weight: 0.4,
    color: "bg-emerald-500",
    getSubScore: (b: EngagementBreakdown) => b.studentEyeContact / 0.4,
    getContribution: (b: EngagementBreakdown) => b.studentEyeContact,
    getDisplayPct: undefined,
  },
] as const;

/**
 * Per-component bars: each category shows its own 0–100% bar (sub-score).
 * Weight is labeled separately so "how well you did" vs "how much it counts" is clear.
 */
function ComponentBreakdown({
  breakdown,
  studentTalkRatio,
}: {
  breakdown: EngagementBreakdown;
  studentTalkRatio?: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-xs font-medium">
        How you scored in each category (weighted to get the total above)
      </p>
      <div className="space-y-3">
        {COMPONENT_CONFIG.map(
          ({ key, label, weight, color, getSubScore, getContribution, getDisplayPct }) => {
            const displayOverride = getDisplayPct?.(studentTalkRatio);
            const subScore = getSubScore(breakdown);
            const subPct =
              displayOverride !== undefined
                ? Math.round(Math.max(0, Math.min(100, displayOverride)))
                : Math.round(Math.max(0, Math.min(1, subScore)) * 100);
          const contribution = getContribution(breakdown);
          const contribPts = Math.round(contribution * 100);

          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">
                  {label}
                  <span className="text-gray-500 font-normal ml-1">
                    (worth {Math.round(weight * 100)}% of total)
                  </span>
                </span>
                <span className="text-gray-200 font-medium tabular-nums">
                  {subPct}% → +{contribPts} pts
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-md overflow-hidden">
                <div
                  className={`h-full transition-all rounded-md ${color}`}
                  style={{ width: `${subPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EngagementScore({
  engagementScore,
  engagementBreakdown,
  studentTalkRatio,
}: EngagementScoreProps) {
  const engagementPct = Math.round(engagementScore * 100);
  const engagementColor =
    engagementPct >= 70
      ? "text-green-400"
      : engagementPct >= 45
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <div className="text-center mb-4">
        <p className="text-gray-400 text-sm mb-2">Overall Engagement Score</p>
        <p className={`text-6xl font-bold ${engagementColor}`}>
          {engagementPct}
          <span className="text-3xl text-gray-500">%</span>
        </p>
      </div>
      {engagementBreakdown && (
        <div className="pt-4 border-t border-gray-800">
          <ComponentBreakdown
            breakdown={engagementBreakdown}
            studentTalkRatio={studentTalkRatio}
          />
        </div>
      )}
    </div>
  );
}
