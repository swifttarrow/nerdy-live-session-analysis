import {
  FaceLandmarker,
  FaceLandmarkerOptions,
  FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

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

type LandmarkerInit = { vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>; modelPath: string };
let initPromise: Promise<LandmarkerInit> | null = null;

async function getLandmarkerInit(): Promise<LandmarkerInit> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    let modelPath = MODEL_URL;
    try {
      const res = await fetch(MODEL_URL, { method: "HEAD" });
      if (!res.ok) modelPath = CDN_FALLBACK;
    } catch {
      modelPath = CDN_FALLBACK;
    }
    return { vision, modelPath };
  })();
  return initPromise;
}

/**
 * Create a new Face Landmarker instance.
 * Each video stream (tutor, student) must use its own instance because
 * MediaPipe maintains temporal state in VIDEO mode—sharing one instance
 * corrupts detection when processing interleaved frames from two streams.
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  const { vision, modelPath } = await getLandmarkerInit();
  const opts: FaceLandmarkerOptions = {
    ...OPTIONS,
    baseOptions: { ...OPTIONS.baseOptions, modelAssetPath: modelPath },
  };
  return FaceLandmarker.createFromOptions(vision, opts);
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
