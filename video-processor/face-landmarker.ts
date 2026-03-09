import {
  FaceLandmarker,
  FaceLandmarkerOptions,
  FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let landmarkerInstance: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;

const MODEL_URL =
  "/face_landmarker.task"; // served from public/ after setup

const CDN_FALLBACK =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const OPTIONS: FaceLandmarkerOptions = {
  baseOptions: {
    modelAssetPath: MODEL_URL,
    delegate: "GPU",
  },
  numFaces: 1,
  runningMode: "VIDEO",
  outputFaceBlendshapes: false,
  outputFacialTransformationMatrixes: true,
};

/**
 * Initialize MediaPipe Face Landmarker (singleton).
 * Falls back to CDN model if local file not found.
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerInstance) return landmarkerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // Try local model first, fall back to CDN
    let modelPath = MODEL_URL;
    try {
      const res = await fetch(MODEL_URL, { method: "HEAD" });
      if (!res.ok) modelPath = CDN_FALLBACK;
    } catch {
      modelPath = CDN_FALLBACK;
    }

    const opts: FaceLandmarkerOptions = {
      ...OPTIONS,
      baseOptions: { ...OPTIONS.baseOptions, modelAssetPath: modelPath },
    };

    landmarkerInstance = await FaceLandmarker.createFromOptions(vision, opts);
    return landmarkerInstance;
  })();

  return initPromise;
}

/**
 * Detect face landmarks from an ImageData frame.
 * Returns null if no face detected.
 */
export function detectFace(
  landmarker: FaceLandmarker,
  imageData: ImageData,
  timestampMs: number
): FaceLandmarkerResult | null {
  try {
    const result = landmarker.detectForVideo(imageData, timestampMs);
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      return null;
    }
    return result;
  } catch (err) {
    console.warn("Face detection error:", err);
    return null;
  }
}
