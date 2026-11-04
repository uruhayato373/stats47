/**
 * title-promise-lint — 題と description の約束のうち、機械で確かめられるものを本文と図のデータに照らす
 * (2026-11-04 追加)。
 *
 * critic の指摘の型 `title-promise` は窓の中で 227 件ある。「答えになっているか」の判定は critic の
 * 仕事のままにし、ここでは次の形だけを見る。
 *
 *   ratio-unanswered 題が「何倍」と問うのに本文に倍率が無い              blocker
 *   ratio-unbacked   題の「N倍」が本文のどの倍率とも合わない             blocker
 *   pref-absent      題に挙げた県が本文に 1 回以下しか出てこない         blocker
 *   viewpoint-absent description が並べた視点が本文に出てこない          blocker
 *   ratio-wrong      題の「N倍」が図のデータの比と合わない               warning
 *   why-unanswered   題が理由を約束し、本文が「断定できない」を繰り返す  warning
 *
 * warning の 2 つは実測で blocker にしなかった (2026-11-04・公開済み 767 本)。ratio-wrong の 11 本は
 * 「平均の 5 倍」のように図の最大最小ではない比を題にした記事が多く、誤りと言い切れない。
 * why-unanswered の 37 本は、送り箱では critic PASS の記事にも 18 本あった。「断定できない」は
 * 根拠の無い断定を弱めた結果でもあるので、blocker にすると断定を促してしまう。
 */
import { PREF_NAMES } from './article-factual-check.mjs';
import { proseOf } from './region-claim-lint.mjs';

const RATIO_MIN_TABLE_PREFS = 40;
/** 本文に県名がこの回数に満たなければ、題で約束した県を説明していない */
const PREF_MIN_MENTIONS = 2;
/** 「断定できない」がこの回数以上なら、理由を約束した題に本文が答えていない */
const HEDGE_MIN = 3;

/** 公開を止めず warning に留める規則 (理由は冒頭) */
export const TITLE_PROMISE_WARNING_RULES = new Set(['ratio-wrong', 'why-unanswered']);

const PROMISE_RE = /なぜ|理由|真因|真相|原因/;
const HEDGE_RE = /(?:断定|特定|判別|確認|検証|説明|証明)(?:は|も|まで)?(?:でき|し)(?:ません|ない)|(?:確か|見極)められません|(?:データ|数字|統計)(?:だけ)?(?:で|から)は[^。\n]{0,10}(?:分かりません|わかりません|言えません|読み取れません)/g;
const VIEWPOINTS = ['地理', '産業', '歴史', '気候', '食文化', '文化', '風土', '人口', '医療体制', '交通', '制度'];
const VIEWPOINT_LIST_RE = new RegExp(`((?:${VIEWPOINTS.join('|')})(?:構造)?(?:[・、](?:${VIEWPOINTS.join('|')})(?:構造)?)+)(?:の(?:面|視点|観点|側面))?から`);

export function frontmatterOf(content) {
  const head = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const field = (key) => head.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'))?.[1] ?? '';
  return { title: field('title'), seoTitle: field('seoTitle'), description: field('description') };
}

function prefsIn(text) {
  const found = [];
  for (const m of text.matchAll(new RegExp(PREF_NAMES.join('|'), 'g'))) {
    if (!found.includes(m[0])) found.push(m[0]);
  }
  return found;
}

/** 図ごとの「県 → 値」の表 */
function valueTables(gt) {
  const tables = new Map();
  for (const [pref, facts] of Object.entries(gt ?? {})) {
    for (const f of facts) {
      if (typeof f.value !== 'number' || String(f.source).startsWith('[svg]')) continue;
      if (!tables.has(f.source)) tables.set(f.source, new Map());
      tables.get(f.source).set(pref, f.value);
    }
  }
  return [...tables.values()];
}

/** 題の倍率は丸めや「超」を含むので小数の桁に応じた幅で比べ、「約」は ai-content の数値照合と同じ 5% まで許す */
function ratioMatches(claimed, actual, approximate = false) {
  const width = Math.max(Number.isInteger(claimed) ? 1 : 0.1, claimed * (approximate ? 0.05 : 0.01));
  return actual >= claimed - width && actual <= claimed + width;
}

