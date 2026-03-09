"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSessionRoom } from "@/hooks/useSessionRoom";
import MetricsDisplay from "@/components/MetricsDisplay";
import NudgeToast from "@/components/NudgeToast";
import ConsentBanner from "@/components/ConsentBanner";
import { SessionHeader } from "@/components/session/SessionHeader";
import { VideoFeeds } from "@/components/session/VideoFeeds";

function SessionContent() {
  const {
    role,
    status,
    errorMsg,
    metrics,
    videoQuality,
    nudges,
    sensitivityLevel,
    sessionPreset,
    handleSensitivityChange,
    handlePresetChange,
    startSession,
    endSession,
    dismissNudge,
    localVideoRef,
    remoteVideoRef,
    roomName,
    localRole,
    remoteRole,
  } = useSessionRoom();

  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (consented) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  if (!consented) {
    return <ConsentBanner onConsent={() => setConsented(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <SessionHeader
        roomName={roomName}
        role={role}
        status={status}
        sessionPreset={sessionPreset}
        sensitivityLevel={sensitivityLevel}
        onPresetChange={handlePresetChange}
        onSensitivityChange={handleSensitivityChange}
        onEndSession={endSession}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <VideoFeeds
          role={role}
          remoteRole={remoteRole}
          status={status}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
        />
        <div className="w-full lg:w-72 flex-shrink-0">
          <MetricsDisplay metrics={metrics} videoQuality={videoQuality} />
        </div>
      </div>

      {status === "error" && (
        <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {errorMsg || "Connection failed"}
        </div>
      )}

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {nudges.map((nudge) => (
          <NudgeToast key={nudge.id} nudge={nudge} onDismiss={dismissNudge} />
        ))}
      </div>
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
