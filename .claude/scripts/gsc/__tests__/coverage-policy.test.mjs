import test from "node:test";
import assert from "node:assert/strict";

import {
  isIntentionallyNonIndexableResource,
  readHtmlIndexSignals,
} from "../coverage-policy.mjs";

test("sitemap と OGP/静的素材はページ是正対象にしない", () => {
  const resources = [
    "https://stats47.jp/sitemap.xml",
    "https://stats47.jp/sitemap/7.xml",
    "https://stats47.jp/favicon.ico",
    "https://stats47.jp/app/home/previews/search.avif",
    "https://stats47.jp/areas/04000/opengraph-image",
    "https://stats47.jp/movie/example.webm",
    "https://stats47.jp/_next/static/media/font.woff2",
  ];
  for (const url of resources) {
    assert.equal(isIntentionallyNonIndexableResource(url), true, url);
  }
});

test("robots noindex と soft not-found title を分けて検出する", () => {
  assert.deepEqual(
    readHtmlIndexSignals(
      '<html><head><meta name="robots" content="noindex, follow"><title>記事一覧</title></head></html>',
    ),
    { robotsNoindex: true, softNotFound: false },
  );
  assert.deepEqual(
    readHtmlIndexSignals(
      "<html><head><title>記事が見つかりません | stats47</title></head></html>",
      "noindex",
    ),
    { robotsNoindex: true, softNotFound: true },
  );
});

test("通常の HTML route は対象のままにする", () => {
  assert.equal(
    isIntentionallyNonIndexableResource("https://stats47.jp/ranking/population"),
    false,
  );
  assert.equal(
    isIntentionallyNonIndexableResource("https://stats47.jp/blog/example"),
    false,
  );
});
