/**
 * M24: Persist session summaries to localStorage for trend analysis.
 * Browser-only; gracefully no-ops in SSR contexts.
 */

import { STORAGE_KEYS } from "@/lib/constants";
const MAX_SESSIONS = 20;

export interface StoredSessionSummary {
  sessionId: string;
  storedAt: string; // ISO timestamp
  durationSec: number;
  avgTutorEyeContact: number;
  avgStudentEyeContact: number;
  avgTutorTalkPercent: number;
  avgStudentTalkPercent: number;
  studentTalkRatio: number;
  engagementScore: number;
}

function isAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function saveSession(summary: StoredSessionSummary): void {
  if (!isAvailable()) return;
  const history = loadHistory();
  const updated = [summary, ...history].slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
}

export function loadHistory(): StoredSessionSummary[] {
  if (!isAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredSessionSummary[];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (!isAvailable()) return;
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}
