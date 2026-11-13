/** 橋梁点検の取り込みが、提案なしの経路で使う TS の検査関数を読み込めることを固定する。 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSnapshotParser } from '../ingest-bridge-inspection-age.mjs';

test('the strict snapshot parser loads from TS and rejects a non-contract snapshot', async () => {
  const parse = loadSnapshotParser(process.cwd());
  await assert.rejects(
    async () => parse({}),
    (error) => {
      // 読み込みの失敗 (ERR_MODULE_NOT_FOUND) ではなく、検査そのものの失敗でなければならない
      assert.notEqual(error.code, 'ERR_MODULE_NOT_FOUND', String(error.message));
      return true;
    }
  );
});
