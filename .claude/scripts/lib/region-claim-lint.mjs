/**
 * region-claim-lint — 本文の地方のくくりを地方区分の正本と図のデータに照らす (2026-11-04 追加)。
 *
 * critic の指摘の型 `region` は窓の中で 276 件あり、「東北の新潟県」「首都圏の兵庫県」
 * 「北海道・東北で最高の宮城県」のように本文だけで確かめられる誤りが多かった。文章の良し悪しは
 * 見ず、次の形だけを判定する。
 *
 *   membership  「<地方>の<県>」「<地方>では<県>が」で県がその地方に属さない
 *   superlative 「<地方>で最も高い<県>」で県が図のデータ上その地方の端ではない
 *   all-in      「上位N県はすべて<地方>」で上位 N 県に他の地方が混ざる
 *   listed      「上位N県には<地方>、<地方>」で挙げた地方の県が上位 N 県に無い
 *   count       「<地方>の8県」で地方の県の数を超える
 *   coast       「日本海側の<県>」「内陸の<県>」で県がその地理に当たらない
 *
 * 地方の区分は packages/area の 7 区分 (regions.ts) が正本で、ここでは読むだけにする。
 * 小区分 (北陸・東海など) は正本に無いので、定義に揺れがある県は広い側に倒した表で見る
 * (誤検知を出すゲートは運用で無効化されるため。.claude/rules/blog-quality-standards.md)。
 *
 * 図のデータとの照合は、どれか 1 枚の図で主張が成り立てば通す (2 指標の記事や複数年の図で、
 * 別の図の話を誤りと呼ばない)。
 *
 * 実測 (2026-11-04・公開済み 767 本): membership 7 / coast 2 本、all-in・listed・superlative・count は 0 本。
 * 検出は前後の文ごと全件読んだ。「東北以外の県」「関東・中部の東京都」「東海地方から近畿地方にかけて」
 * 「九州・中国四国」のように、地方名の続きを読まずに切ると正しい文を誤検知するので、続きがある形は判定しない。
 * 送り箱 232 本では 0 本。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PREF_NAMES, normalizePref } from './article-factual-check.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** どの図でも順位が取れない主張は照らさない。県の網羅が足りない図は端の判定に使わない */
const MIN_TABLE_PREFS = 40;

/** 小区分。定義に揺れがある県は含める */
const SUB_REGIONS = {
  北陸: ['新潟', '富山', '石川', '福井'],
  東海: ['岐阜', '静岡', '愛知', '三重'],
  甲信越: ['山梨', '長野', '新潟'],
  山陰: ['鳥取', '島根', '山口'],
  山陽: ['岡山', '広島', '山口', '兵庫'],
  首都圏: ['東京', '神奈川', '埼玉', '千葉', '茨城', '栃木', '群馬', '山梨'],
};

/** 日本海に面する道府県 */
const SEA_OF_JAPAN = ['北海道', '青森', '秋田', '山形', '新潟', '富山', '石川', '福井', '京都', '兵庫', '鳥取', '島根', '山口', '福岡', '佐賀', '長崎'];

/** regions.ts の 7 区分を読む。名前の表は prefectures.json */
export function loadRegionTable(root = PROJECT_ROOT) {
  const source = fs.readFileSync(path.join(root, 'packages/area/src/constants/regions.ts'), 'utf8');
  const prefectures = JSON.parse(fs.readFileSync(path.join(root, 'packages/area/src/data/prefectures.json'), 'utf8'));
  const nameOf = new Map(prefectures.map((p) => [p.prefCode, normalizePref(p.prefName)]));
  const regions = {};
  for (const m of source.matchAll(/regionName:\s*"([^"]+)",\s*prefectures:\s*\[([^\]]+)\]/g)) {
    regions[m[1]] = [...m[2].matchAll(/"(\d{5})"/g)].map((c) => nameOf.get(c[1]));
  }
  return regions;
}

function buildMembership(regions) {
  const table = {
    ...regions,
    東北: regions['北海道・東北'].filter((p) => p !== '北海道'),
    九州: regions['九州・沖縄'],
    関西: regions['近畿'],
    ...SUB_REGIONS,
  };
  return new Map(Object.entries(table).map(([k, v]) => [k, new Set(v)]));
}

const REGIONS = loadRegionTable();
const MEMBERSHIP = buildMembership(REGIONS);
/** 「の県の数」を比べる地方。首都圏のような揺れる区分は数えない */
const COUNTABLE = new Set([...Object.keys(REGIONS), '東北', '九州', '関西']);

