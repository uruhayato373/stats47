import { expect, it } from 'vitest';

import { themeYearLabel } from '../theme-year-label';

it('暦年の指標で古い年度表記を補正し、財政年度などの表記は保つ', () => {
  expect(themeYearLabel('2024100000', '2024年度', 'calendar')).toBe('2024年');
  expect(themeYearLabel('2024', '2024年度', 'fiscal')).toBe('2024年度');
  expect(themeYearLabel('2023', '2023年10月1日')).toBe('2023年10月1日');
});

it.each([
  ['202401', '2024年1月'],
  ['2024010000', '2024年1月'],
  ['2023', '2023年10月1日'],
  ['2024', '2024年（暫定値）'],
  ['2024', '2024年平均'],
])('暦年指標でも細かい時点や注記を保持する: %s', (code, label) => {
  expect(themeYearLabel(code, label, 'calendar')).toBe(label);
});

it('年度の誤記を直しても暫定値注記は残し、ラベル欠測の年次コードを整形する', () => {
  expect(themeYearLabel('2024100000', '2024年度（暫定値）', 'calendar')).toBe(
    '2024年（暫定値）'
  );
  expect(themeYearLabel('2024100000', undefined, 'calendar')).toBe('2024年');
  expect(themeYearLabel('2024100000', '2024100000', 'calendar')).toBe('2024年');
  expect(themeYearLabel('2024100000', undefined, 'fiscal')).toBe('2024年度');
});
