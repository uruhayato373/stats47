#!/usr/bin/env node
/**
 * koumuin-claude-code シリーズ 01-30 の draft.md 末尾に「回遊フッタ」を追記する。
 *
 * 冪等: <!-- circulation-footer:v1 --> マーカーがあればスキップ。
 * (バージョン番号を上げれば再追加可能)
 *
 * 各記事の「次に読む 2 本」は category 隣接 + 関連トピックで手動キュレーション。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SERIES_DIR = path.join(
  PROJECT_ROOT,
  "docs/31_note記事原稿/koumuin-claude-code",
);
const MARKER = "<!-- circulation-footer:v1 -->";

// slug -> { title, isPaid, price, category }
const ARTICLES = {
  "01-claude-code-setup-complete": { title: "自治体職員のための Claude Code 環境構築 完全版", isPaid: true, price: 1500, category: "setup" },
  "02-internal-network-workarounds": { title: "庁内ネットワークで Claude Code を動かす 3 つの抜け道", isPaid: false, price: 0, category: "setup" },
  "03-it-dept-security-doc": { title: "自治体 IT 担当に渡せる Claude Code セキュリティ説明資料", isPaid: true, price: 980, category: "setup" },
  "04-meeting-minutes-30min-to-5min": { title: "議事録 30 分 → 5 分にした手順", isPaid: false, price: 0, category: "documents" },
  "05-assembly-answer-prompts": { title: "議会答弁原稿を Claude Code で 3 案出す prompt 集", isPaid: true, price: 1200, category: "documents" },
  "06-ordinance-revision-review": { title: "条例改正案を Claude Code でレビュー", isPaid: true, price: 980, category: "documents" },
  "07-official-doc-skills": { title: "公文書ライティングを校正させる .claude/skills 完全版", isPaid: true, price: 800, category: "documents" },
  "08-proposal-doc-checklist-20": { title: "起案文・決裁文の AI 査読チェックリスト 20 項目", isPaid: true, price: 500, category: "documents" },
  "09-assembly-question-points": { title: "議会一般質問の論点整理を 1 時間 → 10 分にする方法", isPaid: false, price: 0, category: "documents" },
  "10-ai-without-personal-info": { title: "個人情報を Claude に送らずに AI 活用する 3 つの設定", isPaid: false, price: 0, category: "security" },
  "11-hooks-personal-info-masking": { title: "Claude Code Hooks で個人情報マスキングを自動化する", isPaid: true, price: 1200, category: "security" },
  "12-audit-ready-settings": { title: "監査に耐える AI 活用ログを残す .claude/settings.json", isPaid: true, price: 800, category: "security" },
  "13-ollama-offline-local-llm": { title: "ローカル LLM × Claude Code で完全オフライン業務", isPaid: true, price: 1500, category: "security" },
  "14-excel-budget-aggregation": { title: "Excel 予算ファイルを Claude Code で集計する", isPaid: false, price: 0, category: "data" },
  "15-data-preprocessing-intro": { title: "公務員のための Claude Code × データ前処理入門", isPaid: true, price: 980, category: "data" },
  "16-subsidy-doc-consistency": { title: "補助金申請書類の整合性チェックを Claude Code で", isPaid: true, price: 800, category: "data" },
  "17-year-on-year-analysis": { title: "決算書類の前年比較分析を 5 分で出す手順", isPaid: true, price: 500, category: "data" },
  "18-pr-magazine-rewrite": { title: "広報誌の原稿を Claude Code でリライトする", isPaid: true, price: 980, category: "pr" },
  "19-faq-auto-generation": { title: "住民問い合わせ FAQ を Claude Code で自動生成", isPaid: false, price: 0, category: "pr" },
  "20-complaint-reply-patterns": { title: "苦情メール返信案を 5 パターン出す prompt", isPaid: true, price: 500, category: "pr" },
  "21-disaster-sns-multilang": { title: "災害時の SNS 発信文を Claude Code で多言語化", isPaid: true, price: 800, category: "pr" },
  "22-monthly-routine-skills": { title: ".claude/skills で「毎月の定型業務」を 1 コマンド化", isPaid: true, price: 1200, category: "automation" },
  "23-mcp-internal-system": { title: "MCP server を庁内システムにつなぐ実験", isPaid: true, price: 1500, category: "automation" },
  "24-subagents-parallel-research": { title: "Subagents で「複数案件の並行調査」を回す", isPaid: true, price: 980, category: "automation" },
  "25-excel-vba-to-python": { title: "既存の Excel マクロを Claude Code で Python 移植する", isPaid: true, price: 800, category: "automation" },
  "26-boss-approval-deck": { title: "上司に Claude Code 導入を承認させた説明資料", isPaid: true, price: 1500, category: "organization" },
  "27-internal-study-30min": { title: "庁内勉強会の進め方: 30 分で職員を Claude Code 入門", isPaid: true, price: 800, category: "organization" },
  "28-ai-skeptic-qa": { title: "AI 導入を渋る上席への対応 Q&A 集", isPaid: true, price: 980, category: "organization" },
  "29-evaluated-without-side-job": { title: "公務員が副業せずに Claude Code スキルで評価される 5 つの場", isPaid: false, price: 0, category: "career" },
  "30-post-retirement-career": { title: "退職後のキャリア: AI × 公的セクター経験者の市場価値", isPaid: true, price: 1200, category: "career" },
};

// 「次に読む」キュレーションマップ (slug -> [次に読む2件])
// 選定基準: 同カテゴリ隣接 → 関連トピック → 別カテゴリの導入
const NEXT_READS = {
  "01-claude-code-setup-complete": ["02-internal-network-workarounds", "04-meeting-minutes-30min-to-5min"],
  "02-internal-network-workarounds": ["01-claude-code-setup-complete", "10-ai-without-personal-info"],
  "03-it-dept-security-doc": ["12-audit-ready-settings", "26-boss-approval-deck"],
  "04-meeting-minutes-30min-to-5min": ["09-assembly-question-points", "05-assembly-answer-prompts"],
  "05-assembly-answer-prompts": ["09-assembly-question-points", "06-ordinance-revision-review"],
  "06-ordinance-revision-review": ["07-official-doc-skills", "08-proposal-doc-checklist-20"],
  "07-official-doc-skills": ["08-proposal-doc-checklist-20", "16-subsidy-doc-consistency"],
  "08-proposal-doc-checklist-20": ["07-official-doc-skills", "16-subsidy-doc-consistency"],
  "09-assembly-question-points": ["04-meeting-minutes-30min-to-5min", "05-assembly-answer-prompts"],
  "10-ai-without-personal-info": ["11-hooks-personal-info-masking", "12-audit-ready-settings"],
  "11-hooks-personal-info-masking": ["12-audit-ready-settings", "13-ollama-offline-local-llm"],
  "12-audit-ready-settings": ["11-hooks-personal-info-masking", "10-ai-without-personal-info"],
  "13-ollama-offline-local-llm": ["10-ai-without-personal-info", "23-mcp-internal-system"],
  "14-excel-budget-aggregation": ["15-data-preprocessing-intro", "17-year-on-year-analysis"],
  "15-data-preprocessing-intro": ["16-subsidy-doc-consistency", "17-year-on-year-analysis"],
  "16-subsidy-doc-consistency": ["08-proposal-doc-checklist-20", "17-year-on-year-analysis"],
  "17-year-on-year-analysis": ["14-excel-budget-aggregation", "22-monthly-routine-skills"],
  "18-pr-magazine-rewrite": ["19-faq-auto-generation", "20-complaint-reply-patterns"],
  "19-faq-auto-generation": ["20-complaint-reply-patterns", "18-pr-magazine-rewrite"],
  "20-complaint-reply-patterns": ["21-disaster-sns-multilang", "19-faq-auto-generation"],
  "21-disaster-sns-multilang": ["20-complaint-reply-patterns", "27-internal-study-30min"],
  "22-monthly-routine-skills": ["23-mcp-internal-system", "24-subagents-parallel-research"],
  "23-mcp-internal-system": ["22-monthly-routine-skills", "25-excel-vba-to-python"],
  "24-subagents-parallel-research": ["22-monthly-routine-skills", "15-data-preprocessing-intro"],
  "25-excel-vba-to-python": ["14-excel-budget-aggregation", "22-monthly-routine-skills"],
  "26-boss-approval-deck": ["27-internal-study-30min", "28-ai-skeptic-qa"],
  "27-internal-study-30min": ["26-boss-approval-deck", "28-ai-skeptic-qa"],
  "28-ai-skeptic-qa": ["26-boss-approval-deck", "29-evaluated-without-side-job"],
  "29-evaluated-without-side-job": ["30-post-retirement-career", "26-boss-approval-deck"],
  "30-post-retirement-career": ["29-evaluated-without-side-job", "27-internal-study-30min"],
};

function priceLabel(a) {
  return a.isPaid ? `有料 ¥${a.price.toLocaleString()}` : "無料";
}

function buildFooter(slug) {
  const nextSlugs = NEXT_READS[slug] || [];
  const nextItems = nextSlugs.map((s) => {
    const a = ARTICLES[s];
    if (!a) throw new Error(`Unknown next-read slug: ${s}`);
    const num = s.slice(0, 2);
    return `- [#${num} ${a.title}](../${s}/draft.md) (${priceLabel(a)})`;
  });

  return `
${MARKER}

---

## このシリーズ「公務員 × Claude Code」を読む

Claude Code に触れたことがない方は、まず導入記事から:

- [#00 Claude Code とは — ターミナル未経験の公務員のための導入ガイド](../00-claude-code-intro-for-public-servants/draft.md) (無料)

**次に読む (関連トピック):**

${nextItems.join("\n")}

**全 31 本の一覧:** [INDEX.md](../INDEX.md)
`;
}

function main() {
  let added = 0;
  let skipped = 0;
  let missing = 0;

  for (const slug of Object.keys(ARTICLES)) {
    const draftPath = path.join(SERIES_DIR, slug, "draft.md");
    if (!fs.existsSync(draftPath)) {
      console.error(`MISSING ${slug}: draft.md not found`);
      missing++;
      continue;
    }
    let content = fs.readFileSync(draftPath, "utf8");
    if (content.includes(MARKER)) {
      console.log(`SKIP    ${slug} (marker already present)`);
      skipped++;
      continue;
    }
    const footer = buildFooter(slug);
    // 末尾の改行を整える: ファイル末尾に必ず 1 つの改行
    if (!content.endsWith("\n")) content += "\n";
    fs.writeFileSync(draftPath, content + footer);
    console.log(`OK      ${slug}`);
    added++;
  }

  console.log(`\nAdded: ${added}, Skipped: ${skipped}, Missing: ${missing}`);
}

main();
