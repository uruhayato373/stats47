import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRegisteredCards, registerMissingCards, replaceCardKeys, unregisteredCards } from '../lib/native-cards.mjs';

const body = '<h2 id="boundary">次に読む</h2><figure data-src="https://note.com/stats47/n/n023501038bd5" embedded-service="note" embedded-content-key="embFake"></figure>';

test('a saved URL and figure are not a registered card', () => {
  assert.equal(unregisteredCards(body, []).length, 1);
  assert.throws(() => assertRegisteredCards(body, []), /Unregistered/);
});

test('a registry entry without display content is unresolved', () => {
  assert.throws(() => assertRegisteredCards(body, [{ key: 'embFake', html_for_embed: '' }]), /Unregistered/);
});

test('a complete native registry entry satisfies the registration gate', () => {
  assert.doesNotThrow(() => assertRegisteredCards(body, [{ key: 'embFake', html_for_embed: '<iframe></iframe>' }]));
});

test('unknown registry state cannot be reported compliant', () => {
  assert.throws(() => unregisteredCards(body, null), /unavailable/);
});

test('card repair only changes a figure registry reference, preserving boundary and authored text', () => {
  const source = `${body}<p>embFake is quoted by the author.</p>`;
  assert.equal(replaceCardKeys(source, new Map([['embFake', 'embNative']])), source.replace('embedded-content-key="embFake"', 'embedded-content-key="embNative"'));
});

test('a registry key for another destination does not validate a changed sales card', () => {
  assert.throws(() => assertRegisteredCards(body, [{ key: 'embFake', url: 'https://note.com/stats47/n/n323af74c09cc', service: 'note', html_for_embed: '<iframe></iframe>' }]), /Unregistered/);
});

test('an external figure must acquire a server-issued key before it is publishable', async () => {
  const external = '<figure data-src="https://stats47.jp" embedded-service="external-article" embedded-content-key="embFake"></figure>';
  const calls = [];
  const page = { evaluate: async (_fn, request) => { calls.push(request); return { key: 'embNative', html_for_embed: '<div>stats47</div>' }; } };
  const result = await registerMissingCards(page, 'nf962c6702b93', external, []);
  assert.equal(calls.length, 1);
  assert.match(calls[0].pathname, /^\/api\/v2\/embed_by_external_api\?/);
  assert.deepEqual(result.registered, ['embNative']);
  assert.doesNotThrow(() => assertRegisteredCards(result.body, [{ key: 'embNative', url: 'https://stats47.jp', service: 'external-article', html_for_embed: '<div>stats47</div>' }]));
});
