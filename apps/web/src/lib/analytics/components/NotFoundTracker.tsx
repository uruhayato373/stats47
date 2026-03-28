"use client";

import { useEffect } from "react";

import { trackNotFound } from "@/lib/analytics/events";

export function NotFoundTracker() {
  useEffect(() => {
    trackNotFound();
  }, []);
  return null;
}
