import { MetricBar } from "./MetricBar";
import type { SessionSummary } from "@/lib/post-session/summary";

interface KeyMetricsSectionProps {
  summary: SessionSummary;
}

export function KeyMetricsSection({ summary }: KeyMetricsSectionProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4 space-y-4">
      <h2 className="text-lg font-semibold">Key Metrics</h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Tutor</p>
          <MetricBar label="Eye Contact" value={summary.avgTutorEyeContact} />
          <MetricBar label="Talk Time" value={summary.avgTutorTalkPercent} />
        </div>
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Student</p>
          <MetricBar label="Eye Contact" value={summary.avgStudentEyeContact} />
          <MetricBar label="Talk Time" value={summary.avgStudentTalkPercent} />
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Student talk ratio</span>
          <span
            className={`font-semibold ${
              summary.studentTalkRatio >= 0.35 ? "text-green-400" : "text-yellow-400"
            }`}
          >
            {Math.round(summary.studentTalkRatio * 100)}%
            {summary.studentTalkRatio >= 0.35 ? " ✓" : " (target: ≥35%)"}
          </span>
        </div>
      </div>

      {summary.avgResponseLatencyMs !== undefined && (
        <div className="pt-2 border-t border-gray-800">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Avg response latency</span>
            <span className="font-semibold text-white">
              {(summary.avgResponseLatencyMs / 1000).toFixed(1)}s
              {summary.hesitationCount !== undefined &&
                summary.hesitationCount > 0 && (
                  <span className="text-yellow-400 ml-2">
                    ({summary.hesitationCount} hesitations)
                  </span>
                )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
