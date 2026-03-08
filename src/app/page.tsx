"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [room, setRoom] = useState("sessionlens-demo");
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = identity.trim() || `user-${Math.random().toString(36).slice(2, 7)}`;
    if (!room.trim()) {
      setError("Room name is required");
      return;
    }
    router.push(`/session?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(id)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-center">SessionLens</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Real-time engagement intelligence for tutoring sessions
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Room name
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="sessionlens-demo"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Your name{" "}
              <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g. tutor-alice or student-bob"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Join Session
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg text-xs text-gray-400">
          <p className="font-medium text-gray-300 mb-1">Two-participant demo:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open two browser tabs</li>
            <li>First tab: join as tutor (first to join)</li>
            <li>Second tab: join the same room as student</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
