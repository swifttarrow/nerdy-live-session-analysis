/**
 * video-processor - Real-time video analysis pipeline
 *
 * Face detection, gaze estimation, expression analysis, and attention drift.
 */

export { createVideoPipeline } from "./pipeline";
export { initFaceLandmarker, detectFace } from "./face-landmarker";
export { deriveGazeScore } from "./gaze";
export { createEmaSmoother } from "./smoothing";
export { createFrameSampler } from "./frame-sampler";
export { createDriftDetector } from "./attention-drift";
export { computeExpressionEnergy } from "./facial-expression";
export { detectEmotion, computeEmotionScores } from "./emotion-detection";

export type {
  VideoPipeline,
  VideoPipelineOutput,
  VideoQualityState,
  VideoQualityStatus,
  StreamRole,
} from "./pipeline";
export type { FrameSampler, FrameCallback } from "./frame-sampler";
export type { DriftDetector, DriftDetectorOptions, DriftDetectorState } from "./attention-drift";
export type { EmaSmoother, EmaSmootherOptions } from "./smoothing";
export type { EmotionalState, EmotionScores } from "./emotion-detection";
