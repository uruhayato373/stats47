/**
 * note マガジン台帳の読み込み口。正本は data/note/magazines.json (JSON Schema 付き)。
 * 種別と s47-* の分け方は README の「マガジン運用」を参照する。
 */
import type { NoteMagazine } from "./types";
import { readMagazineLedger } from "../lib/article-ledger.mjs";

export const NOTE_MAGAZINES: NoteMagazine[] = readMagazineLedger().magazines;

export const NOTE_MAGAZINE_KEYS = new Set(NOTE_MAGAZINES.map((m) => m.key));

export function getMagazine(key: string): NoteMagazine | undefined {
  return NOTE_MAGAZINES.find((m) => m.key === key);
}