const prefAlt = [...PREF_NAMES].sort((a, b) => b.length - a.length).join('|');
// 長い名前を先に当てる (北海道・東北 を 東北 より先に、北海道・東北の前の 北海道 を県と読まない)
const regionAlt = [...MEMBERSHIP.keys()].sort((a, b) => b.length - a.length).join('|');
const PREF = `(?:${prefAlt})(?:都|府|県)?`;
const REGION_SUFFIX = '(?:地方|地域|エリア)?';
// 地方名の直後の並びは「、」で別の地方の県へ続くことがある (「四国の高知県、北海道」) ので、続きと読むのは「と」「・」だけ
const PREF_LIST = `${PREF}(?:(?:・|と)${PREF})*`;
const PREF_COMMA_LIST = `${PREF}(?:(?:、|・|と)${PREF})*`;
const REGION_LIST = `(?:${regionAlt})(?:(?:、|・|と|か|や)(?:${regionAlt}))*`;

/** 「九州・四国」のように並べた地方の県の和集合 */
function membersOf(regionList) {
  return new Set([...regionList.matchAll(new RegExp(regionAlt, 'g'))].flatMap((r) => [...MEMBERSHIP.get(r[0])]));
}

function splitPrefs(text) {
  return [...text.matchAll(new RegExp(`(${prefAlt})`, 'g'))].map((m) => m[1]);
}

/** 図・タグ・リンク先・コードを除いた本文 */
export function proseOf(content) {
  return content
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^!\[.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\]\([^)]*\)/g, ']');
}

/** 図のデータを、図ごとの「県 → 順位」の表にする */
export function rankTables(gt) {
  const tables = new Map();
  for (const [pref, facts] of Object.entries(gt ?? {})) {
    for (const f of facts) {
      if (typeof f.rank !== 'number' || String(f.source).startsWith('[svg]')) continue;
      if (!tables.has(f.source)) tables.set(f.source, new Map());
      tables.get(f.source).set(pref, f.rank);
    }
  }
  return [...tables.values()].filter((t) => t.size >= MIN_TABLE_PREFS);
}

function excerpt(text, index, length) {
  return text.slice(index, index + Math.min(length, 60)).replace(/\s+/g, ' ');
}

function lintMembership(prose, findings) {
  const patterns = [
    new RegExp(`(?<![一-龥])(${REGION_LIST})${REGION_SUFFIX}(?:の|では|でも|にある)(${PREF_LIST})`, 'g'),
    new RegExp(`(${PREF_COMMA_LIST})(?:など|を含む|といった|のような)の?(${REGION_LIST})(?!(?:地方|地域|エリア)?(?:以外|から|にかけて|や|と|か|・|、|${regionAlt}))`, 'g'),
  ];
  for (const [i, re] of patterns.entries()) {
    for (const m of prose.matchAll(re)) {
      const [regionName, listText] = i === 0 ? [m[1], m[2]] : [m[2], m[1]];
      const members = membersOf(regionName);
      const outside = splitPrefs(listText).filter((p) => !members.has(p));
      if (outside.length > 0) {
        findings.push({
          rule: 'membership',
          text: `${outside.join('・')}は${regionName}に含まれません:「${excerpt(prose, m.index, m[0].length)}」`,
        });
      }
    }
  }
}

function lintSuperlative(prose, tables, findings) {
  if (tables.length === 0) return;
  const HIGH = '最も(?:高|多)|最高|最多|トップ|首位';
  const LOW = '最も(?:低|少)|最低|最少|最下位';
  const patterns = [
    new RegExp(`(?<![一-龥])(${regionAlt})${REGION_SUFFIX}(?:で|では|の中で|の中では|内で)[、]?(?:は)?(?:順位が|値が)?(${HIGH}|${LOW})[^。、\\n]{0,8}?(${prefAlt})`, 'g'),
    new RegExp(`(${prefAlt})(?:都|府|県)?(?:は|が)(${regionAlt})${REGION_SUFFIX}(?:で|の中で|内で)[、]?(?:順位が|値が)?(${HIGH}|${LOW})`, 'g'),
  ];
  for (const [i, re] of patterns.entries()) {
    for (const m of prose.matchAll(re)) {
      const [regionName, word, pref] = i === 0 ? [m[1], m[2], m[3]] : [m[2], m[3], m[1]];
      const high = new RegExp(`^(?:${HIGH})$`).test(word);
      const members = [...MEMBERSHIP.get(regionName)];
      const holds = tables.some((t) => {
        const ranks = members.map((p) => t.get(p)).filter((r) => r !== undefined);
        const rank = t.get(pref);
        if (rank === undefined || ranks.length === 0) return false;
        return rank === (high ? Math.min(...ranks) : Math.max(...ranks));
      });
      if (!holds) {
        findings.push({
          rule: 'superlative',
          text: `${pref}は図のデータで${regionName}の${high ? '最上位' : '最下位'}ではありません:「${excerpt(prose, m.index, m[0].length)}」`,
        });
      }
    }
  }
}

