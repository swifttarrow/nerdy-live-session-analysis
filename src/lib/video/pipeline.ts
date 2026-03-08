import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { initFaceLandmarker, detectFace } from "./face-landmarker";
import { deriveGazeScore } from "./gaze";
import { createEmaSmoother, EmaSmoother } from "./smoothing";

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
}

/**
 * Create the video analysis pipeline.
 * Lazily initializes MediaPipe Face Landmarker on first use.
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

  // Kick off initialization immediately
  void initFaceLandmarker().then((l) => {
    landmarker = l;
  });

  return {
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

      const t0 = performance.now();

      const result = detectFace(landmarker, imageData, timestampMs);
      const rawScore = result ? deriveGazeScore(result) : null;
      const smoothed = smoothers[role].update(rawScore);
      scores[role] = smoothed;

      const latency = performance.now() - t0;
      if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        console.debug(`[video-pipeline] ${role} latency=${latency.toFixed(1)}ms score=${smoothed.toFixed(2)}`);
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
