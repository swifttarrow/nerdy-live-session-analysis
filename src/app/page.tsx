"use client";

import { useState } from "react";
import { useRoomStatus } from "@/hooks/useRoomStatus";
import { LobbyForm } from "@/components/lobby/LobbyForm";

export default function HomePage() {
  const [room, setRoom] = useState("sessionlens-demo");
  const {
    roomFull,
    teacherDisabled,
    studentDisabled,
    role,
    setRole,
  } = useRoomStatus(room);

  return (
    <LobbyForm
      room={room}
      onRoomChange={setRoom}
      role={role}
      onRoleChange={setRole}
      roomFull={roomFull}
      teacherDisabled={teacherDisabled}
      studentDisabled={studentDisabled}
    />
  );
}
