import assert from "node:assert/strict";
import test from "node:test";

import {
  lintConsecutiveCallouts,
  normalizeConsecutiveCallouts,
} from "../article-structure-lint.mjs";

test("通常本文を挟まない callout 連続配置を blocker にする", () => {
  const markdown = `> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.blockers.length, 1);
  assert.equal(result.stats.adjacentCalloutClusters, 1);
  assert.equal(result.stats.adjacentCalloutPairs, 1);
  assert.equal(result.stats.maxConsecutiveCallouts, 2);
  assert.deepEqual(result.stats.adjacentCalloutLocations, [
    { line: 1, types: ["WARNING", "TIP"] },
  ]);
});

test("3個の連続配置を1 cluster・2 pairsとして数える", () => {
  const markdown = `> [!NOTE]
> 定義です。

> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.stats.adjacentCalloutClusters, 1);
  assert.equal(result.stats.adjacentCalloutPairs, 2);
  assert.equal(result.stats.maxConsecutiveCallouts, 3);
});

test("通常本文・見出し・図を挟む配置は許可する", () => {
  const markdown = `> [!WARNING]
> 注意です。

### 読み解き

本文です。

> [!TIP]
> 読み方です。`;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.blockers.length, 0);
  assert.equal(result.stats.adjacentCalloutClusters, 0);
});

test("fenced code 内の callout 記法例は無視する", () => {
  const markdown = `\`\`\`markdown
> [!NOTE]
> 記法例

> [!TIP]
> 記法例
\`\`\``;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.stats.calloutCount, 0);
  assert.equal(result.blockers.length, 0);
});

test("正規化は最重要の WARNING を残し、NOTE と TIP の文言を通常本文へ戻す", () => {
  const markdown = `> [!NOTE]
> 定義です。

> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;
  const normalized = normalizeConsecutiveCallouts(markdown);

  assert.match(normalized, /\*\*補足:\*\* 定義です。/);
  assert.match(normalized, /> \[!WARNING\]\n> 注意です。/);
  assert.match(normalized, /\*\*読み解きのポイント:\*\* 読み方です。/);
  assert.equal(lintConsecutiveCallouts(normalized).stats.adjacentCalloutClusters, 0);
});

test("連続していない callout は正規化しても変更しない", () => {
  const markdown = `> [!NOTE]
> 定義です。

本文です。

> [!TIP]
> 読み方です。`;

  assert.equal(normalizeConsecutiveCallouts(markdown), markdown);
});
