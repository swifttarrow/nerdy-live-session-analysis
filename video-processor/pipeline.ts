import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { initFaceLandmarker, detectFace } from "./face-landmarker";
import { deriveGazeScore } from "./gaze";
import { createEmaSmoother, EmaSmoother } from "./smoothing";
import {
  detectEmotion,
  computeEmotionScores,
  ZERO_EMOTION_SCORES,
  type EmotionalState,
  type EmotionScores,
} from "./emotion-detection";
import { createPipelineLatencyTracker, PipelineLatencyTracker } from "@/lib/latency/timing";

export type StreamRole = "tutor" | "student";

export interface VideoPipelineOutput {
  tutor: { eyeContactScore: number };
  student: { eyeContactScore: number; emotionalState?: EmotionalState };
}

export type VideoQualityStatus = "good" | "low";

export interface VideoQualityState {
  tutor: VideoQualityStatus;
  student: VideoQualityStatus;
}

export interface VideoPipeline {
  /**
   * Process one frame for a given stream role.
   * Returns the smoothed eye contact score, or null if not yet ready.
   */
  processFrame(role: StreamRole, imageData: ImageData, timestampMs: number): number | null;
  getLatestScores(): VideoPipelineOutput;
  /** Student's current emotional state (tired, frustrated, defeated, neutral) */
  getStudentEmotionalState(): EmotionalState;
  /** Raw emotion scores [0,1] contributing to emotional state (for debug) */
  getStudentEmotionScores(): EmotionScores;
  /** Face detection success rate over rolling window; surfaces poor video quality */
  getQualityStatus(): VideoQualityState;
  /** M15: access latency tracker for instrumentation data */
  latency: PipelineLatencyTracker;
}

/**
 * Create the video analysis pipeline.
 * Lazily initializes MediaPipe Face Landmarker on first use.
 * Instruments per-stage latency via PipelineLatencyTracker.
 */
export function createVideoPipeline(): VideoPipeline {
  const landmarkers: Record<StreamRole, FaceLandmarker | null> = {
    tutor: null,
    student: null,
  };
  let initInProgress = false;

  const smoothers: Record<StreamRole, EmaSmoother> = {
    tutor: createEmaSmoother({ alpha: 0.55, missingStrategy: "zero" }),
    student: createEmaSmoother({ alpha: 0.55, missingStrategy: "zero" }),
  };

  const scores: Record<StreamRole, number> = {
    tutor: 0,
    student: 0,
  };

  let studentEmotionalState: EmotionalState = "neutral";
  let studentEmotionScores: EmotionScores = { ...ZERO_EMOTION_SCORES };

  const FACE_DETECT_WINDOW = 30; // ~6 s at 5 FPS
  const LOW_QUALITY_THRESHOLD = 0.5; // <50% face detection → low
  const faceDetectRecent: Record<StreamRole, boolean[]> = {
    tutor: [],
    student: [],
  };

  const latencyTracker = createPipelineLatencyTracker();

  function ensureLandmarker(role: StreamRole) {
    if (landmarkers[role]) return;
    if (!initInProgress) {
      initInProgress = true;
      void Promise.all([
        initFaceLandmarker().then((l) => { landmarkers.tutor = l; }),
        initFaceLandmarker().then((l) => { landmarkers.student = l; }),
      ]).catch(() => {});
    }
  }

  // Kick off initialization immediately
  ensureLandmarker("tutor");
  ensureLandmarker("student");

  return {
    latency: latencyTracker,

    processFrame(role: StreamRole, imageData: ImageData, timestampMs: number): number | null {
      const landmarker = landmarkers[role];
      if (!landmarker) {
        ensureLandmarker(role);
        return null; // not ready yet
      }

      // --- Stage: frame_capture (represents start of processing this frame) ---
      const endCapture = latencyTracker.startStage("frame_capture");
      endCapture(); // frame is already in memory; just mark the timestamp boundary

      // --- Stage: mediapipe (face detection) ---
      const endMediapipe = latencyTracker.startStage("mediapipe");
      const result = detectFace(landmarker, imageData, timestampMs);
      endMediapipe();

      // Track face detection success for video quality indicator
      const arr = faceDetectRecent[role];
      arr.push(result !== null);
      if (arr.length > FACE_DETECT_WINDOW) arr.shift();

      // --- Stage: gaze (score derivation) ---
      const endGaze = latencyTracker.startStage("gaze");
      const rawScore = result ? deriveGazeScore(result) : null;
      endGaze();

      // --- Stage: smoothing ---
      const endSmoothing = latencyTracker.startStage("smoothing");
      const smoothed = smoothers[role].update(rawScore);
      scores[role] = smoothed;
      endSmoothing();

      // --- Emotion detection (student only) ---
      const landmarks = result?.faceLandmarks?.[0];
      if (role === "student") {
        if (result && landmarks && landmarks.length >= 478) {
          studentEmotionScores = computeEmotionScores(landmarks);
          studentEmotionalState = detectEmotion(result);
        } else {
          // No face detected (e.g. head in hands, turned away) → reset to neutral
          studentEmotionalState = "neutral";
        }
      }

      // --- Stage: metrics_emit (marks frame complete) ---
      const endEmit = latencyTracker.startStage("metrics_emit");
      endEmit();

      if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        const gazeStat = latencyTracker.getStageStats("mediapipe");
        console.debug(
          `[video-pipeline] ${role} mediapipe p50=${gazeStat.p50.toFixed(1)}ms score=${smoothed.toFixed(2)}`
        );
      }

      return smoothed;
    },

    getLatestScores(): VideoPipelineOutput {
      return {
        tutor: { eyeContactScore: scores.tutor },
        student: { eyeContactScore: scores.student, emotionalState: studentEmotionalState },
      };
    },

    getStudentEmotionalState(): EmotionalState {
      return studentEmotionalState;
    },

    getStudentEmotionScores(): EmotionScores {
      return { ...studentEmotionScores };
    },

    getQualityStatus(): VideoQualityState {
      const status = (r: StreamRole): VideoQualityStatus => {
        const arr = faceDetectRecent[r];
        if (arr.length < 10) return "good"; // not enough samples
        const rate = arr.filter(Boolean).length / arr.length;
        return rate >= LOW_QUALITY_THRESHOLD ? "good" : "low";
      };
      return { tutor: status("tutor"), student: status("student") };
    },
  };
}
