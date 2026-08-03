/**
 * stats47-note 記事のマガジン割当 (タイトル分類・決定的)
 *
 * 公開済み stats47-note の大半は回収スタブ (key = note ID・不透明) で、カテゴリは
 * タイトルからしか導出できない。日本語タイトルを e-Stat カテゴリのキーワードで分類し、
 * data/stats47-note.ts の各エントリの `magazine` を対応する `s47-*` キーへ書き換える。
 *
 *   - 誤 vertical (Claude Code / 商品章が stats47-note に混入) → magazine=null のまま flag
 *   - 分類不能 → magazine=null のまま flag (手動レビュー対象)
 *
 * 割当先マガジンは magazines.ts に定義済みの s47-* キー。実行後は
 *   npx tsx validate-note-catalog.ts   で整合を確認する。
 *
 * Usage:
 *   node assign-magazines-by-title.mjs            # dry-run (割当予定を表示)
 *   node assign-magazines-by-title.mjs --apply    # data/stats47-note.ts を書き換え
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "data/stats47-note.ts");
const APPLY = process.argv.includes("--apply");

// Claude Code / 商品章 = stats47-note に誤混入。カテゴリマガジンに入れない (要 vertical 是正)。
const MISVERTICAL =
  /claude code|\.claude|mcp server|subagents|\bprompt\b|excel マクロ|苦情メール|住民問い合わせ|上司|上席|退職後のキャリア|説明資料|導入を渋る|kml|第\d章|カラーパレット|配色カタログ|d3\.js|チートシート|実装レシピ|付録|完結/i;

// タイトル日本語キーワード → e-Stat カテゴリ (順序 = 優先度、先勝ち)
const RULES = [
  ["sports-culture", /行動者率|趣味・娯楽時間|趣味や遊び|リタイア後|老後|日曜大工|メディア接触|メディア時間|過ごし方/],
  ["agriculture", /農業|農産|農家|漁業|漁獲|漁港|林業|耕地|畜産|水産|酪農|養殖|りんご|消費量/],
  ["fiscal", /財政|公債|地方債|歳入|歳出|職員数|公務員|税収|課税|財政力|健全化|行政部門|人件費|自主財源|実質収支|経常収支|将来負担|投資的経費|行政事件/],
  ["health", /医療|病院|診療|介護|年金|生活保護|健診|死亡率|健康|歯科|自殺|平均寿命|要介護|受診|看護|障害|薬局|妊産婦|充足率|生命保険/],
  ["education", /学校|大学|進学|学力|体力|体重|身長|図書館|教員|生徒|児童|保育|幼稚園|教育費/],
  ["economy", /所得|物価|消費支出|貯蓄|家計|県民所得|購買|価格|支出|預貯金|負債|消費者物価|エアコン/],
  ["housing", /住宅|持ち家|空き家|建設|着工|家賃|地価|床面積|マンション|一戸建|普及率/],
  ["labor", /賃金|年収|給与|初任給|通勤|求人|失業|有効求人|休暇|残業|労働|就業|雇用|自分の時間/],
  ["population", /人口|世帯|出生|婚姻|初婚|離婚|転入|転出|高齢|未婚|少子|子ども|合計特殊/],
  ["climate", /気温|降水|日照|面積|晴天|積雪|森林|気候|降雪|快晴|真夏日|猛暑/],
  ["tourism", /観光|宿泊|ホテル|旅館|旅行|温泉|入込/],
  ["industry", /小売|卸売|商店|店舗|コンビニ|飲食|スーパー|製造品|工業|出荷額|鉱業|製造業|工場|粉じん/],
  ["safety", /犯罪|刑法|交通事故|災害|ごみ|リサイクル|公害|火災|検挙|警察官|環境/],
  ["infrastructure", /道路|鉄道|駅|港湾|空港|高速|バス|自動車保有/],
  ["ict", /インターネット|スマートフォン|通信|sns|光回線|情報処理|パソコン/i],
  ["international", /外国人|貿易|輸出|輸入|在留|訪日/],
  ["energy", /電力|ガス|水道|エネルギー|再生可能|太陽光|発電/],
];
const CAT_TO_MAGAZINE = {
  "sports-culture": "s47-sports-culture",
  agriculture: "s47-agriculture",
  fiscal: "s47-fiscal",
  health: "s47-health",
  education: "s47-education",
  economy: "s47-economy",
  housing: "s47-housing",
  labor: "s47-labor",
  population: "s47-population",
  climate: "s47-climate",
  tourism: "s47-tourism",
  industry: "s47-industry",
  safety: "s47-safety",
  infrastructure: "s47-infrastructure",
  ict: "s47-ict",
  international: "s47-international",
  energy: "s47-energy",
};
// クリーンな draft key (A-<category>-...) 用: e-Stat カテゴリ prefix → マガジン
const PREFIX_TO_MAGAZINE = {
  laborwage: "s47-labor",
  landweather: "s47-climate",
  population: "s47-population",
  agriculture: "s47-agriculture",
  economy: "s47-economy",
  socialsecurity: "s47-health",
  educationsports: "s47-education",
  administrativefinancial: "s47-fiscal",
  safetyenvironment: "s47-safety",
  tourism: "s47-tourism",
  miningindustry: "s47-industry",
  commercial: "s47-industry",
  construction: "s47-housing",
  infrastructure: "s47-infrastructure",
  ict: "s47-ict",
  international: "s47-international",
  energy: "s47-energy",
};

function classify(key, title) {
  if (MISVERTICAL.test(title)) return { magazine: null, reason: "misvertical" };
  for (const [cat, re] of RULES) if (re.test(title)) return { magazine: CAT_TO_MAGAZINE[cat], reason: "title" };
  // draft の A-<cat>-* / <cat>-* を key prefix で救済
  const stripped = key.replace(/^[A-Da-d]-/, "");
  const seg0 = stripped.split("-")[0];
  if (PREFIX_TO_MAGAZINE[seg0]) return { magazine: PREFIX_TO_MAGAZINE[seg0], reason: "keyprefix" };
  return { magazine: null, reason: "unresolved" };
}

const src = readFileSync(DATA, "utf8");
// 各エントリ (key: の位置) 単位で処理する
const keyMatches = [...src.matchAll(/key:\s*"([^"]+)"/g)];
const summary = {};
const misvertical = [];
const unresolved = [];
let assigned = 0;
let out = "";
let cursor = 0;
for (let i = 0; i < keyMatches.length; i++) {
  const m = keyMatches[i];
  const segStart = m.index;
  const segEnd = i + 1 < keyMatches.length ? keyMatches[i + 1].index : src.length;
  // このエントリのテキスト
  const segment = src.slice(segStart, segEnd);
  const key = m[1];
  const titleM = segment.match(/title:\s*"((?:[^"\\]|\\.)*)"/);
  const title = titleM ? titleM[1] : "";
  const { magazine, reason } = classify(key, title);
  let newSegment = segment;
  if (magazine) {
    const before = segment;
    newSegment = segment.replace(/magazine:\s*(?:null|"[^"]*")/, `magazine: "${magazine}"`);
    if (newSegment !== before) {
      assigned++;
      summary[magazine] = (summary[magazine] || 0) + 1;
    }
  } else if (reason === "misvertical") {
    misvertical.push(title || key);
  } else {
    unresolved.push(title || key);
  }
  // segStart より前 (最初のループのみ) を先に足す
  out += src.slice(cursor, segStart) + newSegment;
  cursor = segEnd;
}
out += src.slice(cursor);

console.log(`=== マガジン割当 (${keyMatches.length} エントリ) ===`);
console.log(`割当: ${assigned} | 誤vertical(null保持): ${misvertical.length} | 未解決(null保持): ${unresolved.length}`);
console.log("\nマガジン別割当数:");
for (const [k, n] of Object.entries(summary).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);
if (misvertical.length) {
  console.log(`\n[誤 vertical — Claude Code/商品章が stats47-note に混入。要 vertical 是正]`);
  misvertical.forEach((t) => console.log("  · " + t));
}
if (unresolved.length) {
  console.log(`\n[未解決 — 手動レビュー]`);
  unresolved.forEach((t) => console.log("  · " + t));
}
if (APPLY) {
  writeFileSync(DATA, out);
  console.log("\n✓ data/stats47-note.ts を書き換えました");
} else {
  console.log("\n(dry-run。--apply で書き換え)");
}
