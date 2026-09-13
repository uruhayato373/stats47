import test from "node:test";
import assert from "node:assert/strict";
import { auditNoteCovers, coverAuditExitCode, inspectNoteCover } from "../lib/cover-audit.mjs";

const image = "https://assets.st-note.com/body.png";
const detail = (key = "na1", overrides = {}) => ({
  key, user: { urlname: "stats47" }, status: "published", name: key,
  eyecatch: image, body: `<p>本文</p><img src="${image}">`, ...overrides,
});
const listed = (key = "na1") => detail(key);
const catalog = (keys = ["na1"]) => ({ account: "stats47", articles: keys.map((key) => ({
  key: `a-kakei-${key}`, noteUrl: `https://note.com/stats47/n/${key}`, vertical: "stats47-note",
})) });

function fetchFixture({ pages = [{ contents: [listed()], totalCount: 1, isLastPage: true }], notes = { na1: detail() } } = {}) {
  const calls = [];
  return {
    calls,
    fetchJson: async (value) => {
      const url = new URL(value);
      calls.push(url);
      const valueToReturn = url.pathname.includes("/creators/")
        ? pages[Number(url.searchParams.get("page")) - 1]
        : notes[url.pathname.split("/").at(-1)];
      if (valueToReturn instanceof Error) throw valueToReturn;
      return { data: valueToReturn };
    },
  };
}

test("本文画像が一覧に表示されても、詳細eyecatch:nullは未設定", async () => {
  const fixture = fetchFixture({ notes: { na1: detail("na1", { eyecatch: null }) } });
  const report = await auditNoteCovers({ catalog: catalog(), ...fixture });
  assert.equal(report.status, "fail");
  assert.equal(coverAuditExitCode(report), 1);
  assert.deepEqual(report.summary, { total: 1, configured: 0, missing: 1, unknown: 0, missingWithListThumbnail: 1, bodyImageUsedInList: 1 });
  assert.equal(report.groups.prefectureHousehold.missing, 1);
  assert.equal(report.articles[0].cover.url, null);
  assert.equal(report.articles[0].listThumbnail, image);
  assert.ok(fixture.calls.some((url) => url.pathname === "/api/v3/notes/na1"));
});

test("本文と同じ画像でも、詳細にカバーが設定されていれば設定済み", async () => {
  const report = await auditNoteCovers({ catalog: catalog(), ...fetchFixture() });
  assert.equal(report.coverage.complete, true);
  assert.equal(report.summary.configured, 1);
  assert.equal(report.summary.bodyImageUsedInList, 0);
  assert.equal(coverAuditExitCode(report), 0);
});

test("フィールド欠損・型変更・不正URLを未設定や設定済みに丸めない", () => {
  const { eyecatch, ...withoutField } = detail();
  assert.equal(inspectNoteCover(withoutField, "na1").reason, "eyecatch_field_missing");
  for (const value of [undefined, {}, [], 0, "", "invalid", "data:image/png;base64,abc"]) {
    assert.equal(inspectNoteCover(detail("na1", { eyecatch: value }), "na1").status, "unknown");
  }
  assert.equal(inspectNoteCover(null, "na1").status, "unknown");
});

test("別記事・別アカウント・非公開は不明として遮断する", () => {
  assert.equal(inspectNoteCover(detail("nb2"), "na1").reason, "note_key_mismatch");
  assert.equal(inspectNoteCover(detail("na1", { user: { urlname: "other" } }), "na1").reason, "account_mismatch");
  assert.equal(inspectNoteCover(detail("na1", { status: "draft" }), "na1").reason, "not_published");
});

test("詳細のHTTP失敗が1件でも、残りを記録して不完全・exit 2", async () => {
  const fixture = fetchFixture({
    pages: [{ contents: [listed(), listed("nb2")], totalCount: 2, isLastPage: true }],
    notes: { na1: detail(), nb2: new Error("HTTP 503") },
  });
  const report = await auditNoteCovers({ catalog: catalog(["na1", "nb2"]), ...fixture });
  assert.equal(report.summary.total, 2);
  assert.equal(report.summary.configured, 1);
  assert.equal(report.summary.unknown, 1);
  assert.equal(report.summary.missing, 0);
  assert.equal(report.coverage.complete, false);
  assert.equal(coverAuditExitCode(report), 2);
});

