import "server-only";

import fs from "node:fs";
import path from "node:path";

import { unitOfEntry } from "../../../../.claude/scripts/ads/lib/ad-layout-ledger";

import { projectRoot } from "./project-root";

/** 撮影の置き場 (.claude/scripts/ads/capture-ad-layout.ts が日付ごとに書く。git にも R2 にも置かない) */
export const AD_LAYOUT_ROOT = ".local/ad-layout";
/** 広告の枠の台帳 (ページの種類ごとの置き方の正本) */
const PLACEMENTS_FILE = "config/ads/placements.json";

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

export type AdLayoutAd = {
  kind: "adsense" | "pr";
  slotType: string | null;
  unit: string | null;
  label: string;
  region: "body" | "rail";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AdLayoutShot = {
  pageType: string;
  label: string;
  url: string;
  viewport: string;
  width: number;
  image: string | null;
  imageHeight: number | null;
  pageHeight: number | null;
  truncated: boolean;
  httpStatus: number | null;
  ads: AdLayoutAd[];
  capturedAt: string;
  error: string | null;
};

export type AdLayoutManifest = {
  generatedAt: string;
  date: string;
  baseUrl: string;
  widths: number[];
  pageTypes: { id: string; label: string; url: string }[];
  shots: AdLayoutShot[];
};

export type PlacementDefinition = {
  slot: string;
  slotName: string;
  provider: string;
  devices: string[];
  region: string;
  position: string;
  unit: string | null;
  condition: string | null;
};

type RawPlacement = { slot: string; region: string; position: string; marker: string; adsenseSlot?: string; condition?: string };
type RawLedger = {
  slotTypes: { id: string; name: string; provider: string; devices: string[] }[];
  pages: Record<string, RawPlacement[]>;
};

/** 最新の日付の撮影の一覧。まだ撮っていなければ null */
export function latestAdLayoutManifest(): AdLayoutManifest | null {
  const root = path.join(projectRoot(), AD_LAYOUT_ROOT);
  if (!fs.existsSync(root)) return null;
  const dates = fs
    .readdirSync(root)
    .filter((d) => DATE_DIR.test(d) && fs.existsSync(path.join(root, d, "manifest.json")))
    .sort();
  const latest = dates.at(-1);
  if (!latest) return null;
  return JSON.parse(fs.readFileSync(path.join(root, latest, "manifest.json"), "utf8")) as AdLayoutManifest;
}

/** ページの種類ごとの台帳の定義 (枠の種類の名前・表示する画面幅・ユニットを付けて返す) */
export function placementDefinitions(): Record<string, PlacementDefinition[]> {
  const ledger = JSON.parse(fs.readFileSync(path.join(projectRoot(), PLACEMENTS_FILE), "utf8")) as RawLedger;
  const types = new Map(ledger.slotTypes.map((t) => [t.id, t]));
  return Object.fromEntries(
    Object.entries(ledger.pages).map(([pageType, entries]) => [
      pageType,
      entries.map((e) => {
        const type = types.get(e.slot);
        return {
          slot: e.slot,
          slotName: type?.name ?? e.slot,
          provider: type?.provider ?? "",
          devices: type?.devices ?? [],
          region: e.region,
          position: e.position,
          unit: type?.provider === "adsense" ? unitOfEntry(e) : null,
          condition: e.condition ?? null,
        };
      }),
    ]),
  );
}
