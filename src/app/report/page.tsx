"use client";

import { useRouter } from "next/navigation";
import { useReportData } from "@/hooks/useReportData";
import { formatDuration } from "@/lib/utils/format";
import { EngagementScore } from "@/components/report/EngagementScore";
import { KeyMetricsSection } from "@/components/report/KeyMetricsSection";
import { ParticipationSection } from "@/components/report/ParticipationSection";
import { AttentionCyclesSection } from "@/components/report/AttentionCyclesSection";
import { TrendsSection } from "@/components/report/TrendsSection";
import { RecommendationsSection } from "@/components/report/RecommendationsSection";
import { InterruptionsSection } from "@/components/report/InterruptionsSection";
import { FlaggedMomentsSection } from "@/components/report/FlaggedMomentsSection";

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

        <EngagementScore engagementScore={summary.engagementScore} />
        <KeyMetricsSection summary={summary} />
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
