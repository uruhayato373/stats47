import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { listAllMetrics } from '../registry';
import type { EstatAvailabilityTable } from '../estat-availability';

/**
 * 月次・四半期と年計が同居する e-Stat の表を、年計の指標として使うときの契約。
 *
 * 商業動態統計 0004032502 は 1 年あたり 年計1 + 四半期4 + 月次12 の行を持つ。取り出し条件に
 * `timeScope: "annual"` が無いと extractYearCode が 4 桁年へ潰して同じ年に 17 行が重なり、
 * 1 行が採られる。convenience-store-sales は 2025 年の値として 1 月の月間販売額
 * (東京都 155,869 百万円。年計は 2024 年で 1,896,372 百万円) を「年間販売額」と書いて配信していた。
 * 値が月間か年間かは単位や副題からは見えないので、台帳が「この表は年計で取り出す」と
 * 記録した表(年計の条件 timeScope=annual を持つ行がある表)を使う指標は、同じ宣言を持つことを求める。
 */
const AVAILABILITY_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../data/estat/availability/tables',
);

function tablesMixingGranularity(): Set<string> {
  const ids = new Set<string>();
  for (const file of readdirSync(AVAILABILITY_DIR)) {
    if (!file.endsWith('.json')) continue;
    const table = JSON.parse(readFileSync(resolve(AVAILABILITY_DIR, file), 'utf8')) as EstatAvailabilityTable;
    if (table.queries.some((q) => q.query.timeScope === 'annual')) ids.add(table.statsDataId);
  }
  return ids;
}

describe('年計の取り出しが要る表を使う指標', () => {
  const mixing = tablesMixingGranularity();

  it('台帳に年計の条件を持つ表が 1 つ以上ある (この検査が空振りしていない)', () => {
    expect(mixing.has('0004032502')).toBe(true);
  });

  it('その表を使う指標は source.timeScope = "annual" を宣言する', () => {
    const violations = listAllMetrics()
      .filter((m) => m.source.kind === 'estat' && mixing.has(m.source.statsDataId))
      .filter((m) => m.source.kind === 'estat' && m.source.timeScope !== 'annual')
      .map((m) => `${m.key} (${m.source.kind === 'estat' ? m.source.statsDataId : ''})`);
    expect(violations).toEqual([]);
  });
});
