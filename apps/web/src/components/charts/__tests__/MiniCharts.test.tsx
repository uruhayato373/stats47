import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MiniLineChart } from '../MiniCharts';

describe('MiniCharts pointer interaction', () => {
  afterEach(() => {
    document.getElementById('prefecture-map-tooltip')?.remove();
  });

  it('pointer移動で年次値のtooltipを表示し、離れると閉じる', async () => {
    const { container } = render(
      <MiniLineChart
        points={[
          { year: 2023, value: 1.1 },
          { year: 2024, value: 1.2 },
        ]}
        seriesName="財政力指数"
      />,
    );

    const hitArea = await waitFor(() => {
      const element = container.querySelector('[data-mini-chart-hit-area="line"]');
      expect(element).not.toBeNull();
      return element as SVGRectElement;
    });

    fireEvent.pointerMove(hitArea, {
      clientX: 20,
      clientY: 20,
      pageX: 20,
      pageY: 20,
    });

    const tooltip = document.getElementById('prefecture-map-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip).toHaveStyle({ opacity: '1' });
    expect(tooltip).toHaveTextContent('財政力指数');

    fireEvent.pointerLeave(hitArea);
    expect(tooltip).toHaveStyle({ opacity: '0' });
  });
});
