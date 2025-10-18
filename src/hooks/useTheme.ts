"use client";

import { useAtom, useSetAtom } from "jotai";
import {
  effectiveThemeAtom,
  mountedAtom,
  toggleThemeAtom,
} from "@/store/theme";

export function useTheme() {
  const [theme] = useAtom(effectiveThemeAtom);
  const [mounted] = useAtom(mountedAtom);
  const toggleTheme = useSetAtom(toggleThemeAtom);

  return {
    theme,
    mounted,
    toggleTheme,
  };
}
