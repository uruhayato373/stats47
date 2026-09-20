import test from "node:test";
import assert from "node:assert/strict";
import {
  buildArticleAudit,
  buildProfileAudit,
  extractCardUrls,
  extractNavigationUrls,
  isExpectedNoteProductRedirect,
  normalizedSitePath,
  summarizeArticleAudits,
} from "../lib/circulation-audit.mjs";

const magazinesByKey = new Map([
  ["population", { key: "population", noteUrl: "https://note.com/stats47/m/mabc123" }],
]);

function live(overrides = {}) {
  return {
    key: "nabc123",
    status: "published",
    user: { urlname: "stats47" },
    eyecatch: "https://assets.st-note.com/cover.png",
    price: 0,
    hashtag_notes: Array.from({ length: 99 }, (_, index) => ({ name: `tag${index}` })),
    belonging_magazine_keys: ["mabc123"],
    body: `
      <figure embedded-service="external-article" data-src="https://stats47.jp/ranking/population">
        <a href="https://stats47.jp/ranking/population">site</a>
      </figure>
      <a href="https://note.com/stats47/n/ndef456">related</a>
      <a href="https://note.com/stats47/m/mabc123">magazine</a>
    `,
    embedded_contents: [],
    ...overrides,
  };
}

const article = {
  key: "article-a",
  vertical: "stats47-note",
  title: "Population",
  magazine: "population",
  isPaid: false,
  priceJpy: 0,
  noteUrl: "https://note.com/stats47/n/nabc123",
  r2Body: true,
  stats47Targets: ["/ranking/population"],
};

test("URL and card extraction deduplicates href/data-src and decodes ampersands", () => {
  const body = '<figure embedded-service="external-article" data-src="https://stats47.jp/a?x=1&amp;y=2"><a href="https://stats47.jp/a?x=1&amp;y=2">x</a></figure>';
  assert.deepEqual(extractNavigationUrls(body), ["https://stats47.jp/a?x=1&y=2"]);
  assert.deepEqual(extractCardUrls(body), ["https://stats47.jp/a?x=1&y=2"]);
  assert.equal(normalizedSitePath("https://stats47.jp/a?x=1&y=2"), "/a");
});

test("orphaned embedded metadata is ignored after a card URL replacement", () => {
  const body = '<figure embedded-service="external-article" data-src="https://stats47.jp/new"><a href="https://stats47.jp/new">new</a></figure>';
  const embedded = [{ service: "external-article", url: "https://stats47.jp/old" }];
  assert.deepEqual(extractNavigationUrls(body, embedded), ["https://stats47.jp/new"]);
  assert.deepEqual(extractCardUrls(body, embedded), ["https://stats47.jp/new"]);
});

test("healthy article satisfies hard gates", () => {
  const audit = buildArticleAudit({
    article,
    live: live(),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
    eligibleRelatedNoteKeys: new Set(["ndef456"]),
    linkHealthByUrl: new Map([["https://stats47.jp/ranking/population", { status: 200, finalStatus: 200, redirected: false }]]),
  });
  assert.deepEqual(audit.errors, []);
  assert.deepEqual(audit.warnings, []);
  assert.equal(audit.linkCounts.cards, 1);
  assert.equal(audit.linkCounts.relatedNote, 1);
});

test("circulation audit counts an absent cover independently of body images", () => {
  const audit = buildArticleAudit({
    article,
    live: live({ eyecatch: null, body: `${live().body}<img src="https://assets.st-note.com/body.png">` }),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
  });
  assert.deepEqual(audit.errors, [{ code: "cover_missing" }]);
  assert.equal(audit.cover.status, "missing");
  const summary = summarizeArticleAudits([audit]);
  assert.equal(summary.coversConfigured, 0);
  assert.equal(summary.coversMissing, 1);
  assert.equal(summary.coversUnknown, 0);
});

test("catalog-declared pinned and profile article states are hard-gated", () => {
  const audit = buildArticleAudit({
    article: { ...article, pinned: true, profiled: true },
    live: live({ is_pinned: false, is_profiled: false }),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
    eligibleRelatedNoteKeys: new Set(["ndef456"]),
  });
  assert.ok(audit.errors.some((issue) => issue.code === "expected_pinned_article_missing"));
  assert.ok(audit.errors.some((issue) => issue.code === "expected_profile_article_missing"));
});

