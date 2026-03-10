export interface EngagementBreakdown {
  talkBalance: number;
  tutorEyeContact: number;
  studentEyeContact: number;
}

interface EngagementScoreProps {
  engagementScore: number;
  /** Component breakdown for chart (40% talk balance, 20% tutor eye contact, 40% student eye contact) */
  engagementBreakdown?: EngagementBreakdown;
}

const COMPONENT_CONFIG = [
  {
    key: "talkBalance" as const,
    label: "Talk balance",
    weight: "40%",
    color: "bg-cyan-500",
    getValue: (b: EngagementBreakdown) => b.talkBalance / 0.4,
    getContribution: (b: EngagementBreakdown) => b.talkBalance,
  },
  {
    key: "tutorEyeContact" as const,
    label: "Tutor eye contact",
    weight: "20%",
    color: "bg-amber-500",
    getValue: (b: EngagementBreakdown) => b.tutorEyeContact / 0.2,
    getContribution: (b: EngagementBreakdown) => b.tutorEyeContact,
  },
  {
    key: "studentEyeContact" as const,
    label: "Student eye contact",
    weight: "40%",
    color: "bg-emerald-500",
    getValue: (b: EngagementBreakdown) => b.studentEyeContact / 0.4,
    getContribution: (b: EngagementBreakdown) => b.studentEyeContact,
  },
] as const;

function StackedBreakdownBar({ breakdown }: { breakdown: EngagementBreakdown }) {
  const segments = COMPONENT_CONFIG.map((cfg) => ({
    ...cfg,
    contribution: cfg.getContribution(breakdown),
  }));

  return (
    <div className="space-y-2">
      <p className="text-gray-400 text-xs font-medium">
        Score breakdown by category
      </p>
      <div className="h-4 bg-gray-800 rounded-lg overflow-hidden flex">
        {segments.map(({ key, contribution, color }) => {
          const pct = Math.max(0, Math.min(100, contribution * 100));
          return (
            <div
              key={key}
              className={`h-full transition-all ${color} first:rounded-l-md last:rounded-r-md`}
              style={{ width: `${pct}%` }}
              title={`${Math.round(contribution * 100)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map(({ label, weight, color, getValue }) => {
          const score = Math.round(getValue(breakdown) * 100);
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              <span className="text-gray-400">{label} ({weight}):</span>
              <span className="text-gray-200 font-medium">{score}%</span>
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
          <StackedBreakdownBar breakdown={engagementBreakdown} />
        </div>
      )}
    </div>
  );
}
