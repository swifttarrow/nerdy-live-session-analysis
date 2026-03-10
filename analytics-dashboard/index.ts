/**
 * analytics-dashboard - Post-session reporting
 *
 * Session summary, recommendations, flagged moments, trends, and attention cycles.
 */

export { generateReport } from "./report";
export type { SessionReport, GenerateReportOptions } from "./report";
export { aggregateSessionSummary } from "./summary";
export type { SessionSummary } from "./summary";
export { generateRecommendations } from "./recommendations";
export type { Recommendation } from "./recommendations";
export { buildFlaggedMoments, formatOffset } from "./flagged-moments";
export type { FlaggedMoment } from "./flagged-moments";
export { computeTrends } from "./trends";
export type { SessionTrends, MetricTrend, TrendDirection } from "./trends";
export { segmentAttention, detectDriftPattern } from "./attention-cycles";
export type { AttentionCycles, AttentionSegment } from "./attention-cycles";
export { classifyParticipation, participationDescription } from "./participation";
export type { ParticipationLabel, ParticipationThresholds } from "./participation";
export { computeTalkBalanceScore, TALK_BALANCE_CENTER } from "./talk-balance";
export { SessionSummarySchema } from "./summary-schema";
export type { SessionSummaryInput } from "./summary-schema";
