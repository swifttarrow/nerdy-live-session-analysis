"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { getRoomChannelName } from "@/lib/room-channel";

export type SessionRole = "student" | "teacher";

export interface RoomStatus {
  participantCount: number;
  hasTeacher: boolean;
  hasStudent: boolean;
}

export function useRoomStatus(room: string) {
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [role, setRole] = useState<SessionRole>("teacher");
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher["subscribe"]> | null>(null);

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
      fetch(`/api/room/status?room=${encodeURIComponent(room)}`)
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

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2";

    if (key && typeof window !== "undefined") {
      if (!pusherRef.current) {
        pusherRef.current = new Pusher(key, { cluster });
      }
      channelRef.current?.unbind("participant-update");
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      const channelName = getRoomChannelName(room);
      channelRef.current = pusherRef.current.subscribe(channelName);
      channelRef.current.bind(
        "participant-update",
        (data: {
          participantCount?: number;
          hasTeacher?: boolean;
          hasStudent?: boolean;
        }) => {
          if (!cancelled && data && typeof data.participantCount === "number") {
            setRoomStatus({
              participantCount: data.participantCount,
              hasTeacher: data.hasTeacher ?? false,
              hasStudent: data.hasStudent ?? false,
            });
          }
        }
      );
    } else {
      const interval = setInterval(fetchStatus, 2000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
      channelRef.current?.unbind("participant-update");
      channelRef.current?.unsubscribe();
      channelRef.current = null;
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
