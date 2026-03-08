"use client";

interface Props {
  onConsent: () => void;
}

export default function ConsentBanner({ onConsent }: Props) {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Before you join</h1>
        <p className="text-gray-400 text-sm mb-6">
          SessionLens analyzes your video and audio to provide real-time engagement
          coaching. Please read the following before continuing.
        </p>

        <div className="space-y-3 mb-6 text-sm">
          <div className="flex gap-3">
            <span className="text-blue-400 flex-shrink-0">📹</span>
            <p className="text-gray-300">
              <strong className="text-white">Video:</strong> Face landmarks are
              analyzed locally in your browser to compute eye contact. No video
              is sent to any server.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 flex-shrink-0">🎙️</span>
            <p className="text-gray-300">
              <strong className="text-white">Audio:</strong> Voice activity is
              detected locally to measure speaking time. No audio is recorded or
              transmitted.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 flex-shrink-0">🔒</span>
            <p className="text-gray-300">
              <strong className="text-white">Privacy:</strong> All analysis runs
              in your browser. Only anonymous session metrics (scores) are used
              for coaching nudges and the post-session report.
            </p>
          </div>
        </div>

        <button
          onClick={onConsent}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors"
        >
          I understand — Join Session
        </button>
      </div>
    </main>
  );
}
