"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReportData } from "@/hooks/useReportData";
import { formatDuration } from "@/lib/utils/format";
import { EngagementScore } from "@/components/report/EngagementScore";
import { ParticipationSection } from "@/components/report/ParticipationSection";
import { AttentionCyclesSection } from "@/components/report/AttentionCyclesSection";
import { TrendsSection } from "@/components/report/TrendsSection";
import { RecommendationsSection } from "@/components/report/RecommendationsSection";
import { InterruptionsSection } from "@/components/report/InterruptionsSection";
import { FlaggedMomentsSection } from "@/components/report/FlaggedMomentsSection";
import { DebugSection } from "@/components/report/DebugSection";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";

export default function ReportPage() {
  const router = useRouter();
  const { report, llmRecs, llmLoading, llmError, fetchLlmRecommendations } =
    useReportData();

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
  const isDebug = (report as { isDebug?: boolean }).isDebug ?? false;
  const metricsHistory =
    (report as { metricsHistory?: SessionMetrics[] }).metricsHistory ?? [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Session Report</h1>
          <p className="text-gray-400 text-sm">
            {formatDuration(summary.durationSec)} session ·{" "}
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>

        <EngagementScore
          engagementScore={summary.engagementScore}
          engagementBreakdown={summary.engagementBreakdown}
        />
        <ParticipationSection summary={summary} />
        <AttentionCyclesSection summary={summary} />
        <TrendsSection summary={summary} />
        <RecommendationsSection
          recommendations={recommendations}
          llmRecs={llmRecs}
          llmLoading={llmLoading}
          llmError={llmError}
          onFetchLlm={fetchLlmRecommendations}
        />
        <InterruptionsSection summary={summary} />
        <FlaggedMomentsSection flaggedMoments={flaggedMoments} />

        {isDebug && metricsHistory.length > 0 && (
          <DebugSection metricsHistory={metricsHistory} />
        )}

        <div className="flex gap-2">
          {isDebug && (
            <Link
              href="/debug"
              className="flex-1 py-3 bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 rounded-xl font-semibold transition-colors text-center"
            >
              Run Another Debug
            </Link>
          )}
          <button
            onClick={() => router.push("/")}
            className={`py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors ${
              isDebug ? "flex-1" : "w-full"
            }`}
          >
            Start New Session
          </button>
        </div>
      </div>
    </main>
  );
}
