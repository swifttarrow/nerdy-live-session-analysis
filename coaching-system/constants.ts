/**
 * Shared constants for the coaching system.
 */

/** Storage keys (localStorage / sessionStorage) */
export const STORAGE_KEYS = {
  SENSITIVITY: "sessionlens-sensitivity",
  PRESET: "sessionlens-preset",
} as const;

/** Sensitivity slider percent boundaries: 0–33 low, 34–66 medium, 67–100 high */
export const SENSITIVITY_PERCENT_BOUNDARIES = {
  LOW_MAX: 33,
  MEDIUM_MAX: 66,
} as const;

/** Migration values when upgrading from legacy string storage to percent */
export const SENSITIVITY_MIGRATE_PERCENT = {
  LOW: 16,
  MEDIUM: 50,
  HIGH: 84,
} as const;

/** Default sensitivity when no stored value */
export const DEFAULT_SENSITIVITY_PERCENT = 50;

/** Default preset when no stored value */
export const DEFAULT_SESSION_PRESET = "socratic" as const;