test("a cataloged legacy separator cannot silently disappear", () => {
  const audit = buildArticleAudit({
    article: { ...article, publishedSeparator: "separator-1" },
    live: live({ separator: null }),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
    eligibleRelatedNoteKeys: new Set(["ndef456"]),
  });
  assert.ok(audit.errors.some((issue) => issue.code === "published_separator_mismatch"));
});

test("hard failures surface account, hashtags, target, membership and broken URL", () => {
  const audit = buildArticleAudit({
    article,
    live: live({
      user: { urlname: "another-account" },
      hashtag_notes: Array.from({ length: 94 }),
      belonging_magazine_keys: [],
      body: '<a href="https://stats47.jp/broken">broken</a>',
    }),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
    eligibleRelatedNoteKeys: new Set(["ndef456"]),
    linkHealthByUrl: new Map([["https://stats47.jp/broken", { status: 410, finalStatus: 410, redirected: false }]]),
  });
  assert.deepEqual(
    audit.errors.map((error) => error.code),
    ["account_mismatch", "cover_unknown", "hashtags_below_95", "missing_magazine_membership", "missing_catalog_site_target", "broken_site_link"],
  );
  assert.ok(audit.warnings.some((warning) => warning.code === "missing_related_note_link"));
});

test("tracked URL card is warned while plain card remains valid", () => {
  const audit = buildArticleAudit({
    article,
    live: live({
      body: '<figure embedded-service="external-article" data-src="https://stats47.jp/ranking/population?utm_source=note"><a href="https://stats47.jp/ranking/population?utm_source=note">site</a></figure>',
    }),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123"]),
    eligibleRelatedNoteKeys: new Set(),
  });
  assert.ok(audit.warnings.some((warning) => warning.code === "tracked_url_used_as_card"));
});

test("clean note product path accepts only the exact article-attributed redirect", () => {
  const source = "https://stats47.jp/products/kindle-k-s1-09/from/note/n66a286b5211b";
  const valid = {
    status: 307,
    finalStatus: 200,
    redirected: true,
    finalUrl: "https://stats47.jp/products/kindle-k-s1-09?utm_source=note&utm_medium=referral&utm_campaign=note_product&utm_content=n66a286b5211b",
  };
  assert.equal(isExpectedNoteProductRedirect(source, valid), true);
  assert.equal(isExpectedNoteProductRedirect(source, {
    ...valid,
    finalUrl: valid.finalUrl.replace("n66a286b5211b", "nwrong"),
  }), false);
  const audit = buildArticleAudit({
    article,
    live: live({
      body: `${live().body}<a href="${source}">product</a>`,
    }),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
    eligibleRelatedNoteKeys: new Set(["ndef456"]),
    linkHealthByUrl: new Map([
      ["https://stats47.jp/ranking/population", { status: 200, finalStatus: 200, redirected: false }],
      [source, valid],
    ]),
  });
  assert.equal(audit.warnings.some((warning) => warning.code === "redirected_site_link"), false);
});

test("profile and aggregate summaries expose growth gaps", () => {
  const profile = buildProfileAudit({ urlname: "stats47", profile: "", externalLinks: {}, headerImageUrl: null });
  assert.deepEqual(profile.warnings.map((warning) => warning.code), [
    "profile_bio_missing",
    "profile_site_link_missing",
    "profile_header_missing",
  ]);
  const audit = buildArticleAudit({
    article,
    live: live(),
    magazinesByKey,
    catalogNoteKeys: new Set(["nabc123", "ndef456"]),
    eligibleRelatedNoteKeys: new Set(["ndef456"]),
  });
  const summary = summarizeArticleAudits([audit]);
  assert.equal(summary.total, 1);
  assert.equal(summary.compliantHashtags, 1);
  assert.equal(summary.withRelatedNoteLink, 1);
});