function topPrefs(table, n, side) {
  const sorted = [...table].sort((a, b) => a[1] - b[1]).map(([p]) => p);
  return side === '上位' ? sorted.slice(0, n) : sorted.slice(-n);
}

function lintTopN(prose, tables, findings) {
  if (tables.length === 0) return;
  const allIn = new RegExp(`(上位|下位)(\\d+)(?:県|位)[^。\\n]{0,10}?(?:すべて|全て|いずれも)[^。\\n]{0,6}?(?<![一-龥])(${REGION_LIST})${REGION_SUFFIX}(?:の|です|に|で)`, 'g');
  for (const m of prose.matchAll(allIn)) {
    // 「1位の高知県を除く上位4県はすべて九州」は順位の端からの数え方が違う
    if (/除く|除いた|以外の/.test(prose.slice(Math.max(0, m.index - 4), m.index))) continue;
    const members = membersOf(m[3]);
    const n = Number(m[2]);
    if (!tables.some((t) => topPrefs(t, n, m[1]).every((p) => members.has(p)))) {
      findings.push({ rule: 'all-in', text: `${m[1]}${n}県に${m[3]}以外の県があります:「${excerpt(prose, m.index, m[0].length)}」` });
    }
  }
  const listed = new RegExp(`(上位|下位)(\\d+)(?:県|位)(?:以内)?(?:に|には|は)、?(${REGION_LIST})の(?:県|府県)`, 'g');
  for (const m of prose.matchAll(listed)) {
    // 「上位10県に東北の県は入っていません」は無いと書いた文
    const after = prose.slice(m.index + m[0].length, m.index + m[0].length + 14);
    if (/ません|ない/.test(after)) continue;
    const n = Number(m[2]);
    const names = [...m[3].matchAll(new RegExp(regionAlt, 'g'))].map((r) => r[0]);
    const missing = names.filter((r) => !tables.some((t) => topPrefs(t, n, m[1]).some((p) => MEMBERSHIP.get(r).has(p))));
    if (missing.length > 0) {
      findings.push({ rule: 'listed', text: `${m[1]}${n}県に${missing.join('・')}の県はありません:「${excerpt(prose, m.index, m[0].length)}」` });
    }
  }
}

function lintCount(prose, findings) {
  const re = new RegExp(`(?<![一-龥])(${regionAlt})${REGION_SUFFIX}の(?:全)?(\\d+)(?:都|道|府|県)+`, 'g');
  for (const m of prose.matchAll(re)) {
    if (!COUNTABLE.has(m[1])) continue;
    const size = MEMBERSHIP.get(m[1]).size;
    if (Number(m[2]) > size) {
      findings.push({ rule: 'count', text: `${m[1]}は${size}県です:「${excerpt(prose, m.index, m[0].length)}」` });
    }
  }
}

function lintCoast(prose, findings) {
  const inland = new Set(['栃木', '群馬', '埼玉', '山梨', '長野', '岐阜', '滋賀', '奈良']);
  const seaOfJapan = new Set(SEA_OF_JAPAN);
  // 「内陸の山形」は県の中の内陸部を指すことがあるので、県の分類として書いた形だけを見る
  const checks = [
    { word: '日本海側', members: seaOfJapan },
    { word: '内陸県', members: inland },
    { word: '海なし県', members: inland },
  ];
  for (const { word, members } of checks) {
    const re = new RegExp(`(?<![一-龥])${word}(?:の|にある)(${PREF_LIST})`, 'g');
    for (const m of prose.matchAll(re)) {
      const outside = splitPrefs(m[1]).filter((p) => !members.has(p));
      if (outside.length > 0) {
        findings.push({ rule: 'coast', text: `${outside.join('・')}は${word}に当たりません:「${excerpt(prose, m.index, m[0].length)}」` });
      }
    }
  }
}

/**
 * @param {string} content article.md の全文
 * @param {object} gt article-factual-check の buildGroundTruth の結果
 * @returns {{rule:string, text:string}[]}
 */
export function lintRegionClaims(content, gt) {
  const prose = proseOf(content);
  const tables = rankTables(gt);
  const findings = [];
  lintMembership(prose, findings);
  lintSuperlative(prose, tables, findings);
  lintTopN(prose, tables, findings);
  lintCount(prose, findings);
  lintCoast(prose, findings);
  return findings;
}
