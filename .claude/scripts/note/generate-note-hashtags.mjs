#!/usr/bin/env node
/**
 * note ドラフトのハッシュタグを99個生成して hashtags.txt に保存する。
 *
 * Usage:
 *   node .claude/scripts/note/generate-note-hashtags.mjs [--slug <slug>] [--all]
 *
 * --slug: 特定ドラフトのみ生成
 * --all: note-draft-index.json の全ドラフトを対象
 *
 * 生成先: docs/31_note記事原稿/<vertical>/<slug>/hashtags.txt
 * (存在しない場合は restore-from-r2.sh で復元してから実行)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// ============================================================
// Vertical 別ハッシュタグプール（共通 + カテゴリ）
// ============================================================

const HASHTAGS_BY_VERTICAL = {
  'stats47-note': {
    base: [
      '#統計', '#都道府県', '#ランキング', '#データ分析', '#日本',
      '#都道府県別', '#統計データ', '#データ可視化', '#地域格差',
      '#都道府県ランキング', '#日本の統計', '#統計学', '#データサイエンス',
      '#社会統計', '#地域分析', '#エリア分析', '#格差', '#地方と都市',
      '#47都道府県', '#都道府県比較', '#日本地図', '#統計グラフ',
      '#数字で見る日本', '#地域データ', '#日本の課題', '#地域研究',
      '#オープンデータ', '#eStat', '#政府統計', '#統計活用',
    ],
    series: {
      A: [
        '#ランキング記事', '#データまとめ', '#都道府県ランキング',
        '#統計ランキング', '#1位', '#最下位', '#上位', '#比較データ',
        '#グラフで見る', '#数字で比較', '#都道府県ランキング',
        '#ランキング結果', '#都道府県データ',
      ],
      B: [
        '#読み物', '#統計読み物', '#データストーリー', '#考察',
        '#深掘り', '#データから読む', '#背景を探る', '#地域の実態',
        '#なぜ', '#データ解説', '#統計解説',
      ],
      C: [
        '#時系列', '#トレンド', '#変化', '#推移', '#年次変化',
        '#経年変化', '#時系列データ', '#変化率', '#増減',
        '#成長', '#縮小', '#データトレンド',
      ],
      D: [
        '#生活', '#家計', '#消費', '#暮らし', '#生活データ',
        '#家計データ', '#消費行動', '#生活費', '#物価',
        '#節約', '#お金', '#生活設計',
      ],
    },
  },
  'koumuin-claude-code': {
    base: [
      '#公務員', '#自治体', '#Claude', '#ClaudeCode', '#AI活用',
      '#公務員AI', '#自治体DX', '#DX', '#行政DX', '#業務改善',
      '#AI業務効率化', '#自治体職員', '#地方公務員', '#国家公務員',
      '#公務員の仕事', '#行政', '#役所', '#市役所',
      '#AI', '#生成AI', '#LLM', '#ChatGPT', '#人工知能',
      '#業務自動化', '#業務効率', '#仕事術', '#働き方改革',
      '#テクノロジー', '#IT活用', '#デジタル化', '#DX推進',
    ],
    series: {
      setup: [
        '#環境構築', '#セットアップ', '#導入方法', '#使い方',
        '#はじめ方', '#入門', '#インストール',
      ],
      documents: [
        '#文書作成', '#議事録', '#公文書', '#文書効率化',
        '#ライティング', '#報告書', '#企画書',
      ],
      security: [
        '#セキュリティ', '#情報セキュリティ', '#個人情報保護',
        '#プライバシー', '#安全なAI活用',
      ],
      data: [
        '#データ活用', '#Excel', '#データ分析', '#集計',
        '#データ処理', '#統計処理',
      ],
      automation: [
        '#自動化', '#RPA', '#スクリプト', '#ツール作成',
        '#定型業務', '#業務自動化', '#効率化ツール',
      ],
      career: [
        '#キャリア', '#スキルアップ', '#公務員スキル',
        '#働き方', '#AI時代の公務員', '#副業', '#定年',
      ],
    },
  },
  'koumuin-estat-claude-code': {
    base: [
      '#eStat', '#統計API', '#公務員', '#Claude', '#ClaudeCode',
      '#AI', '#データ分析', '#政府統計', '#公的統計', '#統計データ活用',
      '#自治体', '#行政データ', '#オープンデータ', '#Python',
      '#API活用', '#データ取得', '#統計処理', '#業務改善',
      '#公務員DX', '#データドリブン', '#統計リテラシー',
      '#データジャーナリズム', '#情報収集', '#調査研究',
      '#行政研究', '#政策立案', '#EBPMに向けて',
    ],
    series: { default: [] },
  },
  'koumuin-gis': {
    base: [
      '#GIS', '#地図', '#空間データ', '#地理情報', '#自治体GIS',
      '#Claude', '#ClaudeCode', '#AI', '#公務員', '#自治体',
      '#国土数値情報', '#地域分析', '#空間解析', '#マッピング',
      '#QGIS', '#地図作成', '#地域課題', '#都市計画',
      '#人口分布', '#防災GIS', '#インフラ管理',
      '#オープンデータ', '#地理空間情報', '#DX', '#デジタル行政',
    ],
    series: { default: [] },
  },
};

// ============================================================
// テーマキーワードからハッシュタグを補完
// ============================================================

const THEME_KEYWORDS = [
  { keywords: ['通勤', '電車', '交通'], tags: ['#通勤時間', '#交通', '#電車', '#移動時間', '#通勤ラッシュ', '#在宅勤務'] },
  { keywords: ['賃金', '給料', '年収', '所得'], tags: ['#賃金', '#年収', '#給料', '#収入格差', '#所得格差', '#給与水準'] },
  { keywords: ['転職', '求人', '就職'], tags: ['#転職', '#求人', '#就職', '#雇用', '#労働市場', '#キャリア'] },
  { keywords: ['有給', '休暇', '休日'], tags: ['#有給休暇', '#休暇', '#ワークライフバランス', '#休み', '#福利厚生'] },
  { keywords: ['気温', '天気', '気候'], tags: ['#気温', '#天気', '#気候', '#猛暑', '#暑い', '#気象データ'] },
  { keywords: ['旅行', '観光', 'ホテル', '宿泊'], tags: ['#旅行', '#観光', '#ホテル', '#旅行データ', '#観光地', '#国内旅行'] },
  { keywords: ['食費', '支出', '消費', '家計'], tags: ['#家計', '#支出', '#食費', '#消費データ', '#節約', '#生活費'] },
  { keywords: ['財政', '税収', '交付税'], tags: ['#財政', '#税収', '#地方財政', '#財政状況', '#交付税', '#税金'] },
  { keywords: ['人口', '少子化', '高齢化'], tags: ['#人口', '#少子化', '#高齢化', '#人口問題', '#人口減少', '#地方消滅'] },
  { keywords: ['教育', '学校', '大学'], tags: ['#教育', '#学校', '#受験', '#教育格差', '#大学進学率', '#学力'] },
  { keywords: ['薬局', '医療', '病院'], tags: ['#医療', '#薬局', '#病院', '#医療格差', '#健康', '#医療体制'] },
  { keywords: ['ボランティア', '活動'], tags: ['#ボランティア', '#社会貢献', '#地域活動', '#NPO'] },
  { keywords: ['海外', '外国'], tags: ['#海外旅行', '#国際', '#外国', '#グローバル'] },
  { keywords: ['農業', '農産', '耕地'], tags: ['#農業', '#農産物', '#農地', '#農業データ', '#食料自給率'] },
  { keywords: ['水産', '魚', '漁業'], tags: ['#水産', '#漁業', '#魚', '#海産物'] },
  { keywords: ['子育て', '育児', '保育'], tags: ['#子育て', '#育児', '#保育', '#保育園', '#待機児童'] },
  { keywords: ['議事録', '会議', 'ミーティング'], tags: ['#議事録', '#会議', '#ミーティング効率化', '#会議DX'] },
  { keywords: ['文書', '書類', '公文書'], tags: ['#文書作成', '#公文書', '#書類作成', '#文書DX'] },
  { keywords: ['セキュリティ', '情報漏洩', '個人情報'], tags: ['#情報セキュリティ', '#個人情報', '#データ保護', '#セキュリティ対策'] },
  { keywords: ['MCP', 'API', '連携'], tags: ['#MCP', '#API', '#システム連携', '#自動化', '#プログラミング'] },
  { keywords: ['subagent', 'エージェント', 'マルチ'], tags: ['#マルチエージェント', '#AI自動化', '#並行処理'] },
  { keywords: ['Excel', 'スプレッドシート', '集計'], tags: ['#Excel活用', '#スプレッドシート', '#データ集計', '#表計算'] },
  { keywords: ['広報', 'PR', '市民'], tags: ['#広報', '#PR', '#市民サービス', '#広報誌'] },
  { keywords: ['GIS', '地図', '地理'], tags: ['#GIS', '#地図分析', '#地理情報', '#国土数値情報', '#空間データ'] },
  { keywords: ['過疎', '人口減少', '地方'], tags: ['#過疎', '#地方創生', '#人口減少対策', '#地域振興'] },
  { keywords: ['医療', '診療', 'クリニック'], tags: ['#医療アクセス', '#診療', '#医師不足', '#地域医療'] },
  { keywords: ['VBA', 'Python', 'プログラム'], tags: ['#Python', '#VBA', '#プログラミング', '#コーディング', '#自動化スクリプト'] },
  { keywords: ['ChatGPT', 'GPT', 'OpenAI'], tags: ['#ChatGPT', '#GPT', '#OpenAI', '#AI比較'] },
  { keywords: ['上司', '承認', '決裁'], tags: ['#上司', '#決裁', '#承認プロセス', '#説明資料', '#プレゼン'] },
  { keywords: ['勉強会', '研修', '勉強'], tags: ['#勉強会', '#研修', '#スキルアップ', '#学習', '#自己啓発'] },
  { keywords: ['副業', '定年', 'キャリア'], tags: ['#副業', '#定年後', '#第二の人生', '#公務員キャリア'] },
];

// ============================================================
// メイン処理
// ============================================================

function extractKeywordsFromTitle(title) {
  return title || '';
}

export function generateHashtags(vertical, seriesHint, title) {
  const pool = HASHTAGS_BY_VERTICAL[vertical] || HASHTAGS_BY_VERTICAL['stats47-note'];
  const result = new Set();

  // 1. base タグを全部追加
  (pool.base || []).forEach(t => result.add(t));

  // 2. シリーズ別タグ
  const seriesKey = seriesHint?.toUpperCase() || 'A';
  const seriesTags = pool.series?.[seriesKey] || pool.series?.default || [];
  seriesTags.forEach(t => result.add(t));

  // 3. テーマキーワードマッチ
  const titleText = extractKeywordsFromTitle(title);
  for (const { keywords, tags } of THEME_KEYWORDS) {
    if (keywords.some(kw => titleText.includes(kw))) {
      tags.forEach(t => result.add(t));
    }
  }

  // 4. 99個に調整（足りない場合は汎用タグ補充）
  const FILL_TAGS = [
    '#note', '#noteクリエイター', '#毎日note', '#note記事',
    '#読んで欲しい', '#フォロー', '#スキしてみて', '#クリエイター',
    '#note初心者', '#情報発信', '#コンテンツ', '#マガジン',
    '#2024年', '#2025年', '#2026年', '#最新データ',
    '#まとめ', '#解説', '#入門', '#基礎知識',
    '#トレンド', '#注目', '#おすすめ', '#必読',
    '#社会問題', '#日本社会', '#社会課題', '#現代日本',
    '#経済', '#政治', '#行政', '#地域社会',
    '#働く', '#仕事', '#職場', '#社会人',
    '#研究', '#調査', '#分析', '#考察',
    '#知識', '#勉強', '#学び', '#インサイト',
    '#情報', '#知る', '#発見', '#データで見る',
    '#無料', '#役立つ', '#保存版', '#シェアしたい',
    '#役に立つ情報', '#興味深い', '#日本のデータ', '#可視化',
    '#グラフ', '#チャート', '#統計グラフ', '#インフォグラフィック',
    '#2023年', '#2022年', '#2021年', '#2020年',
    '#ライフスタイル', '#ビジネス', '#自己啓発', '#キャリアアップ',
    '#地方', '#都市', '#田舎暮らし', '#都会',
    '#地域おこし', '#まちづくり', '#地域活性化', '#地方創生',
    '#面白い', '#へぇ', '#知らなかった', '#目からウロコ',
    '#なるほど', '#深い', '#勉強になる', '#ためになる',
  ];
  let fillIdx = 0;
  while (result.size < 99 && fillIdx < FILL_TAGS.length) {
    result.add(FILL_TAGS[fillIdx++]);
  }

  // note の実機上限に合わせて99個に切り詰め
  return [...result].slice(0, 99);
}

export function detectSeries(slug) {
  const s = slug.toLowerCase();
  if (s.startsWith('a-') || s.startsWith('a_') || /^a-laborwage/.test(s)) return 'A';
  if (s.startsWith('b-') || s.startsWith('b_')) return 'B';
  if (s.startsWith('c-') || s.startsWith('c_')) return 'C';
  if (s.startsWith('d-') || s.startsWith('d_') || s.startsWith('d1-')) return 'D';
  // koumuin-claude-code のカテゴリ推定
  if (/setup|environment|install/.test(s)) return 'setup';
  if (/doc|minutes|ordinance|proposal|assembly/.test(s)) return 'documents';
  if (/security|personal|audit|offline/.test(s)) return 'security';
  if (/data|excel|budget|aggregat/.test(s)) return 'data';
  if (/automat|routine|mcp|subagent|parallel/.test(s)) return 'automation';
  if (/career|retire|evaluat|skeptic|study/.test(s)) return 'career';
  if (/pr|magazine|faq|complaint|disaster/.test(s)) return 'pr';
  return 'default';
}

function resolveSlugDir(draftRoot, vertical, slug) {
  // stats47-note は vertical ディレクトリなし (restore-from-r2.sh の挙動に合わせる)
  if (vertical === 'stats47-note') {
    const flat = path.join(draftRoot, slug);
    if (fs.existsSync(flat)) return flat;
  }
  return path.join(draftRoot, vertical, slug);
}

function processSlug(slug, info, draftRoot) {
  const { vertical, r2_path } = info;
  const slugDir = resolveSlugDir(draftRoot, vertical, slug);

  if (!fs.existsSync(slugDir)) {
    console.log(`  SKIP (docs/31 に未展開): ${slug}`);
    console.log(`    → bash .claude/scripts/note/restore-from-r2.sh ${slug}`);
    return { status: 'skip', slug };
  }

  // draft.md からタイトル取得
  const draftPath = path.join(slugDir, 'draft.md');
  let title = slug;
  if (fs.existsSync(draftPath)) {
    const content = fs.readFileSync(draftPath, 'utf8');
    const m = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (m) title = m[1].trim();
  }

  const series = detectSeries(slug);
  const hashtags = generateHashtags(vertical, series, title);

  const outPath = path.join(slugDir, 'hashtags.txt');
  fs.writeFileSync(outPath, hashtags.join('\n') + '\n', 'utf8');

  console.log(`  OK (${hashtags.length}個): ${slug}`);
  return { status: 'ok', slug, count: hashtags.length };
}

// ============================================================
// エントリポイント
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
  const allMode = args.includes('--all');
  const draftRoot = path.join(PROJECT_ROOT, 'docs/31_note記事原稿');

  const indexPath = path.join(PROJECT_ROOT, '.claude/state/note-draft-index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const drafts = indexData.drafts || {};

  if (!allMode && !targetSlug) {
    console.log('Usage: node generate-note-hashtags.mjs [--slug <slug>] [--all]');
    return;
  }

  const targets = targetSlug
    ? { [targetSlug]: drafts[targetSlug] }
    : drafts;

  console.log(`=== ハッシュタグ生成 (対象: ${Object.keys(targets).length}件) ===`);
  const results = [];
  for (const [slug, info] of Object.entries(targets)) {
    if (!info) {
      console.log(`  NOT FOUND: ${slug}`);
      continue;
    }
    results.push(processSlug(slug, info, draftRoot));
  }

  const ok = results.filter(r => r.status === 'ok').length;
  const skip = results.filter(r => r.status === 'skip').length;
  console.log(`\n完了: OK=${ok}件, SKIP(未展開)=${skip}件`);
  if (skip > 0) {
    console.log('  未展開のドラフトは restore-from-r2.sh で展開後に再実行してください');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
