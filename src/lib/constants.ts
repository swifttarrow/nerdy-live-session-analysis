/**
 * Centralized constants for API paths, HTTP status codes, storage keys, and defaults.
 */

/** API route paths */
export const API_PATHS = {
  TOKEN: "/api/token",
  ROOM_STATUS: "/api/room/status",
  RECOMMENDATIONS: "/api/recommendations",
  TRANSCRIBE: "/api/transcribe",
  CLASSIFY_KUDOS: "/api/classify-kudos",
} as const;

/** Common HTTP status codes */
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/** SessionStorage / localStorage keys */
export const STORAGE_KEYS = {
  REPORT: "sessionlens-report",
  HISTORY: "sessionlens-history",
  SENSITIVITY: "sessionlens-sensitivity",
  PRESET: "sessionlens-preset",
} as const;

/** Default values */
export const DEFAULTS = {
  ROOM_NAME: "sessionlens-demo",
  TOKEN_TTL: "4h",
} as const;

/** Grace period (ms) at session start during which nudges are neither shown nor captured */
export const NUDGE_GRACE_PERIOD_MS = 30_000;

/** Debug / polling intervals (ms) */
export const INTERVALS = {
  DEBUG_POLL_MS: 500,
  RESPONSE_LATENCY_STATS_WINDOW_MS: 5000,
  /** Rolling window for talk ratio and turn-taking (3 min) */
  ROLLING_TALK_WINDOW_MS: 180_000,
} as const;

/** Video element inline styles for LiveKit tracks */
export const VIDEO_ELEMENT_STYLES =
  "width:100%;height:100%;object-fit:cover;border-radius:0.5rem;";

/** Score thresholds for MetricsDisplay (0–100 scale). Aligned with EyeContactOverlay for consistent green/amber/red. */
export const SCORE_THRESHOLDS = {
  GOOD: 60,
  FAIR: 35,
  STUDENT_TALK_RATIO_GOOD: 35,
} as const;

/** Pipeline latency (ms) above which to show warning in debug panel */
export const PIPELINE_LATENCY_WARNING_MS = 200;

/** Time units for formatting */
export const TIME_UNITS = {
  MS_PER_SEC: 1000,
  SEC_PER_MIN: 60,
} as const;
