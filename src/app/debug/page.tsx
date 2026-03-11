"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useDebugSession } from "@/hooks/useDebugSession";
import MetricsDisplay from "@/components/MetricsDisplay";
import NudgeToast from "@/components/NudgeToast";
import KudosToast from "@/components/KudosToast";
import { EyeContactOverlay } from "@/components/EyeContactOverlay";
import SensitivitySelector from "@/components/SensitivitySelector";
import SessionTypeSelector from "@/components/SessionTypeSelector";
import type { SessionPreset } from "@coaching-system/presets";
import { ROLE_LABELS } from "@/lib/roles";
import { formatTime } from "@/lib/utils/format";

function FileUploadZone({
  label,
  role,
  onFileSelect,
  disabled,
}: {
  label: string;
  role: "tutor" | "student";
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          disabled
            ? "border-gray-700 bg-gray-800/50 cursor-not-allowed"
            : "border-gray-600 hover:border-gray-500 bg-gray-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        {fileName ? (
          <span className="text-sm text-gray-300 truncate max-w-full px-2">
            {fileName}
          </span>
        ) : (
          <span className="text-sm text-gray-500">
            Click to select {ROLE_LABELS[role]} video
          </span>
        )}
      </div>
    </div>
  );
}

export default function DebugPage() {
  const [tutorFile, setTutorFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);

  const tutorContainerRef = useRef<HTMLDivElement>(null);
  const studentContainerRef = useRef<HTMLDivElement>(null);

  const {
    status,
    errorMsg,
    metrics,
    videoQuality,
    nudges,
    kudos,
    sensitivityPercent,
    sessionPreset,
    currentTime,
    duration,
    debugStats,
    handleSensitivityChange,
    handlePresetChange,
    startSession,
    endSession,
    togglePause,
    dismissNudge,
    dismissKudos,
  } = useDebugSession();

  const [debugPanelOpen, setDebugPanelOpen] = useState(true);

  const canStart =
    status === "idle" && tutorFile && studentFile;
  const isActive =
    status === "loading" ||
    status === "playing" ||
    status === "paused";

  const handleStart = () => {
    if (tutorFile && studentFile) {
      startSession(tutorFile, studentFile, tutorContainerRef, studentContainerRef);
    }
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back
          </Link>
          <span className="font-semibold text-white">SessionLens Debug</span>
          <span className="px-2 py-1 rounded text-xs bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
            Video replay mode
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isActive && (
            <>
              <SessionTypeSelector
                value={sessionPreset}
                onChange={handlePresetChange}
              />
              <SensitivitySelector
                value={sensitivityPercent}
                onChange={handleSensitivityChange}
              />
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  status === "playing"
                    ? "bg-green-900 text-green-300"
                    : status === "loading"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700 text-gray-400"
                }`}
              >
                {status}
              </span>
              {status !== "loading" && (
                <button
                  onClick={togglePause}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  {status === "paused" ? "Resume" : "Pause"}
                </button>
              )}
              <button
                onClick={endSession}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
              >
                End Session
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {status === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-lg space-y-6">
              <p className="text-gray-400 text-sm text-center">
                Upload pre-recorded videos to run analytics and verify
                post-session report functionality. Both videos should have
                audio for talk-time detection.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileUploadZone
                  label="Teacher video"
                  role="tutor"
                  onFileSelect={setTutorFile}
                />
                <FileUploadZone
                  label="Student video"
                  role="student"
                  onFileSelect={setStudentFile}
                />
              </div>
              <button
                onClick={handleStart}
                disabled={!canStart}
                className={`w-full py-3 font-semibold rounded-xl transition-colors ${
                  canStart
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Start Session
              </button>
            </div>
          </div>
        )}

        {/* Video containers always mounted so refs exist when startSession runs */}
        <div
          className={`flex-1 flex flex-col gap-4 min-w-0 ${
            status === "idle" ? "hidden" : ""
          }`}
        >
          <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)] gap-4 flex-1 min-h-0">
            <div className="rounded-xl overflow-hidden flex flex-col min-h-0 border-2 border-amber-500/30">
              <p className="text-sm font-medium mb-2 px-1 text-amber-400">
                Teacher
              </p>
              <div className="relative flex-1 bg-gray-800 rounded-lg overflow-hidden min-h-0 aspect-video">
                <div
                  ref={tutorContainerRef}
                  className="absolute inset-0 flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
                />
                {metrics && (
                  <EyeContactOverlay
                    score={metrics.metrics.tutor.eye_contact_score}
                    faceDetected={metrics.metrics.tutor.face_detected}
                    variant="tutor"
                  />
                )}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden flex flex-col min-h-0 border-2 border-emerald-500/30">
              <p className="text-sm font-medium mb-2 px-1 text-emerald-400">
                Student
              </p>
              <div className="relative flex-1 bg-gray-800 rounded-lg overflow-hidden min-h-0 aspect-video">
                <div
                  ref={studentContainerRef}
                  className="absolute inset-0 flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
                />
                {metrics && (
                  <EyeContactOverlay
                    score={metrics.metrics.student.eye_contact_score}
                    faceDetected={metrics.metrics.student.face_detected}
                    variant="student"
                  />
                )}
              </div>
            </div>
          </div>
          {status !== "loading" && duration > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-400 tabular-nums w-10">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-2 bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-cyan-500/60 rounded-lg transition-[width] duration-200"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 tabular-nums w-10">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        {isActive && (
          <aside className="w-80 flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MetricsDisplay
                metrics={metrics}
                videoQuality={videoQuality}
                debugStats={debugPanelOpen ? debugStats : null}
                debugMode={debugPanelOpen}
                onDebugModeChange={(v) => setDebugPanelOpen(v)}
              />
            </div>
          </aside>
        )}
      </div>

      {status === "error" && (
        <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {errorMsg || "An error occurred"}
        </div>
      )}

      {isActive && (nudges.length > 0 || kudos.length > 0) && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          {kudos
            .filter((k) => sessionPreset === "socratic")
            .map((k) => (
              <KudosToast key={k.id} kudos={k} onDismiss={dismissKudos} />
            ))}
          {nudges.map((nudge) => (
            <NudgeToast
              key={nudge.id}
              nudge={nudge}
              onDismiss={dismissNudge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
