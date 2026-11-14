// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { selectCurrentAiContent } from './select-current-ai-content';

describe('selectCurrentAiContent', () => {
  const content = {
    rankingKey: 'natto-consumption-expenditure',
    yearCode: '2024',
    faq: '2024年の説明',
    regionalAnalysis: null,
    insights: null,
    prefectureCommentary: null,
    createdAt: null,
    updatedAt: null,
  };

  it('表示中の年と一致する解説だけを返す', () => {
    expect(selectCurrentAiContent(content, '2024')).toBe(content);
    expect(selectCurrentAiContent(content, '2024000000')).toBe(content);
    expect(selectCurrentAiContent(content, '2025')).toBeNull();
    expect(selectCurrentAiContent(content, '')).toBeNull();
  });
});
