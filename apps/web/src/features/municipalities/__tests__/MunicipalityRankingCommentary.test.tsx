import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MunicipalityRankingCommentary } from '../components/MunicipalityRankingCommentary';

const content = {
  schemaVersion: 1 as const,
  rankingKey: 'census-population-change-rate-5y',
  basedOn: { yearCode: '2025', valueCount: 1740 },
  valuesGeneratedAt: '2026-10-21T11:10:16.787Z',
  summary: '最も増えたのは大熊町です。',
  prefectureDistribution: '上位は東京都が最も多い。',
  population: '比べる対象は1741自治体です。',
  faq: [
    { question: '最も増えた市区町村は？', answer: '大熊町です。' },
    { question: '最も減った市区町村は？', answer: '珠洲市です。' },
  ],
};

describe('市区町村ランキングの解説', () => {
  it('考察の3節と FAQ を表示し、FAQPage は見える Q&A と同じ内容にする', () => {
    const { container } = render(<MunicipalityRankingCommentary content={content} />);
    expect(screen.getByRole('heading', { level: 2, name: 'データの考察' })).toBeInTheDocument();
    expect(screen.getByText('都道府県ごとの分布')).toBeInTheDocument();
    expect(screen.getByText('比べている自治体')).toBeInTheDocument();
    expect(screen.getByText('Q. 最も減った市区町村は？')).toBeInTheDocument();
    const jsonLd = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? '{}');
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd.mainEntity.map((entry: { name: string }) => entry.name)).toEqual(content.faq.map((entry) => entry.question));
  });
});
