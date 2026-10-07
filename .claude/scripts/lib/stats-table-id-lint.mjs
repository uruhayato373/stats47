/**
 * stats-table-id-lint — 記事が書いた e-Stat 統計表 ID (statsDataId) を、e-Stat のメタ情報の控えと照らす (共有ライブラリ)
 *
 * ルールの所在: `.claude/rules/blog-quality-standards.md`「統計表 ID は e-Stat の控えと照らす」
 *
 * なぜ要るか (2026-10-07): 記事の書き直しで、次の取り違えが critic の目視でしか見つからなかった。
 *   - `0003445758` (賃金構造基本統計調査) に「県民所得統計」と書いた
 *   - 「生産農業所得統計」の例として `0003456789` (実際は社会生活基本調査) を書いた
 *   - e-Stat に存在しない `0003337392`・`0004021907` を検索結果の例として並べた
 * ID は読者が e-Stat でそのまま引く値なので、名前と食い違うと読者の作業がそこで止まる。
 *
 * 照らす相手は `datasetDir("estat.meta")/<statsDataId>.json` (getMetaInfo の控え。
 * `fetch-estat-meta.mjs` が書く) の `statName` (e-Stat の STAT_NAME)。判定:
 *   - 控えが無い / 控えに statName が無い → STATS_TABLE_UNVERIFIED (取得してから公開する)
 *   - 控えが e-Stat のエラー (存在しない ID) → STATS_TABLE_NOT_FOUND
 *   - ID と同じ文 (その文に統計名が無ければ直前の文) に統計名らしい語があり、
 *     その中に控えの statName が無い → STATS_TABLE_NAME_MISMATCH
 *   - 近くに統計名が書かれていなければ判定しない (名前を主張していないので取り違えようがない)
 *   - 1 文に ID が複数あるときは、前後の ID との間の文字だけを見る (隣の ID の名前を拾わない)
 *   - 社会・人口統計体系 (SSDS) の表は名前を照らさない。指標ごとに元の調査 (家計調査・県民経済計算など) が
 *     違い、元の調査名で呼ぶのも誤りではないため。ID の実在だけを確かめる
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const META_DIR = datasetDir("estat.meta");

/** e-Stat の統計表 ID は 10 桁で、現行の表はすべて 000 で始まる。 */
const STATS_DATA_ID = /(?<!\d)000\d{7}(?!\d)/g;

/** 「〇〇統計」「〇〇調査」の形の語。統計名でない一般語は GENERIC_NAMES で外す。 */
const SURVEY_LIKE =
  /[\p{Script=Han}\p{Script=Katakana}ー・]*(?:統計調査|調査|統計|センサス|経済計算|統計体系)/gu;
const MIN_NAME_LENGTH = 4;
/** 指標ごとに元の調査が違う加工統計。名前の照合をしない (上の説明)。 */
const COMPILED_STAT_NAMES = new Set(["社会・人口統計体系"]);
const GENERIC_NAMES = new Set([
  "悉皆調査", "全数調査", "標本調査", "抽出調査", "政府統計", "公的統計", "基幹統計", "一般統計",
  "業務統計", "加工統計", "統計調査", "完全悉皆調査",
]);

/** 比較用の正規化: 全角半角をそろえ、空白・括弧・中黒の有無の揺れを消す。 */
function normalize(text) {
  return text.normalize("NFKC").replace(/[\s「」『』・]/g, "");
}

/** 控えの statName を名乗る書き方。「賃金構造基本統計調査」は「賃金構造基本統計」とも書かれる。 */
function acceptedForms(statName) {
  const base = normalize(statName);
  const forms = new Set([base]);
  if (base.endsWith("調査") && base.length > 4) forms.add(base.slice(0, -2));
  return [...forms];
}

