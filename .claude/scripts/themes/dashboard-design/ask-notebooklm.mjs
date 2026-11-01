/**
 * テーマごとに NotebookLM (既定は「最新の白書」ノート) へ「読者の悩み → 問いの章 → 見せ方」の設計案を聞き、
 * .local/theme-design/proposals/<theme>.json に保存する。案はそのまま使わず apply-design.ts が機械の検査で直す。
 * JSON で答えさせると引用番号が混ざって壊れるので、1 行 1 項目の形で受けて組み立てる。
 *
 * 使い方: node .claude/scripts/themes/dashboard-design/ask-notebooklm.mjs [theme ...]   (保存済みのテーマは飛ばす)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const WORK_DIR = resolve(PROJECT_ROOT, ".local/theme-design");
mkdirSync(resolve(WORK_DIR, "proposals"), { recursive: true });
const inv = JSON.parse(readFileSync(resolve(WORK_DIR, "inventory.json"), "utf8"));
const NOTEBOOK = process.env.NLM_NOTEBOOK ?? "2bf7f0dd";
const only = process.argv.slice(2);
const keys = only.length ? only : Object.keys(inv.themes);
for (const key of keys) {
  const out = resolve(WORK_DIR, "proposals", `${key}.json`);
  if (existsSync(out)) continue;
  const t = inv.themes[key];
  const rows = t.metrics.filter((m) => m.r !== "context").map((m) => {
    const i = inv.metricInfo[m.k] ?? {};
    return `${m.k} | ${m.l ?? i.title} | ${i.units?.[0] ?? i.unit ?? ""} | ${i.years ?? "?"}年分 ${i.range ? i.range.join("-") : ""}`;
  });
  const q = `あなたは統計ダッシュボードの設計者です。都道府県別統計サイトのテーマページ「${t.title}」を、読者の悩み・問いから設計し直します。白書の論点を参考にしてください。

使える指標 (key | 名前 | 単位 | 年数・期間) — これ以外の key は使わない:
${rows.join("\n")}

見せ方の型 (この 5 つだけ):
- trend: 推移。2年分以上ある指標。1ブロック1〜3指標、単位は2種まで
- stat: 数値1つ (値・順位・47都道府県の中の位置)。1ブロック1指標
- ranking: 1年分の指標を47都道府県で比べる棒グラフと地図。1ブロック1〜3指標。章の主役の単年指標に使う
- sex: 男女の比較。[男の指標, 女の指標] の2指標・同じ単位
- composition: 全体の内訳・構成比。同じ単位で、足すと全体 (またはその一部) になる2〜6指標。単位が違うものや合計にならないものは入れない

ルール:
- 章は3〜6個。章の title は読者の問いの形 (例「家賃は高いか」)。concern は読者の悩みを1文
- note は誤読を防ぐ注意だけを60字以内 (単位・対象・年の違いなど)。「〜できます」「〜を確認します」のような案内文は書かない。注意が無ければ空
- 全ての指標をちょうど1回どこかのブロックに入れる。読者の問いに役立たない指標は DROP にする (全体の2割以内)
- 同じ事実を2回見せない

出力は次の行形式だけ。1行に1項目、区切りは「|」、説明文・見出し・引用番号・コードフェンスは書かない:
CHAPTER|章のkey(英小文字とハイフン)|問いの形のtitle|悩み1文|note
BLOCK|view|ブロックの見出し|key1,key2
DROP|key
(BLOCK は直前の CHAPTER に属する)`;
  try {
    try { execFileSync("notebooklm", ["clear"], { stdio: "ignore" }); } catch {}
    const raw = execFileSync("notebooklm", ["ask", "-n", NOTEBOOK, "--json", q], { encoding: "utf8", maxBuffer: 1 << 24, timeout: 300000 });
    writeFileSync(resolve(WORK_DIR, "proposals", `${key}.raw.txt`), raw);
    const body = JSON.parse(raw.slice(raw.indexOf("{")));
    const answer = String(body.answer ?? body.text ?? "").replace(/\s*\[\d+(?:\s*[-,]\s*\d+)*\]/g, "");
    const json = { chapters: [], drop: [] };
    for (const line of answer.split(/\r?\n/)) {
      const f = line.trim().replace(/^[-*]\s*/, "").split("|").map((x) => x.trim());
      if (f[0] === "CHAPTER" && f.length >= 3) json.chapters.push({ key: f[1], title: f[2], concern: f[3] ?? "", description: f[4] ?? "", blocks: [] });
      else if (f[0] === "BLOCK" && f.length >= 4 && json.chapters.length) json.chapters.at(-1).blocks.push({ view: f[1], title: f[2], rankingKeys: f[3].split(/[,、\s]+/).filter(Boolean) });
      else if (f[0] === "DROP" && f[1]) json.drop.push(f[1]);
    }
    if (json.chapters.length === 0) throw new Error("no chapters parsed");
    writeFileSync(out, JSON.stringify(json, null, 1));
    console.log("ok", key);
  } catch (err) {
    console.log("fail", key, String(err).slice(0, 200));
  }
}
