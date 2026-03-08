import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { initFaceLandmarker, detectFace } from "./face-landmarker";
import { deriveGazeScore } from "./gaze";
import { createEmaSmoother, EmaSmoother } from "./smoothing";
import { createPipelineLatencyTracker, PipelineLatencyTracker } from "@/lib/latency/timing";

export type StreamRole = "tutor" | "student";

export interface VideoPipelineOutput {
  tutor: { eyeContactScore: number };
  student: { eyeContactScore: number };
}

export interface VideoPipeline {
  /**
   * Process one frame for a given stream role.
   * Returns the smoothed eye contact score, or null if not yet ready.
   */
  processFrame(role: StreamRole, imageData: ImageData, timestampMs: number): number | null;
  getLatestScores(): VideoPipelineOutput;
  /** M15: access latency tracker for instrumentation data */
  latency: PipelineLatencyTracker;
}

/**
 * Create the video analysis pipeline.
 * Lazily initializes MediaPipe Face Landmarker on first use.
 * Instruments per-stage latency via PipelineLatencyTracker.
 */
export function createVideoPipeline(): VideoPipeline {
  let landmarker: FaceLandmarker | null = null;
  let initInProgress = false;

  const smoothers: Record<StreamRole, EmaSmoother> = {
    tutor: createEmaSmoother({ alpha: 0.25 }),
    student: createEmaSmoother({ alpha: 0.25 }),
  };

  const scores: Record<StreamRole, number> = {
    tutor: 0,
    student: 0,
  };

  const latencyTracker = createPipelineLatencyTracker();

  // Kick off initialization immediately
  void initFaceLandmarker().then((l) => {
    landmarker = l;
  });

  return {
    latency: latencyTracker,

    processFrame(role: StreamRole, imageData: ImageData, timestampMs: number): number | null {
      if (!landmarker) {
        if (!initInProgress) {
          initInProgress = true;
          void initFaceLandmarker().then((l) => {
            landmarker = l;
          });
        }
        return null; // not ready yet
      }

      // --- Stage: frame_capture (represents start of processing this frame) ---
      const endCapture = latencyTracker.startStage("frame_capture");
      endCapture(); // frame is already in memory; just mark the timestamp boundary

      // --- Stage: mediapipe (face detection) ---
      const endMediapipe = latencyTracker.startStage("mediapipe");
      const result = detectFace(landmarker, imageData, timestampMs);
      endMediapipe();

      // --- Stage: gaze (score derivation) ---
      const endGaze = latencyTracker.startStage("gaze");
      const rawScore = result ? deriveGazeScore(result) : null;
      endGaze();

      // --- Stage: smoothing ---
      const endSmoothing = latencyTracker.startStage("smoothing");
      const smoothed = smoothers[role].update(rawScore);
      scores[role] = smoothed;
      endSmoothing();

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
        student: { eyeContactScore: scores.student },
      };
    },
  };
}
