/**
 * 指標定義シート — 記事・書籍が使う指標の「単位・対象と分母・期間の型・調査・注意」を
 * data-configs (git TS SSOT) から決定的に引き、執筆 (article-writer) と審査 (blog-critic) の
 * 両方に同じ表を渡す。
 *
 * ★なぜ要るか (2026-09-19)
 *   K-S1-01 の全章レビューで BLOCK 8 / MAJOR 19 のうち大半が「本文 2020 年値 vs 図 2021 年値」
 *   「名目支出 ÷ 実質所得」「二人以上世帯全体と勤労者世帯の混同」「相関係数 0.39 を『4割』」の
 *   ように、指標の定義を確かめれば防げる種類だった。quality-gate は形式、factual-check は
 *   値の存在しか見ず、critic の rubric にも定義の項目が無かった。書く側・見る側のどちらも
 *   metric config を読む手順になっていなかったので、その表をここで作る。
 *
 * 実行:
 *   npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --slug <slug> [--slug ...]
 *   npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --keys a,b,c
 *   npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --article docs/21_ブログ記事原稿/<slug>/article.md
 *
 * 指標の集め方 (--slug / --article):
 *   本文の `/ranking/<key>` リンク + data/*.json の rankingKey (R2 または docs/21 のローカル)。
 *   出力は markdown 表 (stdout)。`--out <path>` でファイルへ。
 *
 * 判定はしない。表を出すだけ (定義の矛盾を見つけるのは人 / critic の仕事)。
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { METRICS_REGISTRY } from "../../../packages/data-configs/src/registry.ts";
import type { MetricConfig } from "../../../packages/data-configs/src/types.ts";
import surveysMaster from "../../../packages/ranking/src/data/surveys.json" with { type: "json" };

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

interface SurveyRow {
  id: string;
  name: string;
  organization?: string | null;
}
const SURVEYS = new Map<string, SurveyRow>(
  ((surveysMaster as { surveys?: SurveyRow[] }).surveys ?? (surveysMaster as unknown as SurveyRow[])).map((s) => [s.id, s]),
);

function argAll(name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < process.argv.length; i++) if (process.argv[i] === `--${name}` && process.argv[i + 1]) out.push(process.argv[i + 1]);
  return out;
}

/** 本文と data/*.json から指標キーを集める (順序は出現順・重複なし)。 */
export async function collectKeys(slug: string): Promise<string[]> {
  const keys: string[] = [];
  const push = (k: string) => {
    if (k && !keys.includes(k)) keys.push(k);
  };
  const local = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿", slug);
  let md: string;
  if (fs.existsSync(path.join(local, "article.md"))) {
    md = fs.readFileSync(path.join(local, "article.md"), "utf8");
    const dataDir = path.join(local, "data");
    if (fs.existsSync(dataDir)) {
      for (const f of fs.readdirSync(dataDir).filter((x) => x.endsWith(".json"))) {
        try {
          const j = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8")) as { rankingKey?: string };
          if (j.rankingKey) push(j.rankingKey);
        } catch {
          /* 図 JSON でないものは無視 */
        }
      }
    }
  } else {
    const res = await fetch(`${R2_BASE}/app/blog/${slug}/article.md`);
    if (!res.ok) throw new Error(`article not found: ${slug} (${res.status})`);
    md = await res.text();
    for (const m of md.matchAll(/!\[[^\]]*\]\(data\/([a-z0-9-]+)\.svg\)/g)) {
      const jr = await fetch(`${R2_BASE}/app/blog/${slug}/data/${m[1]}.json`);
      if (!jr.ok) continue;
      const j = (await jr.json()) as { rankingKey?: string };
      if (j.rankingKey) push(j.rankingKey);
    }
  }
  for (const m of md.matchAll(/\/ranking\/([a-z0-9-]+)/g)) push(m[1]);
  return keys;
}

function yearType(c: MetricConfig): string {
  if (c.yearFormat === "fiscal") return "年度";
  if (c.yearFormat === "calendar") return "暦年";
  if (c.yearFormat === "plain") return "年 (表記のみ)";
  return "未宣言 (config に yearFormat 無し。出典で確認)";
}

