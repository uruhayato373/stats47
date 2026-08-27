import { test } from "node:test";
import assert from "node:assert/strict";

import { extractAfbHref, extractAfbPixelUrl, parseAfbCode } from "../lib/afb-code-core.mjs";

const BANNER_CODE = `<a href="https://t.afi-b.com/visit.php?guid=ON&amp;a=A12345-b123456C&amp;p=P123456x" rel="nofollow"><img src="https://www.afi-b.com/upload_image/12345-sample.jpg" width="300" height="250" style="border:none;" alt="Sample" /></a><img src="https://t.afi-b.com/lead/A12345/P123456x/b123456C" width="1" height="1" style="border:none;" />`;
const TEXT_CODE = `<a href="https://t.afi-b.com/visit.php?a=A12345-b123456C&amp;p=P123456x" rel="nofollow">Sample</a><img src="https://t.afi-b.com/lead/A12345/P123456x/b123456C" width="1" height="1" style="border:none;" />`;

test("afb バナー原稿からクリック URL・画像・計測ピクセルを一組で抽出する", () => {
  assert.equal(extractAfbHref(BANNER_CODE)?.includes("&a=A12345-b123456C"), true);
  assert.equal(extractAfbPixelUrl(BANNER_CODE), "https://t.afi-b.com/lead/A12345/P123456x/b123456C");
  const parsed = parseAfbCode(BANNER_CODE);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.fields, {
    htmlContent: "https://t.afi-b.com/visit.php?guid=ON&a=A12345-b123456C&p=P123456x",
    imageUrl: "https://www.afi-b.com/upload_image/12345-sample.jpg",
    trackingPixelUrl: "https://t.afi-b.com/lead/A12345/P123456x/b123456C",
    width: 300,
    height: 250,
    adType: "banner",
  });
});

test("afb テキスト原稿はサイズなしで抽出する", () => {
  const parsed = parseAfbCode(TEXT_CODE);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.fields.adType, "text");
  assert.equal(parsed.fields.imageUrl, null);
  assert.equal(parsed.fields.width, null);
});

test("計測ピクセル欠落と非 canonical サイズを拒否する", () => {
  assert.equal(parseAfbCode(`<a href="https://t.afi-b.com/visit.php?a=A&amp;p=P">x</a>`).error, "no-afb-lead-pixel");
  const nonCanonical = BANNER_CODE.replace('width="300" height="250"', 'width="160" height="600"');
  assert.equal(parseAfbCode(nonCanonical).error, "non-canonical-size:160x600");
});

test("afb 以外の URL と空コードを拒否する", () => {
  assert.equal(parseAfbCode("").error, "empty-html");
  assert.equal(parseAfbCode(`<a href="https://example.com/">x</a><img src="https://t.afi-b.com/lead/A/P/B" width="1" height="1">`).error, "no-afb-click-url");
});
