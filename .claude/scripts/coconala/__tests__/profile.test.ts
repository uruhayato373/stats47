import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { COCONALA_PROFILE as profile } from '../../../config/coconala-profile';
import { GEO_SERVICE_OFFER } from '../../../../packages/product-factory/src/channels/geo/service-offer';

const root = resolve(import.meta.dirname, '../../../..');

test('profile belongs to the configured seller and respects form limits', () => {
  const account = JSON.parse(readFileSync(resolve(root, '.claude/config/coconala-account.json'), 'utf8'));
  assert.equal(profile.userId, account.userId);
  for (const [text, limit] of [[profile.occupation, 20], [profile.headline, 50], [profile.introduction, 1300], [profile.schedule, 600]] as const) {
    assert.ok(text.length > 0 && text.length <= limit);
  }
  assert.ok(!/https?:\/\//.test(profile.introduction), 'do not add off-platform contact links');
});

test('portfolio samples are not represented as commissioned work', () => {
  for (const item of profile.portfolios) {
    assert.ok(item.title.length <= 30);
    assert.ok(item.description.length <= 200);
    assert.match(item.title, /自主制作/);
    assert.match(item.description, /受注実績ではありません/);
    assert.match(item.description, /出典：国土交通省/);
  }
});

test('specialty pricing and reusable brand assets agree with source contracts', () => {
  assert.equal(profile.specialty.minimumPriceYen, GEO_SERVICE_OFFER.priceYen);
  assert.ok(profile.specialty.description.length <= 200);
  assert.ok(existsSync(resolve(root, profile.iconSource)));
  assert.ok(existsSync(resolve(root, profile.coverSource)));
});
