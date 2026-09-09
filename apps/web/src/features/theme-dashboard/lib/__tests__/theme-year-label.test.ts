import { expect, it } from 'vitest';

import { themeYearLabel } from '../theme-year-label';

it('暦年の指標で古い年度表記を補正し、財政年度などの表記は保つ', () => {
  expect(themeYearLabel('2024100000', '2024年度', 'calendar')).toBe('2024年');
  expect(themeYearLabel('2024', '2024年度', 'fiscal')).toBe('2024年度');
  expect(themeYearLabel('2023', '2023年10月1日')).toBe('2023年10月1日');
});
