import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LineChartClient } from '../LineChartClient';

const captured = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock('next/dynamic', () => ({ default: () => (props: Record<string, unknown>) => {
  captured.props = props;
  return <div data-testid="chart" />;
} }));

describe('LineChartClient axis identity', () => {
  it('moves a remaining right-hand series with its unit and numeric domain to the primary axis', () => {
    render(<LineChartClient chartData={{ xAxisKey: 'year', data: [{ year: '2024', rate: 3 }], lines: [{ dataKey: 'rate', name: '率', color: '#123456', yAxis: 'right' }], unit: '円', rightUnit: '%' }} rightYDomain={[2, 4]} />);
    expect(captured.props.unit).toBe('%');
    expect(captured.props.yDomain).toEqual([2, 4]);
    expect(captured.props.series).toEqual([{ dataKey: 'rate', name: '率', color: '#123456', yAxis: 'left' }]);
    expect(captured.props.rightUnit).toBeUndefined();
  });
  it('uses one dataset precision for latest values sharing an axis', () => {
    const {container} = render(<LineChartClient chartData={{
      xAxisKey:'year', data:[{year:'2024',first:44,second:60.4}],
      lines:[{dataKey:'first',name:'A',color:'#123456'},{dataKey:'second',name:'B',color:'#654321'}], unit:'円'
    }} showLatestValues />);
    expect(container.textContent).toContain('44.0');
    expect(container.textContent).toContain('60.4');
  });
});
