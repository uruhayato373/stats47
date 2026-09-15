import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { sharedPolicyDocument, sharedPolicyDocuments } from "@/lib/server/shared-policy";

/**
 * 管理画面「共通方針」が、配布された共有 SSOT を漏れなく可視化できる状態かを機械で守る。
 * 索引（/strategy/policy）は manifest.json の docs を回して描くだけなので、obsidian 側で文書を
 * 1 本足して配布すれば画面にも出る——その前提が崩れる 2 通りをここで止める:
 *   1. manifest の文書に title / summary / 実体が無い（配布時に sync.mjs が拒否するが、写しを手で壊した場合の網）
 *   2. ページ側が manifest を読まずに文書名・見出しをハードコードし始めた
 */
const REPO = path.resolve(__dirname, "../../../..");

describe("shared-policy (共通方針の配布物)", () => {
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("配布された全文書が title / summary / 本文を持ち、正本は memos/ 配下を指す", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const docs = sharedPolicyDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(3);
    for (const d of docs) {
      expect(d.title, `${d.name} title`).not.toBe("");
      expect(d.title).not.toBe(d.slug); // slug へのフォールバックは「frontmatter に title が無い」印
      expect(d.summary, `${d.name} summary`).not.toBe("");
      expect(d.sourcePath).toMatch(/^memos\/.+SSOT\.md$/);
      const full = sharedPolicyDocument(d.slug);
      expect(full?.body.length ?? 0).toBeGreaterThan(200);
    }
    expect(sharedPolicyDocument("NOPE")).toBeNull();
  });

  // 「manifest 無し → 空」「schema 1 → POLICY だけ」は正本側（obsidian の sync.test.mjs）が担う。
  // projectRoot() はプロセス内でキャッシュされるため、ここで別ルートに切り替えて検査はできない。

  it("索引・個別ページは manifest 駆動で、見出し・説明を admin 側に写していない", () => {
    const admin = path.join(REPO, "apps/admin");
    const index = fs.readFileSync(path.join(admin, "app/strategy/policy/page.tsx"), "utf8");
    const detail = fs.readFileSync(path.join(admin, "app/strategy/policy/[slug]/page.tsx"), "utf8");
    const lib = fs.readFileSync(path.join(admin, "lib/server/shared-policy.ts"), "utf8");
    expect(index).toMatch(/sharedPolicyDocuments\(\)/);
    expect(detail).toMatch(/sharedPolicyDocument\(slug\)/);
    expect(lib).toMatch(/m\.docs/);
    for (const src of [index, detail, lib]) {
      expect(src).not.toMatch(/LABELS|共通事業方針（HARM）|売れる 9 型/);
    }
  });
});