export function readEstatMeta(statsDataId) {
  const file = path.join(PROJECT_ROOT, META_DIR, `${statsDataId}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** 控えにある全 statName。正規表現の形に当たらない統計名 (「人口推計」など) も取り違えとして拾うため。 */
export function knownStatNames() {
  const dir = path.join(PROJECT_ROOT, META_DIR);
  if (!fs.existsSync(dir)) return [];
  const names = new Set();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const meta = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    if (meta.statName) names.add(meta.statName);
  }
  return [...names];
}

function surveyNamesIn(sentence, statNames) {
  const found = new Set();
  for (const match of sentence.matchAll(SURVEY_LIKE)) {
    const name = match[0].replace(/^・+/, "");
    if (name.length >= MIN_NAME_LENGTH && !GENERIC_NAMES.has(name)) found.add(name);
  }
  const normalized = normalize(sentence);
  for (const statName of statNames) {
    if (normalized.includes(normalize(statName))) found.add(statName);
  }
  return [...found];
}

/** 本文を文に分ける。コードブロックの中は 1 行を 1 文とする (句点が無いため)。 */
function splitSentences(md) {
  const sentences = [];
  for (const line of md.split("\n")) {
    if (!line.trim()) {
      sentences.push(null); // 段落の区切り。直前の文をまたいで参照しない
      continue;
    }
    for (const part of line.split(/(?<=[。！？])/)) if (part.trim()) sentences.push(part);
  }
  return sentences;
}

/**
 * @param {string} md 記事 markdown
 * @param {{ readMeta?: (id: string) => any, statNames?: string[] }} [deps] テスト用の差し替え口
 */
export function lintStatsTableIds(md, deps = {}) {
  const readMeta = deps.readMeta ?? readEstatMeta;
  const statNames = deps.statNames ?? knownStatNames();
  const blockers = [];
  const hits = [];
  const seen = new Set();
  const report = (key, message, hit) => {
    hits.push(hit);
    if (seen.has(key)) return;
    seen.add(key);
    blockers.push(message);
  };

  const sentences = splitSentences(md);
  sentences.forEach((sentence, i) => {
    if (!sentence) return;
    const matches = [...sentence.matchAll(STATS_DATA_ID)];
    matches.forEach((match, k) => {
      const id = match[0];
      const meta = readMeta(id);
      if (meta?.error) {
        report(
          `notfound:${id}`,
          `STATS_TABLE_NOT_FOUND: 統計表 ID ${id} は e-Stat に存在しません (e-Stat の応答: ${meta.error})。実在する表の ID に直すか、ID を書かないでください`,
          { id, kind: "not-found" },
        );
        return;
      }
      if (!meta?.statName) {
        report(
          `unverified:${id}`,
          `STATS_TABLE_UNVERIFIED: 統計表 ID ${id} の統計名が e-Stat の控え (${META_DIR}/${id}.json) にありません。node .claude/scripts/estat/fetch-estat-meta.mjs --full --ids ${id} で取得し、ID と統計名を確かめてから公開してください`,
          { id, kind: "unverified" },
        );
        return;
      }
      if (COMPILED_STAT_NAMES.has(meta.statName)) return;
      // 名前は ID と同じ文に書くことが多い。ID が複数ある文は前後の ID の間だけを見る。
      // 文の最初の ID で名前が無ければ、直前の文 (同じ段落内) を見る
      const from = k > 0 ? matches[k - 1].index + matches[k - 1][0].length : 0;
      const to = k < matches.length - 1 ? matches[k + 1].index : sentence.length;
      let names = surveyNamesIn(sentence.slice(from, to), statNames);
      if (names.length === 0 && k === 0 && sentences[i - 1]) names = surveyNamesIn(sentences[i - 1], statNames);
      if (names.length === 0) return;
      const forms = acceptedForms(meta.statName);
      if (names.some((name) => forms.some((form) => normalize(name).includes(form)))) return;
      report(
        `mismatch:${id}:${names.join("/")}`,
        `STATS_TABLE_NAME_MISMATCH: 統計表 ID ${id} は e-Stat では「${meta.statName}」の表 (${meta.title}) ですが、近くに「${names.join("」「")}」と書いています。統計名か ID を直してください`,
        { id, kind: "mismatch", names },
      );
    });
  });
  return { blockers, warnings: [], hits };
}
