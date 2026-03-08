import type { SessionMetrics } from "@/lib/session/metrics-schema";
import { aggregateSessionSummary, SessionSummary } from "./summary";
import { generateRecommendations, Recommendation } from "./recommendations";
import type { InterruptionStats } from "@/lib/audio/interruptions";
import type { InterruptionClassification } from "@/lib/audio/interruption-classification";

export interface SessionReport {
  sessionId: string;
  generatedAt: string;
  summary: SessionSummary;
  recommendations: Recommendation[];
}

/**
 * Generate a full session report from the metrics history.
 * Called on session end.
 *
 * @param interruptionData - optional interruption stats + classification (M8/M9)
 */
export function generateReport(
  sessionId: string,
  metricsHistory: SessionMetrics[],
  interruptionData?: (InterruptionStats & { classification: InterruptionClassification }) | null
): SessionReport {
  const summary = aggregateSessionSummary(sessionId, metricsHistory, interruptionData);
  const recommendations = generateRecommendations(summary);

  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    summary,
    recommendations,
  };
}
