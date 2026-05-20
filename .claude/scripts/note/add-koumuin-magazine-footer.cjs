#!/usr/bin/env node
/**
 * koumuin-claude-code シリーズ全 31 本の draft.md 末尾フッタを
 * v2（マガジン回遊版）に置き換える。
 *
 * v1 フッタ（各記事への `../slug/draft.md` 相互リンク）は note 公開後にリンク切れになるため、
 * note マガジンへの導線 1 本に集約する v2 に差し替える。
 *
 * 冪等: 既存の circulation-footer マーカー（v1/v2 いずれも）以降を切り落としてから v2 を付け直す。
 *
 * マガジン URL は `{{MAGAZINE_URL}}` プレースホルダーで埋めておき、
 * マガジン作成後に inject-magazine-url.cjs で実 URL に一括置換する。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SERIES_DIR = path.join(
  PROJECT_ROOT,
  "docs/31_note記事原稿/koumuin-claude-code",
);

const FOOTER_MARKER_RE = /<!--\s*circulation-footer:v\d+\s*-->/;

const FOOTER_V2 = `
<!-- circulation-footer:v2 -->

---

## 「公務員 × Claude Code」シリーズ

本記事は、自治体職員が Claude Code を日々の業務に活かすための全 31 本シリーズの 1 本です。環境構築・議事録・議会答弁・セキュリティ・データ活用・組織導入まで、関心のあるテーマから読み進められます。

シリーズの全記事はマガジンにまとめています。他の記事はこちらからどうぞ。

{{MAGAZINE_URL}}

Claude Code に触れるのが初めての方は、まず導入記事「Claude Code とは何か — ターミナル未経験の公務員のための導入ガイド」から読むのがおすすめです。
`;

function main() {
  const dirs = fs
    .readdirSync(SERIES_DIR)
    .filter((d) => /^\d{2}-/.test(d))
    .sort();

  let updated = 0;
  let missing = 0;

  for (const slug of dirs) {
    const draftPath = path.join(SERIES_DIR, slug, "draft.md");
    if (!fs.existsSync(draftPath)) {
      console.error(`MISSING ${slug}: draft.md not found`);
      missing++;
      continue;
    }
    let content = fs.readFileSync(draftPath, "utf8");
    const lines = content.split("\n");

    // 既存フッタ（v1/v2）マーカー行を探し、そこから末尾までを切り落とす
    let cutIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (FOOTER_MARKER_RE.test(lines[i])) {
        cutIdx = i;
        break;
      }
    }
    let body = cutIdx >= 0 ? lines.slice(0, cutIdx).join("\n") : content;

    // 末尾の余分な空行・区切りを整理（フッタ直前の `---` や空行を除去）
    body = body.replace(/\s*\n-{3,}\s*$/g, "");
    body = body.replace(/\s+$/g, "");

    fs.writeFileSync(draftPath, body + "\n" + FOOTER_V2);
    console.log(`OK   ${slug}`);
    updated++;
  }

  console.log(`\nUpdated: ${updated}, Missing: ${missing}`);
}

main();
