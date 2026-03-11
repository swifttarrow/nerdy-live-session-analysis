import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const FIXTURES_DIR = path.resolve(process.cwd(), "e2e", "fixtures", "videos");
const STORAGE_KEY_REPORT = "sessionlens-report";

/** Max wait for video to play through and auto-navigate to report (seconds). Increase if clips are longer. */
const VIDEO_END_TIMEOUT_MS =
  (parseInt(process.env.E2E_VIDEO_DURATION_SEC ?? "90", 10) + 30) * 1000;

function findVideo(name: string): string | null {
  const exts = [".mp4", ".webm"];
  for (const ext of exts) {
    const p = path.join(FIXTURES_DIR, `${name}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function videosExist(): boolean {
  return findVideo("tutor") !== null && findVideo("student") !== null;
}

function getVideoPaths(): { tutor: string; student: string } {
  const tutor = findVideo("tutor");
  const student = findVideo("student");
  if (!tutor || !student)
    throw new Error("Add tutor and student videos to e2e/fixtures/videos/");
  return { tutor, student };
}

/** Assert a value is within [min, max] (inclusive). */
function assertInBand(
  value: number,
  min: number,
  max: number,
  label: string
): void {
  expect(value, `${label} should be in [${min}, ${max}]`).toBeGreaterThanOrEqual(
    min
  );
  expect(value, `${label} should be in [${min}, ${max}]`).toBeLessThanOrEqual(
    max
  );
}

test.describe("Debug path", () => {
  test("full flow: upload → play through → report with metrics", async ({
    page,
  }) => {
    test.setTimeout(VIDEO_END_TIMEOUT_MS + 60_000);
    test.skip(
      !videosExist(),
      "Add tutor and student videos (.mp4 or .webm) to e2e/fixtures/videos/"
    );

    const { tutor, student } = getVideoPaths();
    const tutorInput = page.locator(
      'div:has(> label:has-text("Teacher video")) input[type="file"]'
    );
    const studentInput = page.locator(
      'div:has(> label:has-text("Student video")) input[type="file"]'
    );

    // ─── 1. Upload UI ─────────────────────────────────────────────────────
    await page.goto("/debug");
    await expect(page.getByText("SessionLens Debug")).toBeVisible();
    await expect(page.getByText("Video replay mode")).toBeVisible();
    await expect(page.getByText("Upload pre-recorded videos")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start Session" })
    ).toBeDisabled();

    // ─── 2. Upload both videos ─────────────────────────────────────────────
    await tutorInput.setInputFiles(tutor);
    await studentInput.setInputFiles(student);
    await expect(
      page.getByRole("button", { name: "Start Session" })
    ).toBeEnabled();

    // ─── 3. Start session ────────────────────────────────────────────────
    await page.getByRole("button", { name: "Start Session" }).click();

    // ─── 4. Wait for playing (MediaPipe + VAD load) ───────────────────────
    await expect(page.getByText("playing", { exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("Teacher")).toBeVisible();
    await expect(page.getByText("Student")).toBeVisible();

    // ─── 5. Wait for slider to advance (proves video is playing) ───────────
    await page.waitForFunction(
      () => {
        const slider = document.querySelector('input[type="range"]');
        return slider != null && parseFloat((slider as HTMLInputElement).value) > 0;
      },
      { timeout: 15_000 }
    );

    // ─── 6. Let video play through (auto-ends when both videos end) ─────────
    // Wait for navigation. If videos are throttled and never finish, click End Session.
    try {
      await expect(page).toHaveURL(/\/report/, {
        timeout: VIDEO_END_TIMEOUT_MS,
      });
    } catch {
      await page.getByRole("button", { name: "End Session" }).click();
      await expect(page).toHaveURL(/\/report/, { timeout: 10_000 });
    }

    // ─── 7. Report page visible ────────────────────────────────────────────
    await expect(page.getByRole("heading", { name: "Session Report" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Run Another Debug" })).toBeVisible();

    // ─── 8. Verify metrics from report (within bands) ──────────────────────
    const report = await page.evaluate((key) => {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, STORAGE_KEY_REPORT);

    expect(report, "Report should exist in sessionStorage").toBeTruthy();
    const { summary } = report;

    expect(summary.durationSec, "Session should have positive duration").toBeGreaterThan(0);
    expect(summary.sampleCount, "Should have captured metrics samples").toBeGreaterThan(0);

    assertInBand(summary.engagementScore, 0, 1, "engagementScore");
    assertInBand(summary.avgTutorEyeContact, 0, 1, "avgTutorEyeContact");
    assertInBand(summary.avgStudentEyeContact, 0, 1, "avgStudentEyeContact");
    assertInBand(summary.avgTutorTalkPercent, 0, 1, "avgTutorTalkPercent");
    assertInBand(summary.avgStudentTalkPercent, 0, 1, "avgStudentTalkPercent");
    assertInBand(summary.studentTalkRatio, 0, 1, "studentTalkRatio");

    // At least some metrics should be non-zero (face/talk detected)
    const hasEyeContact =
      summary.avgTutorEyeContact > 0 || summary.avgStudentEyeContact > 0;
    const hasTalkTime =
      summary.avgTutorTalkPercent > 0 || summary.avgStudentTalkPercent > 0;
    expect(
      hasEyeContact || hasTalkTime,
      "Expected at least eye contact or talk time data"
    ).toBe(true);

    // ─── 9. Verify report UI sections ─────────────────────────────────────
    await expect(page.getByText("Key Metrics")).toBeVisible();
    await expect(
      page.getByText("Overall Engagement Score", { exact: true })
    ).toBeVisible();

    // ─── 10. Run Another Debug navigates back ───────────────────────────────
    await page.getByRole("link", { name: "Run Another Debug" }).click();
    await expect(page).toHaveURL(/\/debug/);
    await expect(
      page.getByRole("button", { name: "Start Session" })
    ).toBeVisible();
  });
});
