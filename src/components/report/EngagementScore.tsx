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

function BreakdownBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
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
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <p className="text-gray-400 text-xs font-medium mb-2">
            Score breakdown (weighted components)
          </p>
          <BreakdownBar
            label="Talk balance (40%)"
            value={engagementBreakdown.talkBalance / 0.4}
            color="bg-cyan-500"
          />
          <BreakdownBar
            label="Tutor eye contact (20%)"
            value={engagementBreakdown.tutorEyeContact / 0.2}
            color="bg-amber-500"
          />
          <BreakdownBar
            label="Student eye contact (40%)"
            value={engagementBreakdown.studentEyeContact / 0.4}
            color="bg-emerald-500"
          />
        </div>
      )}
    </div>
  );
}
