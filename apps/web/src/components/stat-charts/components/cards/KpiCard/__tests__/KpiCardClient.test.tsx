import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KpiCardClient } from '../KpiCardClient';

describe('KpiCardClient', () => {
  it('出生率の有効な小数2桁を丸めず表示する', () => {
    render(
      <KpiCardClient
        title="合計特殊出生率"
        value={1.15}
        unit=""
        year="2024年"
        precision={2}
      />,
    );

    expect(screen.getByText('1.15')).toBeInTheDocument();
    expect(screen.queryByText('1.2')).not.toBeInTheDocument();
  });

  it('整数指標は不要な小数を付けない', () => {
    render(
      <KpiCardClient
        title="人口"
        value={1234}
        unit="人"
        year="2024年"
        precision={0}
      />,
    );

    expect(screen.getByText('1,234')).toBeInTheDocument();
  });
});
