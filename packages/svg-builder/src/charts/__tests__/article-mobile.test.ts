import { describe, it, expect } from 'vitest';
import { generateMobileScatterSvg, generateMobileMapSvg } from '../article-mobile';

const points = Array.from({ length: 47 }, (_, i) => ({ code: String(i + 1).padStart(2, '0'), name: `県${i + 1}`, x: 10 + i / 10, y: 30 - i / 7 }));
const scatter = { title: '地域の比較', subtitle: 'X:2020年 / Y:2023年', xLabel: '割合（%・2020年）', yLabel: '施設数（所・2023年）', focusNames: ['県1', '県47'] };
describe('mobile article pilot', () => {
  it('keeps every original scatter coordinate and readable axis text', () => {
    const original = structuredClone(points);
    const svg = generateMobileScatterSvg(points, scatter);
    expect(points).toEqual(original);
    expect(svg.match(/data-pref=/g)).toHaveLength(47);
    for (const p of points) expect(svg).toContain(`${p.name}: X=${p.x}, Y=${p.y}`);
    expect(svg).toContain('割合（%・2020年）');
    expect(svg).toContain('施設数（所・2023年）');
    expect(svg).toContain('因果を示さない');
    expect(Math.min(...[...svg.matchAll(/font-size="(\d+)"/g)].map(m => +m[1]))).toBeGreaterThanOrEqual(22);
    expect(svg).toBe(generateMobileScatterSvg(points, scatter));
  });
  it('rejects duplicate, missing or non-finite observations instead of silently drawing fewer points', () => {
    expect(() => generateMobileScatterSvg(points.slice(1), scatter)).toThrow();
    expect(() => generateMobileScatterSvg([...points.slice(1), points[1]], scatter)).toThrow();
    expect(() => generateMobileScatterSvg(points.map((p, i) => i ? p : { ...p, x: NaN }), scatter)).toThrow();
    expect(() => generateMobileScatterSvg(points, { ...scatter, focusNames: ['存在しない県'] })).toThrow();
    expect(() => generateMobileScatterSvg(points.map(p => ({ ...p, x: 1 })), scatter)).toThrow();
  });
  it('keeps actual map paths and values; its legend must cover the same full domain', () => {
    const regions = points.map(p => ({ code: p.code, name: p.name, value: p.x, path: `M${p.x},20L40,30Z`, fill: '#1565c0' }));
    const options = { title: '地域差', subtitle: '2024年', unit: '%', legend: { min: points[0].x, max: points[46].x, colors: ['#eeeeee', '#1565c0'] }, focusCodes: ['47', '01'] };
    const svg = generateMobileMapSvg(regions, options);
    expect(svg.match(/data-pref=/g)).toHaveLength(47);
    regions.forEach(r => expect(svg).toContain(`d="${r.path}"`));
    expect(svg).toContain('沖縄は別枠');
    expect(() => generateMobileMapSvg(regions, { ...options, legend: { ...options.legend, max: 99 } })).toThrow();
    expect(() => generateMobileMapSvg(regions, { ...options, focusCodes: ['01', '47'] })).toThrow();
    expect(() => generateMobileMapSvg(regions.map((r, i) => i ? r : { ...r, path: '<script>' }), options)).toThrow();
  });
  it('fails long copy rather than shrinking labels below the mobile profile', () => {
    expect(() => generateMobileScatterSvg(points, { ...scatter, xLabel: '長'.repeat(47) })).toThrow();
  });
});
