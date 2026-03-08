/**
 * M14: Labeled Test Clips validation.
 *
 * Runs pipeline logic on synthetic clip scenarios from labeled-clips.json
 * and asserts outputs are within tolerance of expected labels.
 *
 * Since we cannot process real video files in unit tests, we simulate
 * the pipeline by feeding synthetic metric histories that match each
 * clip's known setup.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { aggregateSessionSummary } from "@/lib/post-session/summary";
import { createDriftDetector } from "@/lib/video/attention-drift";
import { combineEnergyScores } from "@/lib/energy/energy-level";
import type { SessionMetrics } from "@/lib/session/metrics-schema";

// Load labeled clip metadata
const clipsPath = join(process.cwd(), "test/fixtures/labeled-clips.json");
const clipsData = JSON.parse(readFileSync(clipsPath, "utf-8"));

interface ClipLabel {
  id: string;
  description: string;
  durationSec: number;
  labels: {
    tutor: {
      expected_eye_contact: number;
      tolerance: number;
      expected_talk_time: number;
      talk_tolerance: number;
      expected_energy_level_min?: number;
      expected_energy_level_max?: number;
    };
    student: {
      expected_eye_contact: number;
      tolerance: number;
      expected_talk_time: number;
      talk_tolerance: number;
      expected_energy_level_min?: number;
      expected_energy_level_max?: number;
    };
  };
  expected_drift?: {
    student_drifting: boolean;
    drift_events_min: number;
  };
}

/**
 * Synthesize a metrics history from a clip label, simulating the pipeline
 * output for that scenario at 1-sample-per-second.
 */
function synthesizeHistory(clip: ClipLabel): SessionMetrics[] {
  const { durationSec, labels } = clip;
  return Array.from({ length: durationSec }, (_, i) => ({
    timestamp: new Date(Date.now() + i * 1000).toISOString(),
    session_id: clip.id,
    metrics: {
      tutor: {
        eye_contact_score: labels.tutor.expected_eye_contact,
        talk_time_percent: labels.tutor.expected_talk_time,
        current_speaking: labels.tutor.expected_talk_time > 0,
      },
      student: {
        eye_contact_score: labels.student.expected_eye_contact,
        talk_time_percent: labels.student.expected_talk_time,
        current_speaking: labels.student.expected_talk_time > 0,
      },
    },
  }));
}

describe("labeled clip validation", () => {
  const clips: ClipLabel[] = clipsData.clips;

  clips.forEach((clip) => {
    describe(`${clip.id}: ${clip.description}`, () => {
      it("aggregated metrics match labels within tolerance", () => {
        const history = synthesizeHistory(clip);
        const summary = aggregateSessionSummary(clip.id, history);

        // Verify eye contact within tolerance
        expect(
          Math.abs(summary.avgTutorEyeContact - clip.labels.tutor.expected_eye_contact)
        ).toBeLessThanOrEqual(clip.labels.tutor.tolerance);

        expect(
          Math.abs(summary.avgStudentEyeContact - clip.labels.student.expected_eye_contact)
        ).toBeLessThanOrEqual(clip.labels.student.tolerance);

        // Verify talk time within tolerance
        expect(
          Math.abs(summary.avgTutorTalkPercent - clip.labels.tutor.expected_talk_time)
        ).toBeLessThanOrEqual(clip.labels.tutor.talk_tolerance);

        expect(
          Math.abs(summary.avgStudentTalkPercent - clip.labels.student.expected_talk_time)
        ).toBeLessThanOrEqual(clip.labels.student.talk_tolerance);
      });

      it("engagement score is in valid range [0, 1]", () => {
        const history = synthesizeHistory(clip);
        const summary = aggregateSessionSummary(clip.id, history);
        expect(summary.engagementScore).toBeGreaterThanOrEqual(0);
        expect(summary.engagementScore).toBeLessThanOrEqual(1);
      });
    });
  });

  it("drift scenario (clip-06) produces student drift when eye contact is low sustained", () => {
    const driftClip = clips.find((c) => c.id === "clip-06")!;
    expect(driftClip).toBeDefined();

    const detector = createDriftDetector({ driftThresholdSec: 5, gazeAwayThreshold: 0.4 });
    // Simulate 30 seconds of low gaze (matching clip-06 student eye_contact ≈ 0.25)
    let driftDetected = false;
    for (let i = 0; i < driftClip.durationSec; i++) {
      if (detector.update(driftClip.labels.student.expected_eye_contact)) {
        driftDetected = true;
      }
    }
    expect(driftDetected).toBe(driftClip.expected_drift?.student_drifting ?? false);
  });

  it("energy clips produce scores within expected min/max bounds", () => {
    const highEnergyClip = clips.find((c) => c.id === "clip-07")!;
    const lowEnergyClip = clips.find((c) => c.id === "clip-08")!;

    // High energy: voice=0.8, expression=0.7 → combined ≈ 0.76
    const highEnergy = combineEnergyScores({ voiceEnergy: 0.8, expressionEnergy: 0.7 });
    const minHigh = highEnergyClip.labels.tutor.expected_energy_level_min ?? 0;
    expect(highEnergy).toBeGreaterThanOrEqual(minHigh);

    // Low energy: voice=0.15, expression=0.2 → combined ≈ 0.17
    const lowEnergy = combineEnergyScores({ voiceEnergy: 0.15, expressionEnergy: 0.2 });
    const maxLow = lowEnergyClip.labels.tutor.expected_energy_level_max ?? 1;
    expect(lowEnergy).toBeLessThanOrEqual(maxLow);
  });
});
