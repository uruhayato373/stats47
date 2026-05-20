#!/usr/bin/env node
/**
 * koumuin-claude-code シリーズ 30 本の cover SVG を一括生成する。
 *
 * 出力: docs/31_note記事原稿/koumuin-claude-code/<NN-slug>/images/cover-1280x670.svg
 *
 * Usage:
 *   node .claude/scripts/note/generate-koumuin-covers.cjs
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SERIES_DIR = path.join(
  PROJECT_ROOT,
  "docs/31_note記事原稿/koumuin-claude-code",
);

const W = 1280;
const H = 670;

const CATEGORY_STYLE = {
  intro: { color: "#0f172a", bg: "#f1f5f9", label: "START HERE" },
  setup: { color: "#2563eb", bg: "#dbeafe", label: "SETUP" },
  documents: { color: "#059669", bg: "#d1fae5", label: "DOCUMENTS" },
  security: { color: "#dc2626", bg: "#fee2e2", label: "SECURITY" },
  data: { color: "#7c3aed", bg: "#ede9fe", label: "DATA" },
  pr: { color: "#ea580c", bg: "#ffedd5", label: "PR" },
  automation: { color: "#0891b2", bg: "#cffafe", label: "AUTOMATION" },
  organization: { color: "#4f46e5", bg: "#e0e7ff", label: "ORGANIZATION" },
  career: { color: "#b45309", bg: "#fef3c7", label: "CAREER" },
};

const ARTICLES = [
  ["00-claude-code-intro-for-public-servants", "intro", false, 0, "Claude Code とは何か — ターミナル未経験の公務員のための導入ガイド"],
  ["01-claude-code-setup-complete", "setup", true, 1500, "自治体職員のための Claude Code 環境構築 完全版"],
  ["02-internal-network-workarounds", "setup", false, 0, "庁内ネットワークで Claude Code を動かす 3 つの抜け道"],
  ["03-it-dept-security-doc", "setup", true, 980, "自治体 IT 担当に渡せる Claude Code セキュリティ説明資料"],
  ["04-meeting-minutes-30min-to-5min", "documents", false, 0, "議事録 30 分 → 5 分にした手順"],
  ["05-assembly-answer-prompts", "documents", true, 1200, "議会答弁原稿を Claude Code で 3 案出す prompt 集"],
  ["06-ordinance-revision-review", "documents", true, 980, "条例改正案を Claude Code でレビュー"],
  ["07-official-doc-skills", "documents", true, 800, "公文書ライティングを校正させる .claude/skills 完全版"],
  ["08-proposal-doc-checklist-20", "documents", true, 500, "起案文・決裁文の AI 査読チェックリスト 20 項目"],
  ["09-assembly-question-points", "documents", false, 0, "議会一般質問の論点整理を 1 時間 → 10 分にする方法"],
  ["10-ai-without-personal-info", "security", false, 0, "個人情報を Claude に送らずに AI 活用する 3 つの設定"],
  ["11-hooks-personal-info-masking", "security", true, 1200, "Claude Code Hooks で個人情報マスキングを自動化する"],
  ["12-audit-ready-settings", "security", true, 800, "監査に耐える AI 活用ログを残す .claude/settings.json"],
  ["13-ollama-offline-local-llm", "security", true, 1500, "ローカル LLM × Claude Code で完全オフライン業務"],
  ["14-excel-budget-aggregation", "data", false, 0, "Excel 予算ファイルを Claude Code で集計する"],
  ["15-data-preprocessing-intro", "data", true, 980, "公務員のための Claude Code × データ前処理入門"],
  ["16-subsidy-doc-consistency", "data", true, 800, "補助金申請書類の整合性チェックを Claude Code で"],
  ["17-year-on-year-analysis", "data", true, 500, "決算書類の前年比較分析を 5 分で出す手順"],
  ["18-pr-magazine-rewrite", "pr", true, 980, "広報誌の原稿を Claude Code でリライトする"],
  ["19-faq-auto-generation", "pr", false, 0, "住民問い合わせ FAQ を Claude Code で自動生成"],
  ["20-complaint-reply-patterns", "pr", true, 500, "苦情メール返信案を 5 パターン出す prompt"],
  ["21-disaster-sns-multilang", "pr", true, 800, "災害時の SNS 発信文を Claude Code で多言語化"],
  ["22-monthly-routine-skills", "automation", true, 1200, ".claude/skills で「毎月の定型業務」を 1 コマンド化"],
  ["23-mcp-internal-system", "automation", true, 1500, "MCP server を庁内システムにつなぐ実験"],
  ["24-subagents-parallel-research", "automation", true, 980, "Subagents で「複数案件の並行調査」を回す"],
  ["25-excel-vba-to-python", "automation", true, 800, "既存の Excel マクロを Claude Code で Python 移植する"],
  ["26-boss-approval-deck", "organization", true, 1500, "上司に Claude Code 導入を承認させた説明資料"],
  ["27-internal-study-30min", "organization", true, 800, "庁内勉強会の進め方: 30 分で職員を Claude Code 入門"],
  ["28-ai-skeptic-qa", "organization", true, 980, "AI 導入を渋る上席への対応 Q&A 集"],
  ["29-evaluated-without-side-job", "career", false, 0, "公務員が副業せずに Claude Code スキルで評価される 5 つの場"],
  ["30-post-retirement-career", "career", true, 1200, "退職後のキャリア: AI × 公的セクター経験者の市場価値"],
];

// CJK=1, space=0.5, other=0.5 でラフに文字幅を測る
function cjkLen(s) {
  let n = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x3400 && code <= 0x9fff) ||
      (code >= 0xff00 && code <= 0xffef)
    ) {
      n += 1;
    } else if (ch === " ") {
      n += 0.5;
    } else {
      n += 0.55;
    }
  }
  return n;
}

// タイトルを最大 maxLines 行、各行 maxCjkPerLine 程度に折り返す。
// 句読点・スペースで優先的に折る。
function wrapTitle(title, maxCjkPerLine, maxLines) {
  const breakers = new Set(["、", "。", " ", "・", ":", "：", "/", "→"]);
  const lines = [];
  let cur = "";
  let curLen = 0;
  for (let i = 0; i < title.length; i++) {
    const ch = title[i];
    cur += ch;
    curLen += cjkLen(ch);
    if (curLen >= maxCjkPerLine) {
      // 次が breaker なら現在に含めて改行、そうでなければ次の breaker まで進める
      let j = i;
      while (j + 1 < title.length && !breakers.has(title[j + 1]) && curLen < maxCjkPerLine + 4) {
        j++;
        cur += title[j];
        curLen += cjkLen(title[j]);
      }
      lines.push(cur.replace(/^\s+|\s+$/g, ""));
      cur = "";
      curLen = 0;
      i = j;
      if (lines.length >= maxLines - 1) {
        // 残りを最終行に詰め込む
        cur = title.slice(i + 1);
        break;
      }
    }
  }
  if (cur) lines.push(cur.replace(/^\s+|\s+$/g, ""));
  return lines.slice(0, maxLines);
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateSvg({ num, slug, category, isPaid, price, title }) {
  const cat = CATEGORY_STYLE[category];
  if (!cat) throw new Error(`Unknown category: ${category}`);

  // タイトル折り返し: 18 CJK/line, 最大 3 行
  const titleLines = wrapTitle(title, 18, 3);
  const titleFontSize = titleLines.length >= 3 ? 38 : 44;
  const titleLineHeight = titleFontSize + 14;

  // タイトル開始 y を行数に応じて中央寄せ
  const titleAreaCenterY = 365;
  const titleStartY = titleAreaCenterY - ((titleLines.length - 1) * titleLineHeight) / 2;

  // 番号バッジ (左)
  const badgeX = 110;
  const badgeY = 290;
  const badgeR = 90;

  // タイトル領域は右側
  const titleX = 250;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  text { font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif; }
</style>

<!-- Background -->
<rect width="${W}" height="${H}" fill="#fafafa"/>
<rect x="0" y="0" width="${W}" height="14" fill="${cat.color}"/>

<!-- Series brand -->
<text x="80" y="98" font-size="22" font-weight="500" fill="#475569">公務員 × Claude Code</text>
<line x1="80" y1="118" x2="200" y2="118" stroke="${cat.color}" stroke-width="3" stroke-linecap="round"/>
<text x="80" y="158" font-size="14" font-weight="500" fill="#94a3b8" letter-spacing="2">JICHITAI × AI SERIES</text>

<!-- Number badge (left) -->
<circle cx="${badgeX}" cy="${badgeY}" r="${badgeR}" fill="${cat.bg}"/>
<circle cx="${badgeX}" cy="${badgeY}" r="${badgeR - 8}" fill="none" stroke="${cat.color}" stroke-width="2"/>
<text x="${badgeX}" y="${badgeY + 28}" text-anchor="middle" font-size="84" font-weight="900" fill="${cat.color}">${num}</text>

<!-- Category chip (under badge) -->
<rect x="${badgeX - 70}" y="${badgeY + badgeR + 14}" width="140" height="32" rx="16" fill="${cat.color}"/>
<text x="${badgeX}" y="${badgeY + badgeR + 35}" text-anchor="middle" font-size="14" font-weight="700" fill="#ffffff" letter-spacing="1">${cat.label}</text>
`;

  // Title lines
  for (let i = 0; i < titleLines.length; i++) {
    const y = titleStartY + i * titleLineHeight;
    svg += `<text x="${titleX}" y="${y}" font-size="${titleFontSize}" font-weight="bold" fill="#1e293b">${escapeXml(titleLines[i])}</text>\n`;
  }

  // Paid/Free badge (right of brand area)
  const priceLabel = isPaid ? `有料 ¥${price.toLocaleString()}` : "無料公開";
  const priceColor = isPaid ? "#dc2626" : "#16a34a";
  const priceBg = isPaid ? "#fee2e2" : "#dcfce7";
  svg += `
<!-- Paid/Free badge -->
<rect x="${W - 220}" y="78" width="160" height="40" rx="20" fill="${priceBg}"/>
<text x="${W - 140}" y="104" text-anchor="middle" font-size="16" font-weight="700" fill="${priceColor}">${priceLabel}</text>

<!-- Footer -->
<line x1="80" y1="600" x2="${W - 80}" y2="600" stroke="#e2e8f0" stroke-width="1"/>
<text x="80" y="635" font-size="16" font-weight="600" fill="#64748b">公務員のための実務 AI 活用</text>
<text x="${W - 80}" y="635" text-anchor="end" font-size="16" font-weight="500" fill="#94a3b8">stats47.jp</text>
</svg>
`;

  return svg;
}

function main() {
  let generated = 0;
  let failed = 0;

  for (const [slug, category, isPaid, price, title] of ARTICLES) {
    const num = slug.slice(0, 2);
    const imagesDir = path.join(SERIES_DIR, slug, "images");
    if (!fs.existsSync(imagesDir)) {
      console.error(`SKIP ${slug}: images/ not found`);
      failed++;
      continue;
    }

    const svg = generateSvg({ num, slug, category, isPaid, price, title });
    const outPath = path.join(imagesDir, "cover-1280x670.svg");
    fs.writeFileSync(outPath, svg);
    console.log(`OK   ${slug}/images/cover-1280x670.svg`);
    generated++;
  }

  console.log(`\nGenerated ${generated} covers (${failed} failed).`);
}

main();
