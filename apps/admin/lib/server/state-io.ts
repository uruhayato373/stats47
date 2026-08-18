import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

/**
 * `.claude/state` などローカル資産を読むための共通部品 (読み取り専用)。
 *
 * ★dashboard.ts に閉じていたものを切り出した。管理画面のページが増えるたびに
 *   同じ readJson / readCsv / wrap を各モジュールが再実装すると、失敗時の畳み方
 *   (throw するか {error} を返すか) が揃わず、1 ページの読み取り失敗が画面全体を
 *   落とすようになる。ここに 1 実装だけ置く。
 *
 * 書き込み関数は置かない。管理画面は閲覧専用で、state の書き手は CLI と CI が持つ。
 */

export type Wrapped<T> = T | { error: string };

/** `{ error }` に畳まれたかを型で判定する (呼び出し側の分岐用) */
export function hasError<T>(v: Wrapped<T>): v is { error: string } {
  return typeof v === "object" && v !== null && "error" in v;
}

/** repo root からの相対パスを絶対パスにする */
export function statePath(...rel: string[]): string {
  return path.join(projectRoot(), ...rel);
}

export function fileExists(rel: string): boolean {
  return fs.existsSync(statePath(rel));
}

export function readText(rel: string): string {
  return fs.readFileSync(statePath(rel), "utf8");
}

export function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

/** ヘッダ行付き csv → オブジェクト配列 (数値セルは Number 化)。 */
export function readCsv(rel: string): Array<Record<string, string | number>> {
  const lines = readText(rel).trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string | number> = {};
    header.forEach((h, i) => {
      const v = cells[i] ?? "";
      row[h] = v !== "" && !Number.isNaN(Number(v)) ? Number(v) : v;
    });
    return row;
  });
}

/** markdown の見出し regex 以降で最初に現れる pipe テーブルを行配列で返す。 */
export function mdTableAfter(
  md: string,
  headingRe: RegExp,
): { header: string[]; rows: string[][] } | null {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) return null;
  const rows: string[][] = [];
  let inTable = false;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      inTable = true;
      if (/^\|[\s:-]+\|/.test(l)) continue; // 区切り行
      const cells = l
        .split("|")
        .slice(1, -1)
        .map((c) => c.replace(/\*\*/g, "").trim());
      rows.push(cells);
    } else if (inTable) break;
  }
  if (rows.length < 2) return null;
  return { header: rows[0], rows: rows.slice(1) };
}

/** frontmatter の 1 フィールドを取り出す (`updated: 2026-08-18` 等) */
export function frontmatterValue(md: string, key: string): string | null {
  const m = md.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : null;
}

/**
 * 読み取りの失敗を `{ error }` に畳む。1 セクションの失敗で画面全体を落とさない。
 * ファイルが無い場合も同じ扱いにする (state は cron が作るので不在は通常状態がありうる)。
 */
export function wrap<T>(fn: () => T): Wrapped<T> {
  try {
    return fn();
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * TTL キャッシュ。`globalThis` に置くのは dev の HMR でモジュールが再評価されても
 * キャッシュが二重化しないようにするため (dashboard.ts の既存挙動を一般化した)。
 */
interface CacheEntry {
  at: number;
  data: unknown;
}
const g = globalThis as unknown as { __adminCache?: Map<string, CacheEntry> };

export function cached<T>(key: string, ttlMs: number, fn: () => T): T {
  if (!g.__adminCache) g.__adminCache = new Map();
  const hit = g.__adminCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = fn();
  g.__adminCache.set(key, { at: Date.now(), data });
  return data;
}

/** ページ種別ごとの TTL。週次更新の state を 60 秒で読み直しても意味がない */
export const TTL = {
  /** 日次で動く state (キュー・CI) */
  daily: 60 * 1000,
  /** 週次で動く state (収益・GA4) */
  weekly: 5 * 60 * 1000,
} as const;