function lintRatio(title, prose, gt, findings) {
  if (/何倍/.test(title) && !/\d(?:\.\d+)?\s*倍/.test(prose)) {
    findings.push({ rule: 'ratio-unanswered', text: `題が倍率を問うのに本文に倍率がありません:「${title}」` });
  }
  const claimed = title.match(/(約)?(\d[\d,]*(?:\.\d+)?)\s*倍/);
  if (!claimed) return;
  const approximate = claimed[1] !== undefined;
  const n = Number(claimed[2].replaceAll(',', ''));
  const bodyRatios = [...prose.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*倍/g)].map((m) => Number(m[1].replaceAll(',', '')));
  if (!bodyRatios.some((b) => ratioMatches(n, b, approximate))) {
    findings.push({ rule: 'ratio-unbacked', text: `題の ${claimed[2]} 倍に当たる倍率が本文にありません:「${title}」` });
  }
  const tables = valueTables(gt);
  const prefs = prefsIn(title);
  const candidates = [];
  for (const t of tables) {
    if (prefs.length >= 2) {
      const [a, b] = [t.get(prefs[0]), t.get(prefs[1])];
      if (a > 0 && b > 0) candidates.push(Math.max(a, b) / Math.min(a, b));
    } else if (t.size >= RATIO_MIN_TABLE_PREFS) {
      const values = [...t.values()];
      const min = Math.min(...values);
      if (min > 0) candidates.push(Math.max(...values) / min);
    }
  }
  if (candidates.length > 0 && !candidates.some((c) => ratioMatches(n, c, approximate))) {
    findings.push({
      rule: 'ratio-wrong',
      text: `題の ${n} 倍が図のデータの比 (${candidates.map((c) => c.toFixed(2)).join(' / ')} 倍) と合いません:「${title}」`,
    });
  }
}

function lintPrefs(title, prose, findings) {
  for (const pref of prefsIn(title)) {
    const mentions = prose.split(pref).length - 1;
    if (mentions < PREF_MIN_MENTIONS) {
      findings.push({ rule: 'pref-absent', text: `題の${pref}が本文に ${mentions} 回しか出てきません:「${title}」` });
    }
  }
}

function lintWhy(front, prose, findings) {
  const promised = [front.title, front.seoTitle, front.description].filter((t) => PROMISE_RE.test(t));
  if (promised.length === 0) return;
  const hedges = prose.match(HEDGE_RE) ?? [];
  if (hedges.length >= HEDGE_MIN) {
    findings.push({
      rule: 'why-unanswered',
      text: `題が理由を約束する一方、本文に「${hedges[0]}」の類いが ${hedges.length} 回あります:「${promised[0]}」`,
    });
  }
}

function lintViewpoints(description, prose, findings) {
  const list = description.match(VIEWPOINT_LIST_RE)?.[1];
  if (!list) return;
  // 導入の段落は同じ約束の言い換えなので、最初の見出しより後ろを本文として数える
  const body = prose.slice(Math.max(prose.indexOf('\n## '), 0));
  const missing = list.split(/[・、]/).filter((v) => !body.includes(v.replace(/構造$/, '').replace(/^食/, '')));
  if (missing.length > 0) {
    findings.push({ rule: 'viewpoint-absent', text: `description の「${missing.join('・')}」が本文にありません:「${description.slice(0, 50)}」` });
  }
}

/**
 * @param {string} content article.md の全文
 * @param {object} gt article-factual-check の buildGroundTruth の結果
 * @returns {{rule:string, text:string}[]}
 */
export function lintTitlePromises(content, gt) {
  const front = frontmatterOf(content);
  const prose = proseOf(content);
  const findings = [];
  lintRatio(front.title, prose, gt, findings);
  lintPrefs(front.title, prose, findings);
  lintWhy(front, prose, findings);
  lintViewpoints(front.description, prose, findings);
  return findings;
}
