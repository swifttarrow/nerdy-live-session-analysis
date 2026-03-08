"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionReport } from "@/lib/post-session/report";

function MetricBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-medium">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<SessionReport | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("sessionlens-report");
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch {
        console.warn("Could not parse session report");
      }
    }
  }, []);

  if (!report) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No session report found.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Start a new session
          </button>
        </div>
      </main>
    );
  }

  const { summary, recommendations } = report;

  const engagementPct = Math.round(summary.engagementScore * 100);
  const engagementColor =
    engagementPct >= 70 ? "text-green-400" :
    engagementPct >= 45 ? "text-yellow-400" :
    "text-red-400";

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Session Report</h1>
          <p className="text-gray-400 text-sm">
            {formatDuration(summary.durationSec)} session ·{" "}
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Engagement score */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4 text-center">
          <p className="text-gray-400 text-sm mb-2">Overall Engagement Score</p>
          <p className={`text-6xl font-bold ${engagementColor}`}>
            {engagementPct}
            <span className="text-3xl text-gray-500">%</span>
          </p>
        </div>

        {/* Key metrics */}
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
              <span className={`font-semibold ${summary.studentTalkRatio >= 0.35 ? "text-green-400" : "text-yellow-400"}`}>
                {Math.round(summary.studentTalkRatio * 100)}%
                {summary.studentTalkRatio >= 0.35 ? " ✓" : " (target: ≥35%)"}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Recommendations</h2>
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border-l-4 ${
                rec.priority === "high"
                  ? "bg-red-950/30 border-red-500"
                  : rec.priority === "medium"
                  ? "bg-yellow-950/30 border-yellow-500"
                  : "bg-green-950/30 border-green-500"
              }`}
            >
              <p className="text-sm text-gray-200">{rec.text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors"
        >
          Start New Session
        </button>
      </div>
    </main>
  );
}
