#!/usr/bin/env node
/**
 * note ドラフトのカバー SVG + PNG (1280×670) を一括生成する。
 * stats47-note / koumuin-* シリーズ全般に対応した汎用版。
 *
 * Usage:
 *   node .claude/scripts/note/generate-note-covers.mjs [--slug <slug>] [--all]
 *
 * 出力: docs/31_note記事原稿/<vertical>/<slug>/images/cover-1280x670.{svg,png}
 * (存在しない場合は先に restore-from-r2.sh で復元する)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

const W = 1280;
const H = 670;

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// テーマ定義 (vertical × series)
// ============================================================

const THEMES = {
  'stats47-note': {
    A: {
      bg: '#0f172a', accent: '#3b82f6', accentBg: '#1e3a5f',
      eyebrowColor: '#93c5fd', titleColor: '#f8fafc',
      labelText: 'RANKING DATA',
      footerText: '統計で見る都道府県 | stats47.jp',
    },
    B: {
      bg: '#1a1a2e', accent: '#f59e0b', accentBg: '#2d2a0f',
      eyebrowColor: '#fcd34d', titleColor: '#fafaf9',
      labelText: 'DATA STORY',
      footerText: '統計で見る都道府県 | stats47.jp',
    },
    C: {
      bg: '#0c1f14', accent: '#10b981', accentBg: '#052e16',
      eyebrowColor: '#6ee7b7', titleColor: '#f0fdf4',
      labelText: 'TREND ANALYSIS',
      footerText: '統計で見る都道府県 | stats47.jp',
    },
    D: {
      bg: '#1e0a2e', accent: '#a855f7', accentBg: '#3b0764',
      eyebrowColor: '#d8b4fe', titleColor: '#faf5ff',
      labelText: 'LIFE INSIGHT',
      footerText: '統計で見る都道府県 | stats47.jp',
    },
    default: {
      bg: '#0f172a', accent: '#6366f1', accentBg: '#1e1b4b',
      eyebrowColor: '#a5b4fc', titleColor: '#f8fafc',
      labelText: 'DATA',
      footerText: '統計で見る都道府県 | stats47.jp',
    },
  },
  // ★ koumuin-* の正典カバー生成は generate-koumuin-covers.cjs (共通背景+中央ボックスの新デザイン、
  //   SVG+PNG を直接出力)。下記 koumuin テーマは旧・簡易ダーク版。koumuin を本ファイルで再生成すると
  //   新デザインを上書きしてしまうため、koumuin は cjs を使うこと (publish-note SKILL.md も cjs 参照)。
  'koumuin-claude-code': {
    // カテゴリ別 (generate-koumuin-covers.cjs と色体系を合わせる)
    intro:        { bg: '#0f172a', accent: '#64748b', accentBg: '#f1f5f9', eyebrowColor: '#cbd5e1', titleColor: '#f8fafc', labelText: 'START HERE', footerText: '公務員のためのClaude Code | stats47.jp' },
    setup:        { bg: '#1e3a5f', accent: '#2563eb', accentBg: '#dbeafe', eyebrowColor: '#93c5fd', titleColor: '#f0f9ff', labelText: 'SETUP', footerText: '公務員のためのClaude Code | stats47.jp' },
    documents:    { bg: '#052e16', accent: '#059669', accentBg: '#d1fae5', eyebrowColor: '#6ee7b7', titleColor: '#f0fdf4', labelText: 'DOCUMENTS', footerText: '公務員のためのClaude Code | stats47.jp' },
    security:     { bg: '#450a0a', accent: '#dc2626', accentBg: '#fee2e2', eyebrowColor: '#fca5a5', titleColor: '#fff7f7', labelText: 'SECURITY', footerText: '公務員のためのClaude Code | stats47.jp' },
    data:         { bg: '#2e1065', accent: '#7c3aed', accentBg: '#ede9fe', eyebrowColor: '#c4b5fd', titleColor: '#faf5ff', labelText: 'DATA', footerText: '公務員のためのClaude Code | stats47.jp' },
    pr:           { bg: '#431407', accent: '#ea580c', accentBg: '#ffedd5', eyebrowColor: '#fdba74', titleColor: '#fff7ed', labelText: 'PR', footerText: '公務員のためのClaude Code | stats47.jp' },
    automation:   { bg: '#164e63', accent: '#0891b2', accentBg: '#cffafe', eyebrowColor: '#67e8f9', titleColor: '#f0fdff', labelText: 'AUTOMATION', footerText: '公務員のためのClaude Code | stats47.jp' },
    organization: { bg: '#1e1b4b', accent: '#4f46e5', accentBg: '#e0e7ff', eyebrowColor: '#a5b4fc', titleColor: '#eef2ff', labelText: 'ORGANIZATION', footerText: '公務員のためのClaude Code | stats47.jp' },
    career:       { bg: '#422006', accent: '#b45309', accentBg: '#fef3c7', eyebrowColor: '#fde68a', titleColor: '#fffbeb', labelText: 'CAREER', footerText: '公務員のためのClaude Code | stats47.jp' },
    default:      { bg: '#0f172a', accent: '#6366f1', accentBg: '#e0e7ff', eyebrowColor: '#a5b4fc', titleColor: '#f8fafc', labelText: 'CLAUDE CODE', footerText: '公務員のためのClaude Code | stats47.jp' },
  },
  'koumuin-estat-claude-code': {
    default: {
      bg: '#0c1421', accent: '#0ea5e9', accentBg: '#082f49',
      eyebrowColor: '#7dd3fc', titleColor: '#f0f9ff',
      labelText: 'e-Stat × Claude Code',
      footerText: '公務員のためのe-Stat活用 | stats47.jp',
    },
  },
  'koumuin-gis': {
    default: {
      bg: '#0a1f0a', accent: '#16a34a', accentBg: '#052e16',
      eyebrowColor: '#86efac', titleColor: '#f0fdf4',
      labelText: 'GIS × Claude Code',
      footerText: '公務員のためのGIS活用 | stats47.jp',
    },
  },
};

// ============================================================
// SVG テンプレート生成
// ============================================================

function wrapTitle(title, maxLineLen = 22) {
  // 長いタイトルを2〜3行に分割
  if (title.length <= maxLineLen) return [title];
  const lines = [];
  let remaining = title;
  while (remaining.length > maxLineLen) {
    // 日本語・英数字ともに対応した折り返し
    let breakAt = maxLineLen;
    // 区切り文字優先
    const breakers = ['｜', '〜', '—', '/', ' ', '・', '、', 'と', 'で', 'の'];
    for (const br of breakers) {
      const idx = remaining.lastIndexOf(br, maxLineLen);
      if (idx > maxLineLen / 2) { breakAt = idx + (br.length > 1 ? 1 : 0); break; }
    }
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  return lines;
}

function makeCoverSvg({ title, eyebrow, label, footerText, theme }) {
  const t = theme;
  const titleLines = wrapTitle(title);
  const lineH = 68;
  const titleY = 300 - ((titleLines.length - 1) * lineH) / 2;

  const titleSvg = titleLines.map((line, i) =>
    `<text x="100" y="${titleY + i * lineH}" font-size="52" font-weight="700"
      font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif"
      fill="${esc(t.titleColor)}" xml:space="preserve">${esc(line)}</text>`
  ).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${esc(t.bg)}"/>
      <stop offset="100%" stop-color="${esc(t.accentBg)}"/>
    </linearGradient>
    <linearGradient id="accentBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${esc(t.accent)}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${esc(t.accent)}" stop-opacity="0.6"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="${W}" height="${H}" fill="url(#grad)"/>

  <!-- アクセントバー（左） -->
  <rect x="0" y="0" width="8" height="${H}" fill="url(#accentBar)"/>

  <!-- ラベルバッジ -->
  <rect x="100" y="80" width="${label.length * 13 + 40}" height="38" rx="4"
    fill="${esc(t.accent)}" opacity="0.9"/>
  <text x="120" y="106" font-size="18" font-weight="700" letter-spacing="2"
    font-family="'Arial','Helvetica',sans-serif" fill="#ffffff">${esc(label)}</text>

  <!-- アイブロウ（カテゴリ・シリーズ説明） -->
  <text x="100" y="160" font-size="22" font-weight="400"
    font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif"
    fill="${esc(t.eyebrowColor)}" opacity="0.85">${esc(eyebrow)}</text>

  <!-- タイトル本文 -->
  ${titleSvg}

  <!-- 区切り線 -->
  <line x1="100" y1="${H - 110}" x2="${W - 100}" y2="${H - 110}"
    stroke="${esc(t.accent)}" stroke-width="1" opacity="0.4"/>

  <!-- フッター -->
  <text x="100" y="${H - 72}" font-size="20" font-weight="400"
    font-family="'Arial','Helvetica',sans-serif"
    fill="${esc(t.eyebrowColor)}" opacity="0.7">${esc(footerText)}</text>

  <!-- 右下デコ（アクセントドット） -->
  <circle cx="${W - 80}" cy="${H - 80}" r="40" fill="${esc(t.accent)}" opacity="0.08"/>
  <circle cx="${W - 80}" cy="${H - 80}" r="20" fill="${esc(t.accent)}" opacity="0.12"/>
</svg>`;
}

// ============================================================
// シリーズ判定
// ============================================================

function detectSeries(slug) {
  const s = slug.toLowerCase();
  if (s.startsWith('a-') || /^a-laborwage/.test(s) || s.startsWith('a_')) return 'A';
  if (s.startsWith('b-') || s.startsWith('b_')) return 'B';
  if (s.startsWith('c-') || s.startsWith('c_')) return 'C';
  if (s.startsWith('d-') || s.startsWith('d_') || s.startsWith('d1-')) return 'D';
  if (/setup|environment|install/.test(s)) return 'setup';
  if (/doc|minutes|ordinance|proposal|assembly/.test(s)) return 'documents';
  if (/security|personal|audit|offline/.test(s)) return 'security';
  if (/data|excel|budget|aggregat/.test(s)) return 'data';
  if (/automat|routine|mcp|subagent|parallel/.test(s)) return 'automation';
  if (/career|retire|evaluat|skeptic|study|boss|approval/.test(s)) return 'career';
  if (/pr|magazine|faq|complaint|disaster/.test(s)) return 'pr';
  if (/intro|start|begin|intro-for/.test(s)) return 'intro';
  return 'default';
}

function getEyebrow(vertical, series, slug) {
  if (vertical === 'stats47-note') {
    const map = { A: '都道府県ランキングデータ', B: 'データ読み物', C: 'トレンド分析', D: '生活とデータ' };
    return map[series] || '都道府県統計データ';
  }
  if (vertical === 'koumuin-claude-code') {
    const map = {
      intro: 'Claude Code 入門', setup: '環境構築ガイド', documents: '文書作成効率化',
      security: 'セキュリティ対策', data: 'データ活用術', pr: '広報・市民対応',
      automation: '業務自動化', organization: '組織・情報管理', career: 'キャリア・働き方',
    };
    return map[series] || '公務員のためのClaude Code活用術';
  }
  if (vertical === 'koumuin-estat-claude-code') return 'e-Stat × Claude Code 活用術';
  if (vertical === 'koumuin-gis') return 'GIS × Claude Code 活用術';
  return 'note 記事';
}

// ============================================================
// 1記事の処理
// ============================================================

function resolveSlugDir(draftRoot, vertical, slug) {
  if (vertical === 'stats47-note') {
    const flat = path.join(draftRoot, slug);
    if (fs.existsSync(flat)) return flat;
  }
  return path.join(draftRoot, vertical, slug);
}

async function processSlug(slug, info, draftRoot) {
  const { vertical } = info;
  const slugDir = resolveSlugDir(draftRoot, vertical, slug);

  if (!fs.existsSync(slugDir)) {
    console.log(`  SKIP (未展開): ${slug}`);
    return { status: 'skip', slug };
  }

  const draftPath = path.join(slugDir, 'draft.md');
  let title = slug.replace(/-/g, ' ');
  if (fs.existsSync(draftPath)) {
    const content = fs.readFileSync(draftPath, 'utf8');
    const m = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (m) title = m[1].trim().replace(/^["']|["']$/g, '');
  }

  const series = detectSeries(slug);
  const vertThemes = THEMES[vertical] || THEMES['stats47-note'];
  const theme = vertThemes[series] || vertThemes['default'];
  const isGeoProduct = vertical === 'stats47-note' && slug.startsWith('d-geo-');
  const eyebrow = isGeoProduct ? 'GIS再現データ' : getEyebrow(vertical, series, slug);
  const label = isGeoProduct ? 'GEO DATA PACK' : theme.labelText;
  const footerText = theme.footerText;

  const svg = makeCoverSvg({ title, eyebrow, label, footerText, theme });

  const imagesDir = path.join(slugDir, 'images');
  fs.mkdirSync(imagesDir, { recursive: true });
  const outPath = path.join(imagesDir, 'cover-1280x670.svg');
  fs.writeFileSync(outPath, svg, 'utf8');
  const pngPath = path.join(imagesDir, 'cover-1280x670.png');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);

  console.log(`  OK: ${slug} → ${outPath.replace(PROJECT_ROOT, '')} + PNG`);
  return { status: 'ok', slug };
}

function discoverDraftInfo(slug, draftRoot) {
  const direct = path.join(draftRoot, slug, 'draft.md');
  const candidates = [direct];
  if (fs.existsSync(draftRoot)) {
    for (const vertical of fs.readdirSync(draftRoot)) {
      candidates.push(path.join(draftRoot, vertical, slug, 'draft.md'));
    }
  }
  const draftPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!draftPath) return null;
  const content = fs.readFileSync(draftPath, 'utf8');
  const vertical = content.match(/^vertical:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? 'stats47-note';
  return { vertical };
}

// ============================================================
// エントリポイント
// ============================================================

const args = process.argv.slice(2);
const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const allMode = args.includes('--all');

if (!allMode && !targetSlug) {
  console.log('Usage: node generate-note-covers.mjs [--slug <slug>] [--all]');
  process.exit(0);
}

const indexPath = path.join(PROJECT_ROOT, '.claude/state/note-draft-index.json');
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const drafts = indexData.drafts || {};
const draftRoot = path.join(PROJECT_ROOT, 'docs/31_note記事原稿');

const targets = targetSlug
  ? { [targetSlug]: drafts[targetSlug] ?? discoverDraftInfo(targetSlug, draftRoot) }
  : drafts;

console.log(`=== カバー SVG 生成 (対象: ${Object.keys(targets).length}件) ===`);
const results = [];
for (const [slug, info] of Object.entries(targets)) {
  if (!info) { console.log(`  NOT FOUND: ${slug}`); continue; }
  results.push(await processSlug(slug, info, draftRoot));
}

const ok = results.filter(r => r.status === 'ok').length;
const skip = results.filter(r => r.status === 'skip').length;
console.log(`\n完了: OK=${ok}件, SKIP(未展開)=${skip}件`);
if (skip > 0) {
  console.log('  未展開のドラフトは restore-from-r2.sh で展開後に再実行してください');
}