test("paid article does not require free-preview growth CTAs", () => {
  const article = buildArticleAudit({
    article: {
      key: "paid",
      title: "paid",
      vertical: "stats47-note",
      isPaid: true,
      priceJpy: 300,
      r2Body: true,
      noteUrl: "https://note.com/stats47/n/n111",
      magazine: null,
      stats47Targets: ["/geo/method"],
    },
    live: {
      key: "n111",
      status: "published",
      price: 300,
      user: { urlname: "stats47" },
      hashtag_notes: Array.from({ length: 99 }),
      belonging_magazine_keys: [],
      body: "<p>試し読み本文</p>",
      embedded_contents: [],
    },
    magazinesByKey: new Map(),
    catalogNoteKeys: new Set(["n111"]),
    eligibleRelatedNoteKeys: new Set(),
  });
  assert.equal(article.errors.some((issue) => issue.code === "missing_catalog_site_target"), false);
  // 無料記事向けの回遊 CTA 警告は出ない (有料記事の着地品質 paid_* は別系統で下のテストが固定する)
  assert.deepEqual(article.warnings.filter((issue) => !issue.code.startsWith("paid_")), []);
});

function paidFixture({ price = 2980, body, magazine = "s47-kakei-reading", vertical = "stats47-note", inboundNoteLinkCount = 0, magazinesByKey = new Map() }) {
  return buildArticleAudit({
    article: {
      key: "paid-dataset",
      title: "dataset",
      vertical,
      isPaid: true,
      priceJpy: price,
      r2Body: true,
      noteUrl: "https://note.com/stats47/n/n222",
      magazine,
      stats47Targets: [],
    },
    live: {
      key: "n222",
      status: "published",
      price,
      user: { urlname: "stats47" },
      hashtag_notes: Array.from({ length: 99 }),
      belonging_magazine_keys: [],
      body,
      embedded_contents: [],
    },
    magazinesByKey,
    catalogNoteKeys: new Set(["n222"]),
    eligibleRelatedNoteKeys: new Set(),
    inboundNoteLinkCount,
  });
}

test("paid data product without source/intro/image/inbound in the free preview fails every landing check", () => {
  // 2026-09-20 の d-kakei-category-dataset 公開時点の無料部分を模す (出典・導入・画像・流入が全部無い)
  const audit = paidFixture({ body: "<p>家計調査の十大費目を並べると、教育費は8.7倍です。</p><h2>配布するデータ</h2>" });
  const codes = audit.errors.map((issue) => issue.code);
  // 「家計調査」は統計名なので source 判定は通ってしまう → 統計名すら無い本文で source 欠落を固定する
  const noSource = paidFixture({ body: "<p>十大費目を並べると、教育費は8.7倍です。</p>" });
  assert.ok(noSource.errors.some((issue) => issue.code === "paid_free_missing_source"));
  assert.ok(codes.includes("paid_free_missing_intro"), "¥1,000 以上は導入欠落を error にする");
  assert.ok(codes.includes("paid_free_missing_image"));
  assert.ok(codes.includes("paid_no_inbound_note_link"));
  assert.deepEqual(audit.paidLanding.checks, { source: true, intro: false, image: false, inbound: false });
});

test("paid data product with source, intro, sample image and an inbound link passes", () => {
  const audit = paidFixture({
    inboundNoteLinkCount: 53,
    body: '<h2>こんな人のためのデータです</h2><p>出店担当者向け</p><figure><img src="https://assets.st-note.com/x.png"></figure>'
      + "<p>出典：総務省統計局「家計調査」を加工して作成</p>",
  });
  assert.deepEqual(audit.errors.filter((issue) => issue.code.startsWith("paid_")), []);
  assert.deepEqual(audit.warnings.filter((issue) => issue.code.startsWith("paid_")), []);
  assert.deepEqual(audit.paidLanding.issueCodes, []);
});

test("cheap paid ranking notes get warnings for intro/image/inbound but source is still a hard error", () => {
  const audit = paidFixture({ price: 200, magazine: "s47-fiscal", body: "<p>都道府県別の順位です。</p>" });
  assert.deepEqual(audit.errors.filter((issue) => issue.code.startsWith("paid_")).map((issue) => issue.code), ["paid_free_missing_source"]);
  assert.deepEqual(
    audit.warnings.filter((issue) => issue.code.startsWith("paid_")).map((issue) => issue.code).sort(),
    ["paid_free_missing_image", "paid_free_missing_intro", "paid_no_inbound_note_link"],
  );
});

