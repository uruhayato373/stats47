"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { initThemeAtom } from "@/atoms/theme";

export default function ThemeInitializer() {
  const initTheme = useSetAtom(initThemeAtom);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return null;
}