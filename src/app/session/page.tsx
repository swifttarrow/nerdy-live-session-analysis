"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSessionRoom } from "@/hooks/useSessionRoom";
import MetricsDisplay from "@/components/MetricsDisplay";
import NudgeToast from "@/components/NudgeToast";
import KudosToast from "@/components/KudosToast";
import ConsentBanner from "@/components/ConsentBanner";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionSidePanel } from "@/components/session/SessionSidePanel";
import { VideoLayoutSelector } from "@/components/session/VideoLayoutSelector";
import { VideoFeeds, type VideoLayout } from "@/components/session/VideoFeeds";

function SessionContent() {
  const {
    role,
    status,
    errorMsg,
    metrics,
    videoQuality,
    nudges,
    kudos,
    sensitivityPercent,
    sessionPreset,
    hasRemoteParticipant,
    handleSensitivityChange,
    handlePresetChange,
    startSession,
    endSession,
    dismissNudge,
    dismissKudos,
    localVideoRef,
    remoteVideoRef,
    roomName,
    localRole,
    remoteRole,
    debugMode,
    setDebugMode,
    debugStats,
  } = useSessionRoom();

  const [consented, setConsented] = useState(false);
  const [layout, setLayout] = useState<VideoLayout>("side-by-side");
  const [metricsPanelOpen, setMetricsPanelOpen] = useState(true);

  useEffect(() => {
    if (consented) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  if (!consented) {
    return <ConsentBanner onConsent={() => setConsented(true)} />;
  }

  const isTeacher = role === "teacher";
  const showNudges = isTeacher && hasRemoteParticipant;

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <SessionHeader
        roomName={roomName}
        role={role}
        status={status}
        sessionPreset={sessionPreset}
        sensitivityPercent={sensitivityPercent}
        onPresetChange={handlePresetChange}
        onSensitivityChange={handleSensitivityChange}
        onEndSession={endSession}
        showModeControls={isTeacher}
        debugMode={debugMode}
        onDebugModeChange={setDebugMode}
        debugToggleInPanel={isTeacher && metricsPanelOpen}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex items-center justify-end gap-1 flex-shrink-0 mb-2">
            <VideoLayoutSelector value={layout} onChange={setLayout} />
            {isTeacher && (
              <button
                type="button"
                onClick={() => setMetricsPanelOpen((v) => !v)}
                className={`p-2 rounded-md transition-colors ${
                  metricsPanelOpen
                    ? "bg-gray-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
                title={metricsPanelOpen ? "Hide metrics" : "Show metrics"}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </button>
            )}
          </div>
          <VideoFeeds
            role={role}
            remoteRole={remoteRole}
            status={status}
            hasRemoteParticipant={hasRemoteParticipant}
            layout={layout}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
          />
        </div>
        <SessionSidePanel
          showMetricsPanel={isTeacher}
          metricsPanelOpen={metricsPanelOpen}
          metricsContent={
            <MetricsDisplay
              metrics={metrics}
              videoQuality={videoQuality}
              debugStats={debugMode ? debugStats : null}
              debugMode={debugMode}
              onDebugModeChange={setDebugMode}
            />
          }
        />
        {debugMode && (!isTeacher || !metricsPanelOpen) && (
          <div className="fixed bottom-4 left-4 z-40 max-w-sm max-h-[70vh] overflow-hidden flex flex-col rounded-2xl bg-gray-900 shadow-xl">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MetricsDisplay
                metrics={metrics}
                videoQuality={videoQuality}
                debugStats={debugStats}
                debugMode={debugMode}
                onDebugModeChange={setDebugMode}
              />
            </div>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {errorMsg || "Connection failed"}
        </div>
      )}

      {showNudges && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          {kudos
            .filter((k) => sessionPreset === "socratic")
            .map((k) => (
              <KudosToast key={k.id} kudos={k} onDismiss={dismissKudos} />
            ))}
          {nudges.map((nudge) => (
            <NudgeToast key={nudge.id} nudge={nudge} onDismiss={dismissNudge} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
