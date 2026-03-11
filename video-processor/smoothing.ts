/**
 * Exponential Moving Average (EMA) smoother for eye contact scores.
 *
 * new_value = α * raw + (1 - α) * previous
 * α ≈ 0.55 — responsive to gaze changes within ~1–2 seconds
 */
export interface EmaSmootherOptions {
  alpha?: number; // smoothing factor [0, 1]; default 0.25
  missingStrategy?: "zero" | "last"; // what to emit when no face detected
}

export interface EmaSmoother {
  update(value: number | null): number;
  reset(): void;
  current(): number;
}

export function createEmaSmoother(options: EmaSmootherOptions = {}): EmaSmoother {
  const alpha = options.alpha ?? 0.25;
  const missingStrategy = options.missingStrategy ?? "last";
  let state: number | null = null;

  return {
    update(value: number | null): number {
      if (value === null) {
        // No face detected
        if (state === null) return 0;
        if (missingStrategy === "zero") {
          state = alpha * 0 + (1 - alpha) * state;
        }
        // "last" strategy: leave state unchanged
        return state;
      }

      if (state === null) {
        state = value;
      } else {
        state = alpha * value + (1 - alpha) * state;
      }
      return state;
    },

    reset() {
      state = null;
    },

    current(): number {
      return state ?? 0;
    },
  };
}
