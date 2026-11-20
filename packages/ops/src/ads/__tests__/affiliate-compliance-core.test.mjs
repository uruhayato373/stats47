import assert from "node:assert/strict";
import test from "node:test";

import {
  auditPlacementsAgainstContent,
  findUnregisteredAffiliateTags,
  missingDisclosureReasons,
  validateDirectPlacementsStructure,
} from "../lib/affiliate-compliance-core.mjs";

// fixture: 正常な直接配置エントリ (件数は fixture 固有。実データ件数をテストに固定しない)
function validPlacement(overrides = {}) {
  return {
    id: "moshimo-fixture-001",
    asp: "moshimo",
    title: "テスト商材",
    href: "https://af.moshimo.com/af/c/click?a_id=1",
    imageUrl: "https://image.moshimo.com/af-img/1.png",
    trackingPixelUrl: "https://i.moshimo.com/af/i/impression?a_id=1",
    width: 500,
    height: 500,
    rewardNote: "¥15,000/件",
    conversionCondition: "無料診断予約",
    placements: [{ channel: "blog", slug: "some-article", position: "まとめ直下" }],
    addedAt: "2026-05-16",
    isActive: true,
    ...overrides,
  };
}

test("構造検証: 正常エントリは issue ゼロ", () => {
  assert.deepEqual(validateDirectPlacementsStructure([validPlacement()]), []);
});

test("構造検証: ID 重複を error で検出", () => {
  const issues = validateDirectPlacementsStructure([validPlacement(), validPlacement()]);
  assert.ok(issues.some((i) => i.code === "id-duplicate" && i.severity === "error"));
});

test("構造検証: http:// / protocol-relative URL を弾く", () => {
  const issues = validateDirectPlacementsStructure([
    validPlacement({ href: "http://insecure.example.com" }),
    validPlacement({ id: "x2", imageUrl: "//image.moshimo.com/af-img/1.png" }),
  ]);
  assert.ok(issues.some((i) => i.code === "href-scheme"));
  assert.ok(issues.some((i) => i.code === "image-scheme"));
});

test("構造検証: trackingPixelUrl は null 許容・https 以外は error", () => {
  assert.deepEqual(
    validateDirectPlacementsStructure([validPlacement({ trackingPixelUrl: null })]),
    [],
  );
  const issues = validateDirectPlacementsStructure([
    validPlacement({ trackingPixelUrl: "ftp://x" }),
  ]);
  assert.ok(issues.some((i) => i.code === "pixel-scheme"));
});

test("構造検証: サイズ不正・配置ゼロ・不正 channel・addedAt 形式を検出", () => {
  const issues = validateDirectPlacementsStructure([
    validPlacement({ width: 0 }),
    validPlacement({ id: "x2", placements: [] }),
    validPlacement({ id: "x3", placements: [{ channel: "twitter", slug: "s", position: "p" }] }),
    validPlacement({ id: "x4", addedAt: "2026/05/16" }),
  ]);
  for (const code of ["size-invalid", "placements-empty", "channel-invalid", "added-at-format"]) {
    assert.ok(issues.some((i) => i.code === code), `expected ${code}`);
  }
});

test("構造検証: 同一エントリ内の配置先重複を検出", () => {
  const issues = validateDirectPlacementsStructure([
    validPlacement({
      placements: [
        { channel: "blog", slug: "a", position: "p1" },
        { channel: "blog", slug: "a", position: "p2" },
      ],
    }),
  ]);
  assert.ok(issues.some((i) => i.code === "placement-duplicate"));
});

test("本文突合: 記事なし → orphaned(article-not-found)", () => {
  const p = validPlacement();
  const result = auditPlacementsAgainstContent([p], new Map([["blog:some-article", { found: false }]]));
  assert.equal(result.orphaned.length, 1);
  assert.equal(result.orphaned[0].reason, "article-not-found");
});

test("本文突合: href が本文に無い → orphaned(tag-not-found-in-body)", () => {
  const p = validPlacement();
  const contents = new Map([
    ["blog:some-article", { found: true, body: "PR（アフィリエイト）を含みます。※PR：関係ない本文" }],
  ]);
  const result = auditPlacementsAgainstContent([p], contents);
  assert.equal(result.orphaned[0].reason, "tag-not-found-in-body");
});

test("本文突合: blog は冒頭宣言と ※PR の両方が要る", () => {
  const p = validPlacement();
  const bodyWithTag = `<affiliate-banner href="${p.href}"></affiliate-banner>`;
  // 両方欠け
  let result = auditPlacementsAgainstContent(
    [p],
    new Map([["blog:some-article", { found: true, body: bodyWithTag }]]),
  );
  assert.deepEqual(result.missingDisclosure[0].missing, ["head-pr-declaration", "inline-pr-prefix"]);
  // 両方あり → 漏れなし
  result = auditPlacementsAgainstContent(
    [p],
    new Map([
      [
        "blog:some-article",
        { found: true, body: `この記事には PR（アフィリエイトリンク）を含みます。※PR：${bodyWithTag}` },
      ],
    ]),
  );
  assert.equal(result.missingDisclosure.length, 0);
  assert.equal(result.orphaned.length, 0);
});

test("本文突合: note は #PR / #広告 いずれかで OK", () => {
  assert.deepEqual(missingDisclosureReasons("note", "本文 #PR"), []);
  assert.deepEqual(missingDisclosureReasons("note", "本文 #広告 タグ"), []);
  assert.deepEqual(missingDisclosureReasons("note", "表記なし本文"), ["note-pr-hashtag-or-prefix"]);
});

test("逆方向: 台帳未登録の <affiliate-banner> href を検出", () => {
  const body = [
    '<affiliate-banner src="https://img" href="https://px.a8.net/registered" width="300"></affiliate-banner>',
    '<affiliate-banner src="https://img2" href="https://px.a8.net/unregistered"></affiliate-banner>',
  ].join("\n");
  const unregistered = findUnregisteredAffiliateTags(body, new Set(["https://px.a8.net/registered"]));
  assert.deepEqual(unregistered, ["https://px.a8.net/unregistered"]);
});
