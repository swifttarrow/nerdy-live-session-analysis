"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionRole } from "@/hooks/useRoomStatus";

interface LobbyFormProps {
  room: string;
  onRoomChange: (room: string) => void;
  role: SessionRole;
  onRoleChange: (role: SessionRole) => void;
  roomFull: boolean;
  teacherDisabled: boolean;
  studentDisabled: boolean;
}

export function LobbyForm({
  room,
  onRoomChange,
  role,
  onRoleChange,
  roomFull,
  teacherDisabled,
  studentDisabled,
}: LobbyFormProps) {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id =
      identity.trim() || `user-${Math.random().toString(36).slice(2, 7)}`;
    if (!room.trim()) {
      setError("Room name is required");
      return;
    }
    if (
      roomFull ||
      (role === "teacher" && teacherDisabled) ||
      (role === "student" && studentDisabled)
    )
      return;
    router.push(
      `/session?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(id)}&role=${role}`
    );
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              I am joining as
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !teacherDisabled && onRoleChange("teacher")}
                disabled={teacherDisabled}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  teacherDisabled
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : role === "teacher"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => !studentDisabled && onRoleChange("student")}
                disabled={studentDisabled}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  studentDisabled
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : role === "student"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Student
              </button>
            </div>
            {teacherDisabled && !roomFull && (
              <p className="mt-1 text-xs text-gray-500">
                Teacher has already joined this room.
              </p>
            )}
            {studentDisabled && !roomFull && (
              <p className="mt-1 text-xs text-gray-500">
                Student has already joined this room.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Room name
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => onRoomChange(e.target.value)}
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

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {roomFull && (
            <p className="text-amber-400 text-sm">
              This room already has two participants. Wait for someone to leave
              before joining.
            </p>
          )}

          <button
            type="submit"
            disabled={roomFull}
            className={`w-full py-3 font-semibold rounded-lg transition-colors ${
              roomFull
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
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
