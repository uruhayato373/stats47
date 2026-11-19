import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  auditBlogAffiliatePolicyCatalog,
  auditBlogAffiliateRelevance,
} from '../lib/affiliate-relevance-core.mjs';

describe('affiliate relevance policy', () => {
  it('rejects unknown slugs, unknown verticals, and reasons without evidence', () => {
    const errors = auditBlogAffiliatePolicyCatalog(
      { ghost: { vertical: 'sports', reason: '短い' } },
      ['known'],
      ['travel'],
    );
    assert.equal(errors.length, 3);
  });

  it('makes an explicit no-ad decision override survey provenance', () => {
    const result = auditBlogAffiliateRelevance({
      articles: [{
        slug: 'golf', published: true, surveyIds: ['kakei-chousa'],
        tags: [{ tagKey: '家計調査' }, { tagKey: 'ゴルフ' }],
      }],
      policies: { golf: { vertical: null, reason: '家計調査は出典でありゴルフの購買意図ではないため広告なしとする。' } },
      surveyMap: { 'kakei-chousa': 'furusato' },
      tagMap: { '家計調査': 'economy' },
    });
    assert.equal(result.rows[0].effectiveVertical, null);
    assert.equal(result.rows[0].source, 'explicit');
    assert.equal(result.findings.length, 0);
  });

  it('surfaces unreviewed survey/tag conflicts without inventing a fix', () => {
    const result = auditBlogAffiliateRelevance({
      articles: [{ slug: 'golf', published: true, surveyIds: ['kakei-chousa'], tags: ['家計調査'] }],
      policies: {},
      surveyMap: { 'kakei-chousa': 'furusato' },
      tagMap: { '家計調査': 'economy' },
    });
    assert.equal(result.rows[0].effectiveVertical, 'furusato');
    assert.equal(result.findings[0].reason, 'survey-tag-conflict');
  });

  it('queues survey-only and multi-tag classifications for semantic review', () => {
    const result = auditBlogAffiliateRelevance({
      articles: [
        { slug: 'survey-only', surveyIds: ['kakei'], tags: ['未写像'] },
        { slug: 'tag-conflict', tags: ['旅行', '家計'] },
        { slug: 'blocked-survey', surveyIds: ['climate'], tags: ['旅行'] },
      ],
      policies: {},
      surveyMap: { kakei: 'furusato', climate: null },
      tagMap: { 旅行: 'travel', 家計: 'economy' },
    });
    assert.deepEqual(
      result.findings.map((finding) => finding.reason),
      ['survey-without-intent-tag', 'multiple-tag-verticals', 'survey-blocks-tag'],
    );
  });
});
