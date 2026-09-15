import { describe, expect, it } from 'vitest';

import { findChartContractViolations } from '../chart-contract-audit.mjs';

describe('findChartContractViolations', () => {
  it('単位対応チャートへの unit 渡し忘れを検出する', () => {
    const result = findChartContractViolations(`
      export function Example() {
        return <D3StackedAreaChart data={data} series={series} />;
      }
    `);

    expect(result).toEqual([
      expect.objectContaining({ ruleId: 'chart-unit-must-reach-primitive' }),
    ]);
  });

  it('unit を渡す共通チャートは許可する', () => {
    const result = findChartContractViolations(`
      export function Example() {
        return <D3LineChart data={data} unit={unit} />;
      }
    `);

    expect(result).toEqual([]);
  });

  it('説明のない SVG を検出し、aria-hidden の装飾 SVG は許可する', () => {
    expect(findChartContractViolations('<svg viewBox="0 0 10 10" />')).toEqual([
      expect.objectContaining({ ruleId: 'chart-svg-needs-accessible-name' }),
    ]);
    expect(
      findChartContractViolations(
        '<><svg role="img" aria-label="人口推移" /><svg aria-hidden="true" /></>'
      )
    ).toEqual([]);
  });

  it('ツールチップ DOM の自作と軸の完全桁表示を検出する', () => {
    const result = findChartContractViolations(`
      const tooltip = document.createElement("div");
      tooltip.innerHTML = value;
      const axis = axisLeft(y).tickFormat((v) => Number(v).toLocaleString());
    `);

    expect(result.map((item) => item.ruleId)).toEqual([
      'chart-tooltip-must-use-shared-hook',
      'chart-tooltip-must-use-shared-hook',
      'chart-axis-must-use-compact-format',
    ]);
  });
});
