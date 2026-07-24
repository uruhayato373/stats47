/**
 * known-tag-keys.ts の生成スクリプト (2026-07-24 R2 公開URL版)
 *
 * 真実源: R2 `app/blog/all.json` の `tagMeta[].tagKey`。
 * これは `readAllUniqueTagsFromR2` (blog-snapshot-reader) がページ描画に使うのと同じ供給元で、
 * 「記事が 1 本以上付いているタグ」= /tag/<key> が描画できるタグの全量。
 *
 * middleware (url-policy.tag.isKnown) が参照し、KNOWN に無いキーは 410 Gone を返す。
 * CI ビルド環境では R2 binding が無いため、静的ファイルとして git commit する設計。
 *
 * ★2026-07-24 に生成元を差し替えた: 旧版はローカル D1 の `tags` テーブルを読んでいたが、
 *   完全DBレス移行 (docs/01_技術設計/12_完全DBレス設計.md) で D1 が廃止され生成不能になり、
 *   2026-04-26 の 327 件で凍結していた。その間に増えた 866 タグが全て 410 になり、
 *   公開記事のタグリンク 1,988 本が死んでいた (docs/04_レビュー/2026-07-24-site-link-audit.md)。
 *
 * 使い方: `cd apps/web && npx tsx scripts/generate-known-tag-keys.ts`
 *         `--check` を付けるとファイルを書かず、コミット済みの内容と R2 の実態が一致するかだけ検証する
 *         (PR CI の鮮度ゲート。theme-catalog / area-databook の「生成物は最新」検査と同じ流儀)。
 * 更新タイミング: ブログ記事を公開して R2 blog snapshot を更新した後。
 *                 必ず git commit してからデプロイ (デプロイしないと middleware に反映されない)。
 */

import fs from "node:fs";
import path from "node:path";

const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const OUT_PATH = path.resolve(__dirname, "../src/config/known-tag-keys.ts");
const CHECK_ONLY = process.argv.includes("--check");

interface TagMeta {
  tagKey: string;
  articleCount: number;
}

async function run() {
  const url = `${R2_PUBLIC}/app/blog/all.json`;
  console.log(`[generate-known-tag-keys] fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`blog snapshot fetch failed: HTTP ${res.status} ${url}`);
  }
  const snapshot = (await res.json()) as { tagMeta?: TagMeta[] };
  const tagMeta = snapshot.tagMeta;
  if (!Array.isArray(tagMeta) || tagMeta.length === 0) {
    // 空を書き出すと全タグが 410 になる (fail-open 禁止)。
    throw new Error("blog snapshot に tagMeta がありません。生成を中止します。");
  }

  const keys = tagMeta
    .filter((t) => typeof t.tagKey === "string" && t.tagKey.length > 0 && t.articleCount >= 1)
    .map((t) => t.tagKey);
  keys.sort();

  const today = new Date().toISOString().slice(0, 10);
  const header = `/**
 * 有効な tag キー一覧（R2 blog snapshot の tagMeta 全件）
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * 用途: middleware (url-policy.tag.isKnown) の 410 判定。KNOWN に無い /tag/<key> は 410 Gone。
 *
 * 真実源: R2 \`app/blog/all.json\` の \`tagMeta[].tagKey\` (記事 1 本以上のタグ)。
 * 更新方法: \`cd apps/web && npx tsx scripts/generate-known-tag-keys.ts\`
 * 更新タイミング: ブログ公開で R2 blog snapshot が変わった後。commit + デプロイで反映。
 *
 * 最終生成日: ${today}
 * 件数: ${keys.length}
 */
export const KNOWN_TAG_KEYS: ReadonlySet<string> = new Set([
`;
  const body = keys.map((k) => `  ${JSON.stringify(k)},`).join("\n");
  const footer = `\n]);\n`;

  if (CHECK_ONLY) {
    // 「最終生成日」行は毎回変わるのでキー集合だけを比較する。
    const committed = new Set(
      [...fs.readFileSync(OUT_PATH, "utf-8").matchAll(/^ {2}"((?:[^"\\]|\\.)*)",$/gm)].map((m) =>
        JSON.parse(`"${m[1]}"`),
      ),
    );
    const missing = keys.filter((k) => !committed.has(k));
    const extra = [...committed].filter((k) => !keys.includes(k));
    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ known-tag-keys は最新 (${keys.length} 件)`);
      return;
    }
    console.error(
      `❌ known-tag-keys がコミット済みの内容と一致しません (R2 ${keys.length} 件 / コミット ${committed.size} 件)`,
    );
    if (missing.length) {
      console.error(`   R2 にあるが KNOWN に無い (= /tag/<key> が 410 になる): ${missing.length} 件`);
      console.error(`     ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? " …" : ""}`);
    }
    if (extra.length) {
      console.error(`   KNOWN にあるが R2 に無い (記事が消えたタグ): ${extra.length} 件`);
      console.error(`     ${extra.slice(0, 10).join(", ")}${extra.length > 10 ? " …" : ""}`);
    }
    console.error("   修正: cd apps/web && npx tsx scripts/generate-known-tag-keys.ts");
    console.error("   経緯: docs/04_レビュー/2026-07-24-site-link-audit.md");
    process.exit(1);
  }

  fs.writeFileSync(OUT_PATH, header + body + footer, "utf-8");
  console.log(`[generate-known-tag-keys] wrote ${keys.length} keys to ${OUT_PATH}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
