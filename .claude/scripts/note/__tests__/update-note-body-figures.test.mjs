import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sameExceptImages, swapFigureImages } from '../update-note-body-figures.mjs';

const figure = (src, h = 620) => `<figure name="a"><img src="${src}" alt="" width="620" height="${h}"><figcaption></figcaption></figure>`;
const card = '<figure name="c" data-src="https://stats47.jp/" embedded-service="external-article"><a href="x">カード</a></figure>';
const body = `<p>本文</p>${figure('old-1.png')}<p>続き</p>${figure('old-2.png', 326)}${card}`;
const images = [{ url: 'new-1.png', width: 1080, height: 1350 }, { url: 'new-2.png', width: 1080, height: 1350 }];

test('画像の figure だけを順番どおりに替え、高さを型の比率へ直す', () => {
  const next = swapFigureImages(body, images);
  assert.ok(next.indexOf('new-1.png') < next.indexOf('new-2.png'));
  assert.ok(!next.includes('old-'));
  assert.equal((next.match(/height="775"/g) ?? []).length, 2);
  assert.ok(next.includes(card));
  assert.ok(sameExceptImages(body, next));
});

test('本文の画像の数が合わなければ止める', () => {
  assert.throws(() => swapFigureImages(body, images.slice(0, 1)), /画像が 2 枚/);
});

test('文章が変わると同じとみなさない', () => {
  assert.equal(sameExceptImages(body, body.replace('続き', '別の文')), false);
});
