import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { StorefrontProduct } from "../../../../apps/web/src/features/products/types";
import { buildPreviewFiles, createPreviewServer, writePreviewFiles } from "../build-product-landing-preview";
import { R2_PUBLIC_BASE_URL } from "../../lib/site-config.cjs";

const product: StorefrontProduct = {
  id: "P-01", slug: "data-first", channel: "note", channelLabel: "note",
  title: "正式な商品名", displayTitle: "短い商品名", description: "地域の違いを比較できます。",
  priceYen: 980, externalUrl: "https://note.com/stats47/n/test",
  included: ["CSV・Excel"], audience: [], sourceBlogSlugs: [],
  useCases: [{ title: "資料作りに", description: "自県と他県を比較できます。" }],
  showcase: [{ kind: "chart", heading: "人口を比べる", lead: "棒グラフで示せます。", figures: [{ file: "population.png", alt: "総人口（2025年）" }] }],
  showcaseNote: "収録版の値から作成。", purchaseNotes: ["指標ごとの基準年をご確認ください。"],
};

test("両形式の本文・順序を共有し、公開用 Markdown に localhost を混ぜない", () => {
  const files = buildPreviewFiles([product]);
  const markdown = files.get("data-first.md")!;
  const html = files.get("data-first.html")!;
  for (const text of [product.description, product.included[0], product.useCases![0].description, product.showcase![0].lead, product.purchaseNotes![0], "980円"]) {
    assert.ok(markdown.includes(text), text);
    assert.ok(html.includes(text), text);
  }
  assert.ok(markdown.includes(`![総人口（2025年）](${R2_PUBLIC_BASE_URL}/app/products/data-first/showcase/population.png)`));
  assert.ok(!markdown.includes("localhost") && !markdown.includes("127.0.0.1"));
  assert.ok(!markdown.includes("paid:start") && !markdown.includes(".zip"));
  assert.ok(html.includes('src="http://127.0.0.1:4777/app/products/data-first/showcase/population.png"'));
  assert.match(markdown, /## 作成例\n\n### 人口を比べる/);
  assert.match(html, /<h2>作成例<\/h2>\n<h3>人口を比べる<\/h3>/);
});

test("note 商品だけを商品 ID 順に並べ、前後の商品とサイト LP へ移動できる", () => {
  const next = { ...product, id: "P-02", slug: "data-second" };
  const kindle: StorefrontProduct = { ...product, id: "K-01", slug: "kindle-book", channel: "kindle" };
  const files = buildPreviewFiles([next, kindle, product]);
  assert.equal(files.size, 5);
  assert.ok(!files.has("kindle-book.html"));
  assert.ok(files.get("data-first.html")!.includes('href="data-second.html">次：'));
  assert.ok(files.get("data-second.html")!.includes('href="data-first.html">前：'));
  const index = files.get("index.html")!;
  assert.ok(index.indexOf("P-01") < index.indexOf("P-02"));
  assert.ok(index.includes("http://127.0.0.1:3000/products/data-first"));
});

test("改訂候補を現在販売中と案内せず、未公開の図はローカルから表示する", () => {
  const files = buildPreviewFiles([product], { revision: true });
  for (const content of files.values()) {
    assert.ok(!content.includes('980円'));
    assert.ok(content.includes('未公開の改訂候補'));
  }
  assert.ok(!files.get('data-first.md')!.includes(product.externalUrl));
  assert.ok(files.get('data-first.html')!.includes('現在販売中のnote（改訂案とは別内容）'));
  assert.ok(files.get('data-first.html')!.includes(product.externalUrl));
  assert.ok(files.get('data-first.md')!.includes('http://127.0.0.1:4777/app/products/data-first/showcase/population.png'));
  assert.ok(files.get('data-first.html')!.includes('/products/preview/data-first'));
  assert.ok(buildPreviewFiles([product]).get('data-first.html')!.includes('980円'));
});

test("通常版と改訂候補を同じ一覧に載せ、価格と未公開表示を商品ごとに分ける", () => {
  const revised = { ...product, id: 'P-02', slug: 'data-revised', priceYen: 1980 };
  const files = buildPreviewFiles([product, revised], { revisionIds: [revised.id] });
  assert.ok(files.get('data-first.md')!.includes('980円'));
  assert.ok(!files.get('data-revised.md')!.includes('1,980円'));
  assert.ok(files.get('data-revised.md')!.includes('未公開の改訂候補'));
  assert.ok(files.get('index.html')!.includes('2 商品'));
});

test("図を用途説明より先に見せ、条件を両形式へ引き継ぐ", () => {
  const section = { ...product.showcase![0], note: '同じ調査年を比較してください。' };
  const files = buildPreviewFiles([{ ...product, showcase: [section] }]);
  for (const file of ['data-first.md', 'data-first.html']) {
    const content = files.get(file)!;
    assert.ok(content.indexOf('population.png') < content.indexOf(section.lead));
    assert.ok(content.includes(section.note));
  }
});

test("用途・図・購入前確認の不足、重複、画像パス逸脱を拒否する", () => {
  for (const changed of [{ useCases: [] }, { showcase: [] }, { purchaseNotes: [] }, { slug: "../escape" }]) {
    assert.throws(() => buildPreviewFiles([{ ...product, ...changed }]));
  }
  assert.throws(() => buildPreviewFiles([product, product]), /重複/);
  assert.throws(() => buildPreviewFiles([{ ...product, showcase: [{ ...product.showcase![0], figures: [{ file: "../secret.png", alt: "図" }] }] }]), /PNG/);
});

test("HTML は説明の文字列をタグとして実行しない", () => {
  const files = buildPreviewFiles([{ ...product, description: '<script>alert("x")</script>' }]);
  assert.ok(!files.get("data-first.html")!.includes("<script>"));
  assert.ok(files.get("data-first.html")!.includes("&lt;script&gt;"));
});

test("販売記事名と納品の指標数の差を確認画面だけに表示し、記事本文を変えない", () => {
  const delivered = { ...product, title: "データ 685指標", included: ["CSV（47地域・685指標）", "PowerPoint（30指標）"] };
  const aligned = buildPreviewFiles([delivered]);
  const mismatch = buildPreviewFiles([{ ...delivered, title: "データ 832指標" }]);
  const notice = "販売記事名832指標／固定納品685指標：公開前に確認";
  assert.ok(mismatch.get("index.html")!.includes(notice));
  assert.ok(mismatch.get("data-first.html")!.includes(notice));
  assert.ok(!aligned.get("index.html")!.includes('aria-label="公開前の確認"'));
  assert.equal(mismatch.get("data-first.md"), aligned.get("data-first.md"));
  assert.ok(!mismatch.get("data-first.html")!.match(/<article>[\s\S]*公開前に確認[\s\S]*<\/article>/));
});

test("指標数の表記揺れを同値として扱い、CSV以外の件数や欠落を誤検知しない", () => {
  for (const changed of [
    { title: "データ １，２００指標", included: ["CSV（1,200 指標）", "PowerPoint（30指標）"] },
    { title: "データ 832指標", included: ["CSV", "PowerPoint（30指標）"] },
    { title: "データ", included: ["CSV（47地域・685指標）"] },
  ]) {
    const files = buildPreviewFiles([{ ...product, ...changed }]);
    assert.ok(!files.get("index.html")!.includes('aria-label="公開前の確認"'));
  }
});

test("--check は生成後の変更を検出し、サーバーは生成一覧のファイルだけを配信する", async (context) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "note-landing-test-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const files = buildPreviewFiles([product]);
  writePreviewFiles(files, directory, false);
  assert.doesNotThrow(() => writePreviewFiles(files, directory, true));
  writeFileSync(path.join(directory, "data-first.md"), "手編集");
  assert.throws(() => writePreviewFiles(files, directory, true), /再生成/);
  writePreviewFiles(files, directory, false);
  writeFileSync(path.join(directory, "secret.txt"), "not public");
  const server = createPreviewServer(files, directory);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  assert.equal((await fetch(origin)).status, 200);
  assert.equal((await fetch(`${origin}/data-first.md`)).status, 200);
  assert.equal((await fetch(`${origin}/secret.txt`)).status, 404);
  assert.equal((await fetch(`${origin}/%2e%2e/secret.txt`)).status, 404);
  assert.equal((await fetch(origin, { method: "POST" })).status, 405);
  const head = await fetch(origin, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