test("一覧は最終ページまで取得し、カタログにない公開記事も詳細監査する", async () => {
  const fixture = fetchFixture({
    pages: [
      { contents: [listed()], totalCount: 2, isLastPage: false },
      { contents: [listed("nb2")], totalCount: 2, isLastPage: true },
    ],
    notes: { na1: detail(), nb2: detail("nb2", { eyecatch: null }) },
  });
  const report = await auditNoteCovers({ catalog: catalog(), ...fixture });
  assert.equal(report.coverage.complete, true);
  assert.equal(report.coverage.pages.length, 2);
  assert.equal(report.summary.missing, 1);
  assert.deepEqual(report.catalogDifferences.liveOnly, ["nb2"]);
  assert.equal(report.articles.find((article) => article.noteKey === "nb2").inCatalog, false);
});

test("一覧から消えたカタログ記事も落とさず詳細取得・集合差分を出す", async () => {
  const report = await auditNoteCovers({
    catalog: catalog(["na1", "nb2"]),
    ...fetchFixture({ notes: { na1: detail(), nb2: detail("nb2") } }),
  });
  assert.equal(report.summary.total, 2);
  assert.deepEqual(report.catalogDifferences.catalogOnly, ["nb2"]);
  assert.equal(coverAuditExitCode(report), 1);
});

test("途中ページ失敗でもカタログ対象の詳細を取得し、全件成功とは報告しない", async () => {
  const report = await auditNoteCovers({ catalog: catalog(["na1", "nb2"]), ...fetchFixture({
    pages: [{ contents: [listed()], totalCount: 2, isLastPage: false }, new Error("HTTP 429")],
    notes: { na1: detail(), nb2: detail("nb2") },
  }) });
  assert.equal(report.summary.configured, 2);
  assert.equal(report.coverage.reachedLastPage, false);
  assert.equal(coverAuditExitCode(report), 2);
  assert.ok(report.coverage.issues.some((issue) => issue.code === "list_fetch_failed"));
});

test("重複・件数不一致・空の途中ページ・総数変化・pagination上限は不完全", async () => {
  const cases = [
    [{ contents: [listed(), listed()], totalCount: 1, isLastPage: true }],
    [{ contents: [listed()], totalCount: 2, isLastPage: true }],
    [{ contents: [], totalCount: 1, isLastPage: false }],
    [{ contents: [listed()], totalCount: 2, isLastPage: false }, { contents: [], totalCount: 1, isLastPage: true }],
    [{ contents: [listed()], totalCount: 2, isLastPage: false }],
    [{ contents: [listed()], isLastPage: true }],
    [{ contents: [listed()], totalCount: 1 }],
    [{ contents: [detail("na1", { user: { urlname: "other" } })], totalCount: 1, isLastPage: true }],
  ];
  for (const pages of cases) {
    const report = await auditNoteCovers({ catalog: catalog(), ...fetchFixture({ pages }), maxPages: pages.length });
    assert.equal(coverAuditExitCode(report), 2, JSON.stringify(pages));
  }
});

test("カタログ不正・重複・別アカウントURLを黙って除外しない", async () => {
  for (const invalid of [null, { account: "other", articles: [] },
    { account: "stats47", articles: [...catalog().articles, ...catalog().articles] },
    { account: "stats47", articles: [{ key: "bad", noteUrl: "https://note.com/other/n/na1" }] },
  ]) {
    const report = await auditNoteCovers({ catalog: invalid, ...fetchFixture() });
    assert.equal(coverAuditExitCode(report), 2);
    assert.ok(report.coverage.issues.some((issue) => issue.code.startsWith("catalog_")));
  }
});
