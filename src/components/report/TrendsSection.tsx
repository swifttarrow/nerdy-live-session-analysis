import type { SessionSummary } from "@/lib/post-session/summary";

interface TrendsSectionProps {
  summary: SessionSummary;
}

export function TrendsSection({ summary }: TrendsSectionProps) {
  const trends = summary.trends;
  if (!trends) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Session Trends</h2>
        <span
          className={`text-sm font-medium ${
            trends.summary.startsWith("Improving")
              ? "text-green-400"
              : trends.summary.startsWith("Declining")
                ? "text-red-400"
                : "text-gray-400"
          }`}
        >
          {trends.summary}
        </span>
      </div>
      <div className="space-y-2">
        {trends.trends.map((trend) => (
          <div
            key={trend.metric}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-300">{trend.metric}</span>
            <span
              className={`font-medium ${
                trend.direction === "up"
                  ? "text-green-400"
                  : trend.direction === "down"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "" : ""}
              {trend.changePercent}%
              {trend.direction === "up"
                ? " ↑"
                : trend.direction === "down"
                  ? " ↓"
                  : " →"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
