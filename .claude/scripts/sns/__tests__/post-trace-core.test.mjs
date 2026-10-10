import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { checkPostTrace } from "../lib/post-trace-core.mjs";

const require = createRequire(import.meta.url);
const { externalIdOf } = require("../../lib/sns-posts-store.cjs");

const CUTOVER = "2026-10-10T00:00:00.000Z";
const SHA = "a".repeat(64);
const approved = { state: "approved", by: "owner", at: "2026-10-11T00:00:00Z", via: "approve-posts" };

const legacyX = {
  id: 1, platform: "x", post_type: "original", domain: "ranking", status: "posted",
  post_url: "https://x.com/stats47jp373/status/111", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z",
  approval: { state: "unrecorded" },
};
const newIg = {
  id: 2, platform: "instagram", post_type: "carousel", domain: "ranking-quiz", status: "posted",
  post_url: "https://www.instagram.com/p/ABC/", external_id: "18100000000000000",
  created_at: "2026-10-11T00:00:00Z", updated_at: "2026-10-11T00:00:00Z", approval: approved,
  assets: [{ role: "slide", order: 1, state: "archived", drive_path: "SNS素材/instagram/2/slide-1.png", sha256: SHA, bytes: 10, mime: "image/png", source: "sns/ranking-quiz/k/instagram/stills/slide-1.png" }],
};
const newYt = {
  id: 3, platform: "youtube", post_type: "video", domain: "ranking", status: "draft",
  created_at: "2026-10-11T00:00:00Z", updated_at: "2026-10-11T00:00:00Z", approval: { state: "pending" },
  script_path: "data/sns/scripts/3.json",
};
const script3 = { post_id: 3, title: "t", description: "d", sources: [{ url: "https://stats47.jp/ranking/x" }] };

function run(posts, { scripts = { "data/sns/scripts/3.json": script3 }, metricRows = [] } = {}) {
  const maxId = Math.max(0, ...posts.map((p) => p.id));
  return checkPostTrace({
    ledger: { _meta: { count: posts.length, nextId: maxId + 1 }, posts },
    readScript: (p) => scripts[p] ?? null,
    metricRows,
    externalIdOf,
    cutover: CUTOVER,
  });
}
const clone = (o) => structuredClone(o);

test("契約を満たす台帳は error 0 件で、旧行の unrecorded は許す", () => {
  const { errors } = run([legacyX, newIg, newYt], { metricRows: [{ date: "2026-10-11", sns_post_id: "2", platform: "instagram" }] });
  assert.deepEqual(errors, []);
});

test("カットオーバー以降に承認なしで posted になった行は error (承認を通らない投稿の検出)", () => {
  const row = { ...clone(newIg), approval: { state: "pending" } };
  assert.match(run([row]).errors.join("\n"), /承認されていない投稿が posted/);
});

test("カットオーバー以降の行に unrecorded は使えない (記録なしの逃げ道にしない)", () => {
  const row = { ...clone(newYt), approval: { state: "unrecorded" } };
  assert.match(run([row]).errors.join("\n"), /unrecorded は使えません/);
});

test("approved / rejected は誰がいつを必須にする", () => {
  const row = { ...clone(newIg), approval: { state: "approved" } };
  assert.match(run([row]).errors.join("\n"), /schema .*approval/);
});

test("カットオーバー以降の Instagram の posted 行は media_id が無ければ error", () => {
  const row = clone(newIg);
  delete row.external_id;
  assert.match(run([row]).errors.join("\n"), /external_id/);
});

test("素材の置き場は SNS素材/<platform>/<id>/ の中だけ", () => {
  const row = clone(newIg);
  row.assets[0].drive_path = "SNS素材/instagram/999/slide-1.png";
  assert.match(run([row]).errors.join("\n"), /SNS素材\/instagram\/2\/ の外/);
});

test("archived の素材は sha256 が、missing の素材は理由が必須", () => {
  const noSha = clone(newIg);
  delete noSha.assets[0].sha256;
  assert.match(run([noSha]).errors.join("\n"), /sha256/);
  const missing = clone(newIg);
  missing.assets[0] = { role: "slide", order: 1, state: "missing" };
  assert.match(run([missing]).errors.join("\n"), /reason/);
});

test("台本は実在し、形と post_id が行と一致しなければ error", () => {
  assert.match(run([newYt], { scripts: {} }).errors.join("\n"), /script_path .* がありません/);
  assert.match(run([newYt], { scripts: { "data/sns/scripts/3.json": { ...script3, post_id: 9 } } }).errors.join("\n"), /post_id=9/);
  assert.match(run([newYt], { scripts: { "data/sns/scripts/3.json": { ...script3, sources: [] } } }).errors.join("\n"), /台本の形/);
});

test("台帳に無い id を指す指標行は、カットオーバー以降だけ error にする", () => {
  const after = run([legacyX], { metricRows: [{ date: "2026-10-11", sns_post_id: "77", platform: "x" }] });
  assert.match(after.errors.join("\n"), /sns_post_id=77/);
  const before = run([legacyX], { metricRows: [{ date: "2026-05-17", sns_post_id: "77", platform: "x" }] });
  assert.deepEqual(before.errors, []);
  assert.match(before.warnings.join("\n"), /台帳に無い id/);
});

test("id の重複と _meta の食い違いを止める", () => {
  const { errors } = checkPostTrace({
    ledger: { _meta: { count: 5, nextId: 1 }, posts: [legacyX, legacyX] },
    readScript: () => null, metricRows: [], externalIdOf, cutover: CUTOVER,
  });
  const text = errors.join("\n");
  assert.match(text, /重複/);
  assert.match(text, /_meta.count/);
  assert.match(text, /_meta.nextId/);
});
