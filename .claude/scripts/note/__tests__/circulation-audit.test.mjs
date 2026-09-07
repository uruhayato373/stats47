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
    ["account_mismatch", "hashtags_below_95", "missing_magazine_membership", "missing_catalog_site_target", "broken_site_link"],
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
  assert.deepEqual(article.warnings, []);
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
