/**
 * `/ranking/<key>` を持つのは「prefecture を持つ active metric」だけ、という境界の固定。
 *
 * ★なぜテストが要るか (2026-08-17 の RANKING-ITEM-CITY-ONLY-01 の調査で確定):
 * この境界は 3 箇所が別々に実装しており、どれか 1 つを変えると黙ってずれる。
 *   1. `generate-ranking-items.ts`      — item.json を作る対象を prefecture で絞る
 *   2. `generate-known-ranking-keys.ts` — KNOWN の候補を prefecture で絞る
 *   3. `read-ranking-items-snapshot.ts` — KNOWN だけを列挙して item.json を読む
 * ずれても「city 専用 metric の item.json が誰にも再生成されない」という**静かな不整合**に
 * なるだけで、ページは 404 のままなので誰も気づけない (実際 19 件が R2 に孤児として残り、
 * うち total-area-prefecture-ratio は配色ポリシーと食い違ったまま放置されていた)。
 *
 * したがって固定するのは「city / port / migration-flow 専用 metric は /ranking を持たない」。
 * これを持たせたくなったら、上の 3 箇所すべてと本テストを同時に変える。
 */
import { describe, expect, it } from 'vitest';
import { listAllMetrics } from '@stats47/data-configs';
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from '@stats47/data-configs/geo-scope';
import { KNOWN_RANKING_KEYS } from '../known-ranking-keys';

const allMetrics = listAllMetrics();
const hasPrefecture = (m: { entities?: readonly string[] }) =>
  m.entities?.includes('prefecture') ?? false;

describe('ranking key と metric entities の境界', () => {
  it('KNOWN_RANKING_KEYS は prefecture を持つ metric だけで構成される', () => {
    const configByKey = new Map(allMetrics.map((m) => [m.key, m]));
    const offenders = [...KNOWN_RANKING_KEYS].filter((key) => {
      const config = configByKey.get(key);
      // config に無いキーは別の検査 (audit-ranking-data-integrity) の領分なのでここでは見ない。
      return config !== undefined && !hasPrefecture(config);
    });
    expect(offenders).toEqual([]);
  });

  it('prefecture を持たない active metric は KNOWN に載らない', () => {
    const nonPrefectureActive = allMetrics.filter(
      (m) => m.isActive && !hasPrefecture(m)
    );
    // 実測 29 件 (city 19 / port 9 / migration-flow 1)。0 件になったらこの検査は無意味なので、
    // 「そもそも対象が存在する」ことも一緒に固定する (母集団ごと消えた緑を合格と誤読しない)。
    expect(nonPrefectureActive.length).toBeGreaterThan(0);
    expect(
      nonPrefectureActive
        .filter((m) => KNOWN_RANKING_KEYS.has(m.key))
        .map((m) => m.key)
    ).toEqual([]);
  });

  it('KNOWN は空ではない (生成スクリプトが全件落としたのを緑にしない)', () => {
    expect(KNOWN_RANKING_KEYS.size).toBeGreaterThan(1000);
  });

  it('県rankingと市区町村rankingのknown集合を混在させない', () => {
    expect(KNOWN_RANKING_KEYS.has('elderly-population-ratio')).toBe(false);
    expect(
      KNOWN_MUNICIPALITY_RANKING_KEYS.has('elderly-population-ratio')
    ).toBe(true);
    expect(
      [...KNOWN_MUNICIPALITY_RANKING_KEYS].filter((key) =>
        KNOWN_RANKING_KEYS.has(key)
      )
    ).toEqual([]);
  });
});
