/**
 * 地図表示値 ↔ SSOT 照合の対照テスト。
 * 実行: node --test .claude/scripts/lib/__tests__/map-value-match.test.mjs
 *
 * ★背景 (2026-08-11 実測): 「13,326千円」の「千」をスケール接頭辞と誤読して ×1000 で
 * 照合していたため、単位が千円/万円系の指標は**値が完全一致しているのに**一致率 0% になり
 * 「SSOT照合 失敗」で再生成できなかった (savings-map で発覚)。
 * スケール接頭辞なのか単位の一部なのかは SSOT の unit でしか判別できない。両方向を固定する。
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  matchRate,
  parseDisplayValue,
  parseMapDisplay,
} from '../map-value-match.mjs';

describe('parseDisplayValue — 短縮接頭辞 vs 単位の一部', () => {
  it('★unit が短縮単位で始まるなら値の一部として扱う (×1)', () => {
    assert.equal(parseDisplayValue('13,326千円', '千円'), 13326);
    assert.equal(parseDisplayValue('468万円', '万円'), 468);
  });

  it('★unit が別物ならスケール接頭辞として実値化する', () => {
    assert.equal(parseDisplayValue('468万人', '人'), 4_680_000);
    assert.equal(parseDisplayValue('207.3万kl', 'kl'), 2_073_000);
    assert.equal(parseDisplayValue('43.6千戸', '戸'), 43_600);
  });

  it('接頭辞が無ければそのまま読む', () => {
    assert.equal(parseDisplayValue('27.8％', '％'), 27.8);
    assert.equal(parseDisplayValue('1,780円', '円'), 1780);
  });

  it('負値と小数を落とさない', () => {
    assert.equal(parseDisplayValue('-1.7店', '店'), -1.7);
  });

  it('数値が無ければ null', () => {
    assert.equal(parseDisplayValue('—', '円'), null);
    assert.equal(parseDisplayValue('', '円'), null);
  });
});

describe('parseMapDisplay — <title> の取り出し', () => {
  const svg =
    '<svg><title>貯蓄現在高</title><title>群馬県：13,326千円</title>' +
    '<title>東京都:17,562千円</title></svg>';

  it('全角・半角コロンの両方を読む', () => {
    const m = parseMapDisplay(svg);
    assert.equal(m.get('群馬県'), '13,326千円');
    assert.equal(m.get('東京都'), '17,562千円');
  });

  it('コロンの無いタイトル (図のタイトル) は取り込まない', () => {
    assert.equal(parseMapDisplay(svg).has('貯蓄現在高'), false);
  });
});

describe('matchRate — 実データの再現', () => {
  // savings-map の実値 (SSOT financial-assets-balance-multi-person-households 2019)
  const SAVINGS = [
    { areaName: '群馬県', value: 13326 },
    { areaName: '埼玉県', value: 15478 },
    { areaName: '千葉県', value: 16000 },
    { areaName: '東京都', value: 17562 },
    { areaName: '神奈川県', value: 18218 },
    { areaName: '愛知県', value: 17685 },
  ];
  const savingsDisplay = new Map(
    SAVINGS.map((r) => [r.areaName, `${r.value.toLocaleString('en-US')}千円`])
  );

  it('★unit="千円" で完全一致する (旧実装はここが 0 になっていた)', () => {
    assert.equal(matchRate(SAVINGS, savingsDisplay, '千円'), 1);
  });

  it('★unit を渡さないと従来どおり ×1000 と読んで一致しない (回帰の証拠)', () => {
    assert.equal(matchRate(SAVINGS, savingsDisplay, ''), 0);
  });

  it('県名の接尾辞が無い表示とも突き合わせる', () => {
    const short = new Map(
      SAVINGS.map((r) => [
        r.areaName.replace(/[都道府県]$/, ''),
        `${r.value.toLocaleString('en-US')}千円`,
      ])
    );
    assert.equal(matchRate(SAVINGS, short, '千円'), 1);
  });

  it('別 metric の値とは一致しない (誤確定の防止)', () => {
    const other = new Map(
      SAVINGS.map((r) => [r.areaName, `${r.value * 2}千円`])
    );
    assert.equal(matchRate(SAVINGS, other, '千円'), 0);
  });

  it('突き合わせ対象が 5 県未満なら判定不能として 0', () => {
    const few = new Map([['群馬県', '13,326千円']]);
    assert.equal(matchRate(SAVINGS, few, '千円'), 0);
  });

  it('相対 2% 以内の丸め差は一致とみなす (短縮表記の誤差)', () => {
    const rounded = new Map([
      ['群馬県', '13,300千円'],
      ['埼玉県', '15,500千円'],
      ['千葉県', '16,000千円'],
      ['東京都', '17,600千円'],
      ['神奈川県', '18,200千円'],
      ['愛知県', '17,700千円'],
    ]);
    assert.equal(matchRate(SAVINGS, rounded, '千円'), 1);
  });
});
