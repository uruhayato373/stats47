import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fetchStatsListPage, fetchMetaInfo, fetchStatsData, listAllTables } from "./api.mjs";
const require = createRequire(import.meta.url);
const { extractYears, main, TARGETS } = require("../../estat/audit-time-coverage.cjs");
const respond = (body) => new Response(JSON.stringify(body));
test("catalog adapters preserve query/output shapes and use the shared limit/redaction", async (t) => {
  const calls = [];
  const bodies = [
    { GET_STATS_LIST: { RESULT: { STATUS: 0 }, DATALIST_INF: { NUMBER: 2, TABLE_INF: { '@id': 'x' }, RESULT_INF: { NEXT_KEY: 2 } } } },
    { GET_META_INFO: { RESULT: { STATUS: 0 }, METADATA_INF: { TABLE_INF: { '@id': 'x' } }, PARAMETER: { APP_ID: 'test-id' } } },
    { GET_STATS_DATA: { RESULT: { STATUS: 0 }, STATISTICAL_DATA: { RESULT_INF: { NEXT_KEY: 2 } } } },
    { GET_STATS_LIST: { RESULT: { STATUS: 1 } } },
  ];
  t.mock.method(globalThis, 'fetch', async (url, options) => { calls.push({ url: new URL(url), options }); return respond(bodies.shift()); });
  assert.deepEqual(await fetchStatsListPage(null, 1, 'test-id'), { tables: [{ '@id': 'x' }], total: 2, nextKey: 2 });
  assert.deepEqual((await fetchMetaInfo('x', 'test-id')).GET_META_INFO.PARAMETER, {});
  assert.equal((await fetchStatsData({ statsDataId: 'x', limit: '200000', startPosition: '2' }, 'test-id')).GET_STATS_DATA.STATISTICAL_DATA.RESULT_INF.NEXT_KEY, 2);
  assert.deepEqual(await fetchStatsListPage('2', 1, 'test-id'), { tables: [], total: 0, nextKey: null });
  assert.deepEqual(calls.map(({ url }) => url.pathname.split('/').at(-1)), ['getStatsList', 'getMetaInfo', 'getStatsData', 'getStatsList']);
  assert.equal(calls[0].url.searchParams.has('collectArea'), false);
  assert.equal(calls[2].url.searchParams.get('limit'), '100000');
  assert.equal(calls[2].url.searchParams.get('startPosition'), '2');
  assert.equal(calls[3].url.searchParams.get('collectArea'), '2');
  assert.ok(calls.every(({ options }) => options.method === 'GET'));
});
test("catalog errors fail without echoing credentials", async (t) => {
  t.mock.method(globalThis, 'fetch', async () => respond({ GET_META_INFO: { RESULT: { STATUS: 100, ERROR_MSG: 'test-id' } } }));
  await assert.rejects(fetchMetaInfo('x', 'test-id'), /Invalid getMetaInfo/);
});
test("time coverage keeps year extraction and calls full pagination entry for every target", async (t) => {
  const json = { GET_STATS_DATA: { STATISTICAL_DATA: { CLASS_INF: { CLASS_OBJ: { '@id': 'time', CLASS: [{ '@code': '2020000000' }, { '@code': '2021000000' }] } }, DATA_INF: { VALUE: [{ '@time': '2021000000', $: '5' }] } } } };
  assert.deepEqual(extractYears(json), { years: ['2021'], metaYears: ['2020', '2021'], valueCount: 1 });
  const calls = [];
  t.mock.method(globalThis, 'setTimeout', (fn) => { fn(); return 0; });
  t.mock.method(console, 'log', () => {});
  await main({ fetchAll: async (params) => { calls.push(params); return { response: json }; } });
  assert.equal(calls.length, TARGETS.length);
  assert.ok(calls.every((params) => params.lvArea === '2' && !('cdTime' in params)));
});