function scope(c: MetricConfig): string {
  const text = `${c.subtitle ?? ""} ${c.description ?? ""} ${c.note ?? ""}`;
  const hits = new Set<string>();
  for (const w of ["二人以上の世帯", "二人以上世帯", "勤労者世帯", "単身世帯", "総世帯", "都道府県庁所在市", "県庁所在市", "事業所", "企業", "人口10万人当たり", "人口千人当たり", "1世帯当たり", "1人当たり", "全国=100", "指数", "構成比", "割合"]) {
    if (text.includes(w)) hits.add(w);
  }
  const calc = c.calculation;
  if (calc?.isCalculated && calc.type === "ratio") {
    hits.add(`比 = ${calc.numeratorKey ?? "?"} ÷ ${calc.denominatorKey ?? "?"}${calc.scaleFactor ? ` × ${calc.scaleFactor}` : ""}`);
  }
  return hits.size ? [...hits].join(" / ") : "(config に対象の記述なし)";
}

function cautions(c: MetricConfig): string {
  const out: string[] = [];
  if (/[%％]/.test(c.unit)) out.push("構成比・割合: 分母が減れば上がる。合計 100% の費目は他費目と負の相関が計算上出る");
  if (c.calculation?.isCalculated && c.calculation.type === "ratio") out.push("分子と分母の対象・年・価格基準 (名目/実質) が同じかを確認");
  if (/指数/.test(c.title)) out.push("指数 (基準=100): 実額に換算しない");
  if (/相関|係数/.test(c.title)) out.push("相関係数 r は説明割合ではない (r² が寄与)");
  if (/世帯/.test(scope(c))) out.push("世帯平均を個人の手取り・県民全体に置き換えない");
  if (c.note) out.push(c.note);
  return out.join("。") || "-";
}

export function buildSheet(keys: string[]): string {
  const rows = keys.map((k) => {
    const c = METRICS_REGISTRY[k];
    if (!c) return `| \`${k}\` | (config 無し) | | | | | 実在しないキー。本文を確認 |`;
    const survey = c.surveyId ? (SURVEYS.get(c.surveyId)?.name ?? c.surveyId) : c.surveyScope === "not-applicable" ? "調査対象外 (台帳等)" : "(surveyId 未設定)";
    const cell = (s: string) => s.replace(/\|/g, "／").replace(/\n/g, " ");
    return `| \`${k}\` | ${cell(c.title)}${c.subtitle ? `（${cell(c.subtitle)}）` : ""} | ${cell(c.unit)} | ${cell(scope(c))} | ${yearType(c)} | ${cell(survey)} | ${cell(cautions(c))} |`;
  });
  return [
    "| key | 指標 | 単位 | 対象・分母 | 期間の型 | 調査 | 読み違い注意 |",
    "|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

async function main(): Promise<void> {
  const slugs = argAll("slug");
  const articles = argAll("article");
  const keysArg = argAll("keys").flatMap((s) => s.split(","));
  const out = argAll("out")[0];
  const keys: string[] = [...keysArg];
  for (const a of articles) slugs.push(path.basename(path.dirname(path.resolve(a))));
  for (const s of slugs) for (const k of await collectKeys(s)) if (!keys.includes(k)) keys.push(k);
  if (keys.length === 0) {
    console.error("usage: --slug <slug> | --article <path> | --keys a,b,c  [--out <path>]");
    process.exit(2);
  }
  const header = slugs.length ? `# 指標定義シート — ${slugs.join(", ")}\n\n` : "# 指標定義シート\n\n";
  const md = `${header}${buildSheet(keys)}\n\n出典: packages/data-configs/src/metrics/<key>.ts (git TS SSOT)。表に無い前提を本文に書かない。「未宣言」は config 側の欠落なので、本文で年の型を書く前に出典 (e-Stat 表) で確かめて config へ反映する。\n`;
  if (out) fs.writeFileSync(out, md);
  else process.stdout.write(md);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
