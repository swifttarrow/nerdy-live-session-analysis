interface EngagementScoreProps {
  engagementScore: number;
}

export function EngagementScore({ engagementScore }: EngagementScoreProps) {
  const engagementPct = Math.round(engagementScore * 100);
  const engagementColor =
    engagementPct >= 70
      ? "text-green-400"
      : engagementPct >= 45
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4 text-center">
      <p className="text-gray-400 text-sm mb-2">Overall Engagement Score</p>
      <p className={`text-6xl font-bold ${engagementColor}`}>
        {engagementPct}
        <span className="text-3xl text-gray-500">%</span>
      </p>
    </div>
  );
}
