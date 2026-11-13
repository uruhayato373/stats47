import { describe, expect, it } from 'vitest';

import { numeratorBaseCodes } from './formula-numerator';

describe('numeratorBaseCodes (指標計算式の分子に出る基礎項目)', () => {
  it.each([
    // 粗出生率 = 出生数 / 総人口。分母の総人口 (国勢調査・人口推計) は主出典に数えない
    ['A4101/A1101', ['A4101']],
    // 道路実延長 (総面積 1km² 当たり)
    ['H7110/B1101', ['H7110']],
    ['(A1301+A1303)/A1302', ['A1301', 'A1303']],
    ['I821101/(I610112*365)', ['I821101']],
    // 括弧の中の / は分子と分母の境目ではない
    ['(I821101/365)/A1101', ['I821101']],
    ['(L321301-L3121)+(L321302-L3122)/L3130', ['L321301', 'L3121', 'L321302', 'L3122']],
    ['E3901/(A1409＋A1411)', ['E3901']],
    ['A1603101～A1603151/A141601', ['A1603101', 'A1603151']],
    ['L2201/12', ['L2201']],
  ])('%s の分子は %j', (formula, expected) => {
    expect(numeratorBaseCodes(formula)).toEqual(expected);
  });

  it.each([
    // 割り算でない式は式全体が主出典
    ['A1101', ['A1101']],
    ['F610101+F610201', ['F610101', 'F610201']],
    // 全体が括弧に入った増減率・補数は、括弧の中の項目をすべて数える
    ['(A1101/A1101[-1])-1', ['A1101']],
    ['1-(F3106/F3105)', ['F3106', 'F3105']],
  ])('割り算が式の外側に無い %s は全項目 %j', (formula, expected) => {
    expect(numeratorBaseCodes(formula)).toEqual(expected);
  });

  it('期間ごとに式が変わる指標は、各行の分子を合わせる', () => {
    const formula =
      '1976年～1999年データ\nE6402/E460210[-1]\n\n2000年～2007年データ\nE6402/（E460210[-1]＋E4902[-1]）';
    expect(numeratorBaseCodes(formula)).toEqual(['E6402']);
  });

  it('項目コードの無い式は空', () => {
    expect(numeratorBaseCodes('')).toEqual([]);
  });
});