test("chapters of paid (tutorial) magazines are outside the data-source landing rule, even under the stats47-note vertical", () => {
  const paidMagazines = new Map([
    ["koumuin-claude-code", { key: "koumuin-claude-code", isPaid: true, noteUrl: "https://note.com/stats47/m/m512ad7023815" }],
    ["product-d3-colors", { key: "product-d3-colors", isPaid: true, noteUrl: "https://note.com/stats47/m/mfe0fab2606eb" }],
    ["s47-fiscal", { key: "s47-fiscal", isPaid: false, noteUrl: "https://note.com/stats47/m/m30bb1cee28f7" }],
  ]);
  const tutorial = paidFixture({ price: 300, vertical: "koumuin-claude-code", magazine: "koumuin-claude-code", body: "<p>設定手順</p>", magazinesByKey: paidMagazines });
  assert.equal(tutorial.paidLanding, null);
  // catalog では vertical が stats47-note でも、有料マガジンの章 (paid-n* の Claude Code 記事) は対象外
  const chapter = paidFixture({ price: 300, vertical: "stats47-note", magazine: "koumuin-claude-code", body: "<p>設定手順</p>", magazinesByKey: paidMagazines });
  assert.equal(chapter.paidLanding, null);
  assert.deepEqual(chapter.errors.filter((issue) => issue.code.startsWith("paid_")), []);
  const colours = paidFixture({ price: 200, magazine: "product-d3-colors", body: "<p>配色</p>", magazinesByKey: paidMagazines });
  assert.equal(colours.paidLanding, null);
  // 無料マガジンに入っている ¥200 のランキング記事は対象
  const ranking = paidFixture({ price: 200, magazine: "s47-fiscal", body: "<p>順位</p>", magazinesByKey: paidMagazines });
  assert.ok(ranking.paidLanding);
});

test("summary exposes paid landing compliance so the weekly gate can fail on it", () => {
  const good = paidFixture({
    inboundNoteLinkCount: 1,
    body: '<p>こんな人向け</p><img src="x.png"><p>出典：e-Stat を加工して作成</p>',
  });
  const bad = paidFixture({ body: "<p>本文のみ</p>" });
  const summary = summarizeArticleAudits([good, bad]);
  assert.equal(summary.paidLandingApplicable, 2);
  assert.equal(summary.paidLandingCompliant, 1);
  assert.equal(summary.paidLandingErrors, 4);
  assert.equal(summary.paidLandingWarnings, 0);
});

test("free singleton article does not invent an unrelated note CTA", () => {
  const audit = buildArticleAudit({
    article: { ...article, magazine: null, stats47Targets: [] },
    live: live({ body: '<a href="https://stats47.jp">site</a>', belonging_magazine_keys: [] }),
    magazinesByKey: new Map(),
    catalogNoteKeys: new Set(["nabc123"]),
    eligibleRelatedNoteKeys: new Set(),
  });
  assert.equal(audit.warnings.some((issue) => issue.code === "missing_related_note_link"), false);
});

test("profile biography can expose the stats47 site when note has no generic website field", () => {
  const profile = buildProfileAudit({
    urlname: "stats47",
    profile: "全県データは https://stats47.jp で公開",
    externalLinks: {},
    headerImageUrl: null,
  });
  assert.equal(profile.hasBio, true);
  assert.equal(profile.hasSiteLink, true);
  assert.deepEqual(profile.warnings, [{ code: "profile_header_missing" }]);
});

test("two 次に読む headings in a live body are warned", () => {
  const audit = paidFixture({ price: 0, body: '<p>本文</p><hr><h2>次に読む</h2><p>a</p><hr><h2>次に読む</h2><p>b</p>' });
  assert.ok(audit.warnings.some((issue) => issue.code === "duplicate_footer_heading" && issue.detail === 2));
  const single = paidFixture({ price: 0, body: '<p>本文</p><hr><h2>次に読む</h2><p>a</p>' });
  assert.equal(single.warnings.some((issue) => issue.code === "duplicate_footer_heading"), false);
});
