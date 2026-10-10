import { SITE } from "@stats47/types";

/**
 * 配信 snapshot を「中身が同じなら同じバイト列」にするための部品。
 *
 * snapshot に生成時刻を入れると、作り直すたびに全ファイルの中身が変わり、差分だけを送る反映
 * (push-exact-r2-assets) が毎回全件を送ることになる (2026-10-09 のデプロイは 3,219 件すべてを送り
 * 53 分かかった)。時刻は「データが変わったときだけ進む日時」として前回の値を引き継ぐ。
 */

const DEFAULT_PUBLIC_BASE = SITE.r2PublicBaseUrl;

/**
 * 公開 URL から前回配信した JSON を読む。無ければ (404) null。
 * それ以外の失敗は例外にする (通信の失敗を「前回が無い」と扱うと全件を作り直してしまう)。
 */
export async function readPublishedSnapshot<T>(
  key: string,
  base: string = process.env.R2_PUBLIC_FETCH_URL ?? DEFAULT_PUBLIC_BASE,
): Promise<T | null> {
  if (key.startsWith("/") || key.includes("..")) throw new Error(`不正な R2 キー: ${key}`);
  const response = await fetch(`${base.replace(/\/$/, "")}/${key}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`前回の snapshot を読めません (HTTP ${response.status}): ${key}`);
  return (await response.json()) as T;
}

/**
 * build(時刻) の結果が前回配信した値と同じなら前回の時刻を引き継ぎ、違えば now で作り直す。
 * 比較は JSON の文字列で行う (同じ builder なら key の順序も同じになる)。
 */
export function carryTimestamp<T>(
  build: (timestamp: string) => T,
  previous: { value: unknown; timestamp: string | null | undefined } | null,
  now: string,
): { value: T; timestamp: string; changed: boolean } {
  if (previous?.timestamp) {
    const probe = build(previous.timestamp);
    if (JSON.stringify(probe) === JSON.stringify(previous.value)) {
      return { value: probe, timestamp: previous.timestamp, changed: false };
    }
  }
  return { value: build(now), timestamp: now, changed: true };
}

/** 含まれる行の更新日時の最大値 (一覧ファイルの generatedAt 用)。行が無ければ fallback */
export function latestTimestamp(
  rows: readonly { updatedAt?: string | null }[],
  fallback: string,
): string {
  let latest = "";
  for (const row of rows) if (row.updatedAt && row.updatedAt > latest) latest = row.updatedAt;
  return latest || fallback;
}
