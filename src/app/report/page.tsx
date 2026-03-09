"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionReport } from "@/lib/post-session/report";
import type { Recommendation } from "@/lib/post-session/recommendations";
import { formatOffset } from "@/lib/post-session/flagged-moments";
import { participationDescription } from "@/lib/post-session/participation";

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
  const [llmRecs, setLlmRecs] = useState<Recommendation[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

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

  async function fetchLlmRecommendations() {
    if (!report) return;
    setLlmLoading(true);
    setLlmError(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report.summary),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLlmRecs(data.recommendations ?? []);
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : "Failed to fetch recommendations");
    } finally {
      setLlmLoading(false);
    }
  }

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

  const { summary, recommendations, flaggedMoments } = report;

  const engagementPct = Math.round(summary.engagementScore * 100);
  const engagementColor =
    engagementPct >= 70 ? "text-green-400" :
    engagementPct >= 45 ? "text-yellow-400" :
    "text-red-400";

  const participationBadgeColor =
    summary.participationLabel === "engaged"
      ? "bg-green-900/50 text-green-300 border border-green-700"
      : summary.participationLabel === "moderate"
      ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
      : "bg-red-900/50 text-red-300 border border-red-700";

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

          {/* M21: Response latency */}
          {summary.avgResponseLatencyMs !== undefined && (
            <div className="pt-2 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Avg response latency</span>
                <span className="font-semibold text-white">
                  {(summary.avgResponseLatencyMs / 1000).toFixed(1)}s
                  {summary.hesitationCount !== undefined && summary.hesitationCount > 0 && (
                    <span className="text-yellow-400 ml-2">({summary.hesitationCount} hesitations)</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* M22: Participation label */}
        {summary.participationLabel && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Participation</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${participationBadgeColor}`}>
                {summary.participationLabel}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {summary.participationDescription ??
                participationDescription(summary.participationLabel)}
            </p>
          </div>
        )}

        {/* M23: Attention cycles */}
        {summary.attentionCycles && summary.attentionCycles.segments.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3">Attention Cycles</h2>
            {summary.attentionCycles.pattern && (
              <p className="text-yellow-400 text-sm mb-3 italic">
                {summary.attentionCycles.pattern}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="text-left pb-2">Segment</th>
                    <th className="text-right pb-2">Tutor Eye Contact</th>
                    <th className="text-right pb-2">Student Eye Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.attentionCycles.segments.map((seg) => (
                    <tr key={seg.label} className="border-b border-gray-800/50">
                      <td className="py-2 text-gray-300">{seg.label}</td>
                      <td className="py-2 text-right font-medium">
                        {Math.round(seg.tutorEyeContact * 100)}%
                      </td>
                      <td className={`py-2 text-right font-medium ${
                        seg.studentEyeContact >= 0.5 ? "text-green-400" : seg.studentEyeContact >= 0.3 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {Math.round(seg.studentEyeContact * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* M24: Session trends */}
        {summary.trends && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Session Trends</h2>
              <span className={`text-sm font-medium ${
                summary.trends.summary.startsWith("Improving") ? "text-green-400" :
                summary.trends.summary.startsWith("Declining") ? "text-red-400" :
                "text-gray-400"
              }`}>
                {summary.trends.summary}
              </span>
            </div>
            <div className="space-y-2">
              {summary.trends.trends.map((trend) => (
                <div key={trend.metric} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{trend.metric}</span>
                  <span className={`font-medium ${
                    trend.direction === "up" ? "text-green-400" :
                    trend.direction === "down" ? "text-red-400" :
                    "text-gray-400"
                  }`}>
                    {trend.direction === "up" ? "+" : trend.direction === "down" ? "" : ""}
                    {trend.changePercent}%
                    {trend.direction === "up" ? " ↑" : trend.direction === "down" ? " ↓" : " →"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4 space-y-4">
          <h2 className="text-lg font-semibold">Recommendations</h2>
          {(llmRecs.length > 0 ? llmRecs : recommendations).map((rec, i) => (
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

          {/* M26: LLM recommendations button */}
          {llmRecs.length === 0 && (
            <button
              onClick={fetchLlmRecommendations}
              disabled={llmLoading}
              className="w-full py-2 mt-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-sm rounded-xl transition-colors font-medium"
            >
              {llmLoading ? "Getting personalized recommendations..." : "Get AI-Personalized Recommendations"}
            </button>
          )}
          {llmError && (
            <p className="text-red-400 text-xs mt-1">Could not fetch AI recommendations: {llmError}</p>
          )}
        </div>

        {/* Interruptions */}
        {summary.interruptions && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-4 space-y-3">
            <h2 className="text-lg font-semibold">Interruptions</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-950/40 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-400">
                  {summary.interruptions.classification.productive}
                </p>
                <p className="text-xs text-gray-400 mt-1">Productive</p>
                <p className="text-xs text-gray-500">student → tutor</p>
              </div>
              <div className="bg-gray-800/60 rounded-xl p-3">
                <p className="text-2xl font-bold text-gray-300">
                  {summary.interruptions.classification.neutral}
                </p>
                <p className="text-xs text-gray-400 mt-1">Neutral</p>
              </div>
              <div className="bg-red-950/40 rounded-xl p-3">
                <p className="text-2xl font-bold text-red-400">
                  {summary.interruptions.classification.unproductive}
                </p>
                <p className="text-xs text-gray-400 mt-1">Unproductive</p>
                <p className="text-xs text-gray-500">tutor → student</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Total overlaps: {summary.interruptions.totalOverlaps}
            </p>
          </div>
        )}

        {/* M25: Flagged moments */}
        {flaggedMoments && flaggedMoments.length > 0 && (
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
                    <span className={`text-xs capitalize ${
                      moment.severity === "alert" ? "text-red-400" :
                      moment.severity === "warning" ? "text-yellow-400" :
                      "text-gray-400"
                    }`}>
                      {moment.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
