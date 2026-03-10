"use client";

import { useState, useEffect } from "react";
import { API_PATHS } from "@/lib/constants";

export type SessionRole = "student" | "teacher";

export interface RoomStatus {
  participantCount: number;
  hasTeacher: boolean;
  hasStudent: boolean;
}

const POLL_MS = 1000;

export function useRoomStatus(room: string) {
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [role, setRole] = useState<SessionRole>("teacher");

  const roomFull = roomStatus !== null && roomStatus.participantCount >= 2;
  const teacherDisabled = roomStatus !== null && roomStatus.hasTeacher;
  const studentDisabled = roomStatus !== null && roomStatus.hasStudent;

  useEffect(() => {
    if (!room.trim()) {
      setRoomStatus(null);
      return;
    }
    let cancelled = false;

    const fetchStatus = () => {
      if (cancelled) return;
      fetch(`${API_PATHS.ROOM_STATUS}?room=${encodeURIComponent(room)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) {
            setRoomStatus({
              participantCount: data.participantCount ?? 0,
              hasTeacher: data.hasTeacher ?? false,
              hasStudent: data.hasStudent ?? false,
            });
          }
        })
        .catch(() => {
          if (!cancelled) setRoomStatus(null);
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [room]);

  useEffect(() => {
    if (teacherDisabled && role === "teacher") setRole("student");
    if (studentDisabled && role === "student") setRole("teacher");
  }, [teacherDisabled, studentDisabled, role]);

  return {
    roomStatus,
    roomFull,
    teacherDisabled,
    studentDisabled,
    role,
    setRole,
  };
}
