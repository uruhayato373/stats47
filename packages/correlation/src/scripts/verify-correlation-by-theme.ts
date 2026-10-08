/**
 * 公開中のテーマ別相関一覧 (`app/correlation/by-theme/<themeKey>.json`) が、今のテーマのカタログと合っているかを確かめる。
 *
 * テーマページ「相関が高いテーマ外の指標」は、テーマ内の指標 (via) と相関の強いテーマ外の指標を出す。
 * カタログから外した指標を via にした行や、テーマに入った指標を「テーマ外」として出す行は、
 * 相関の再計算が古いカタログで走ったまま残っている印である (2026-10-08、物価テーマで外した
 * average-temperature を via にした 7 件が本番に残った)。
 *
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/correlation/src/scripts/verify-correlation-by-theme.ts
 *
 * 公開 URL (R2_PUBLIC_FETCH_URL) を読むだけで、書き込みはしない。食い違いがあれば exit 1。
 * 正典: CORRELATION-THEME-CATALOG-SYNC-01 / .github/workflows/correlation-refresh.yml
 */
import { correlationByThemePath, parseCorrelationByThemeSnapshot, type CorrelationByThemeSnapshot } from '../types/snapshot';

import { listThemeMembers } from './build-correlation-snapshot';

export interface ByThemeMismatch {
  themeKey: string;
  rankingKey: string;
  reason: 'via-not-in-theme' | 'item-in-theme';
  detail: string;
}

/** テーマごとの snapshot とカタログの指標を突き合わせ、食い違う行を返す。snapshot の無いテーマは対象外。 */
export function findByThemeMismatches(
  snapshots: ReadonlyMap<string, CorrelationByThemeSnapshot>,
  members: ReadonlyArray<readonly [string, readonly string[]]>
): ByThemeMismatch[] {
  const mismatches: ByThemeMismatch[] = [];
  for (const [themeKey, keys] of members) {
    const snapshot = snapshots.get(themeKey);
    if (!snapshot) continue;
    const memberSet = new Set(keys);
    for (const item of snapshot.items) {
      if (!memberSet.has(item.via.rankingKey)) {
        mismatches.push({
          themeKey,
          rankingKey: item.rankingKey,
          reason: 'via-not-in-theme',
          detail: `基準の ${item.via.rankingKey} がカタログに無い`,
        });
      }
      if (memberSet.has(item.rankingKey)) {
        mismatches.push({
          themeKey,
          rankingKey: item.rankingKey,
          reason: 'item-in-theme',
          detail: 'テーマ内の指標が「テーマ外」として出ている',
        });
      }
    }
  }
  return mismatches;
}

async function fetchSnapshot(base: string, themeKey: string): Promise<CorrelationByThemeSnapshot | null> {
  // 配信のキャッシュを避けて、R2 にある今の版を読む
  const url = `${base}/${correlationByThemePath(themeKey)}?verify=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return parseCorrelationByThemeSnapshot(await response.json());
}

async function main(): Promise<void> {
  const base = (process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp').replace(/\/$/, '');
  const members = listThemeMembers();
  const snapshots = new Map<string, CorrelationByThemeSnapshot>();
  for (const [themeKey] of members) {
    const snapshot = await fetchSnapshot(base, themeKey);
    if (snapshot) snapshots.set(themeKey, snapshot);
  }
  const mismatches = findByThemeMismatches(snapshots, members);
  console.log(`[verify-correlation-by-theme] テーマ ${members.length} / snapshot ${snapshots.size} / 食い違い ${mismatches.length}`);
  if (mismatches.length === 0) return;
  for (const m of mismatches) {
    console.log(`  ❌ ${m.themeKey}: ${m.rankingKey} — ${m.detail}`);
  }
  console.log('  → テーマ別の相関一覧が古いカタログで計算されている。correlation-refresh.yml を force=true で再実行する');
  process.exitCode = 1;
}

// 直接実行時のみ main を走らせる (import 時は副作用なし)。
if (process.argv[1] && process.argv[1].includes('verify-correlation-by-theme')) {
  main().catch((error) => {
    console.error('Fatal:', error);
    process.exit(1);
  });
}
