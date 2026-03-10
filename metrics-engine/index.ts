/**
 * metrics-engine - Engagement metric calculations
 *
 * Talk time, interruptions, energy level, response latency, and metrics aggregation.
 */

export { validateMetrics, SessionMetricsSchema, ParticipantMetricsSchema } from "./metrics-schema";
export type { SessionMetrics, ParticipantMetrics } from "./metrics-schema";
export { createMetricsAggregator } from "./aggregator";
export type { MetricsAggregator } from "./aggregator";
export { createAudioPipeline } from "./audio/pipeline";
export type { AudioPipeline, AudioPipelineOutput } from "./audio/pipeline";
export { createTalkTimeAggregator } from "./audio/talk-time";
export type { TalkTimeAggregator, TalkTimeState, ParticipantRole } from "./audio/talk-time";
export { createInterruptionTracker, detectOverlaps } from "./audio/interruptions";
export type {
  InterruptionTracker,
  InterruptionStats,
  InterruptionEvent,
  InterruptionRole,
  VadSegment,
} from "./audio/interruptions";
export { createResponseLatencyTracker } from "./audio/response-latency";
export type { ResponseLatencyTracker, ResponseLatencyStats, TurnRecord } from "./audio/response-latency";
export { createMonologueTracker } from "./audio/monologue-length";
export type { MonologueTracker, MonologueStats } from "./audio/monologue-length";
export { classifyInterruptions, classifyInterruptionsWithContent } from "./audio/interruption-classification";
export type { InterruptionClassification, ClassificationConfig } from "./audio/interruption-classification";
export { classifyOverlapContent, summarizeTier2Classifications } from "./audio/interruption-transcription";
export type { Tier2Classification, ContentCategory, InterruptionProductivity } from "./audio/interruption-transcription";
export { computeRmsEnergy, createVoiceEnergyAnalyser } from "./audio/voice-energy";
export type { VoiceEnergyAnalyser } from "./audio/voice-energy";
export { combineEnergyScores, classifyEnergyLevel } from "./energy/energy-level";
export type { EnergyInputs, EnergyWeights, EnergyLevelCategory } from "./energy/energy-level";
