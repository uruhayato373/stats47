import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

/** 撮影の置き場 (.claude/scripts/page-quality/layout-review.ts が書く。git にも R2 にも置かない) */
export const LAYOUT_REVIEW_ROOT = ".local/layout-review/latest";

export type LayoutScenario = "now" | "hide" | "row";

export type LayoutReviewManifest = {
  generatedAt: string;
  baseUrl: string;
  pages: { id: string; label: string; path: string }[];
  widths: number[];
  scenarios: LayoutScenario[];
  measures: { page: string; width: number; shellWidth: number | null; railStacked: boolean; railAds: number; bodyAds: number }[];
  shots: { page: string; width: number; scenario: LayoutScenario; file: string; height: number }[];
};

/** 撮影の一覧。まだ撮っていなければ null */
export function layoutReviewManifest(): LayoutReviewManifest | null {
  const file = path.join(projectRoot(), LAYOUT_REVIEW_ROOT, "manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as LayoutReviewManifest;
}
