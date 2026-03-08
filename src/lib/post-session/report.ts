import type { SessionMetrics } from "@/lib/session/metrics-schema";
import { aggregateSessionSummary, SessionSummary } from "./summary";
import { generateRecommendations, Recommendation } from "./recommendations";

export interface SessionReport {
  sessionId: string;
  generatedAt: string;
  summary: SessionSummary;
  recommendations: Recommendation[];
}

/**
 * Generate a full session report from the metrics history.
 * Called on session end.
 */
export function generateReport(
  sessionId: string,
  metricsHistory: SessionMetrics[]
): SessionReport {
  const summary = aggregateSessionSummary(sessionId, metricsHistory);
  const recommendations = generateRecommendations(summary);

  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    summary,
    recommendations,
  };
}
