"use client";

import { useHa } from "@/providers/HaProvider";

export function useConnectionStatus() {
  const { status, error, logout } = useHa();
  return { status, error, logout, isOnline: status === "connected" };
}
