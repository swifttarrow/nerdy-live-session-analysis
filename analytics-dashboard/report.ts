import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import { aggregateSessionSummary, SessionSummary } from "./summary";
import { generateRecommendations, Recommendation } from "./recommendations";
import type { InterruptionStats } from "@metrics-engine/audio/interruptions";
import type { InterruptionClassification } from "@metrics-engine/audio/interruption-classification";
import { buildFlaggedMoments, type FlaggedMoment } from "./flagged-moments";
import type { NudgeEvent } from "@coaching-system/engine";
import type { SessionTrends } from "./trends";

export interface SessionReport {
  sessionId: string;
  generatedAt: string;
  summary: SessionSummary;
  recommendations: Recommendation[];
  flaggedMoments: FlaggedMoment[];
}

export interface GenerateReportOptions {
  nudgeEvents?: NudgeEvent[];
  sessionStartMs?: number;
  trends?: SessionTrends;
}

/**
 * Generate a full session report from the metrics history.
 * Called on session end.
 *
 * @param interruptionData - optional interruption stats + classification (M8/M9)
 * @param options - optional M21-M25 data (nudges, latency, trends)
 */
export function generateReport(
  sessionId: string,
  metricsHistory: SessionMetrics[],
  interruptionData?: (InterruptionStats & { classification: InterruptionClassification }) | null,
  options?: GenerateReportOptions
): SessionReport {
  const summary = aggregateSessionSummary(sessionId, metricsHistory, interruptionData);

  // Attach M21 latency stats if provided
  if (options?.nudgeEvents !== undefined && options.nudgeEvents.length > 0) {
    // avgResponseLatencyMs and hesitationCount are set by caller if available
  }

  // Attach M24 trends if provided
  if (options?.trends) {
    summary.trends = options.trends;
  }

  const recommendations = generateRecommendations(summary);

  // M25: Build flagged moments from nudge events
  const flaggedMoments = options?.nudgeEvents
    ? buildFlaggedMoments(options.nudgeEvents, options.sessionStartMs ?? Date.now())
    : [];

  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    summary,
    recommendations,
    flaggedMoments,
  };
}
