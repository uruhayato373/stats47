/**
 * quality-gate.mjs に 2026-07-31 で追加した 5 つの gate の回帰テスト。
 * 実行: node .claude/scripts/lib/__tests__/quality-gate.svg-gates.test.mjs
 *
 * ★全 PASS は「ゲートが何も見ていない」状態と区別がつかない (blog-quality-standards.md
 * 「ルール ↔ 機械チェック 対応表」)。そこで正常データで発火しないことと、違反を 1 つだけ
 * 注入したデータで発火することの両方を確認する (mutation testing)。
 *
 * quality-gate.mjs は import 時に副作用で走る CLI なので、子プロセスで実行して JSON を読む。
 */
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.resolve(__dirname, "../../blog/quality-gate.mjs");

const GOOD_SVG =
  '<svg viewBox="0 0 960 404" width="960" height="404">' +
  "<style>@media (prefers-color-scheme:dark){.svg-bg{fill:#0f172a}}</style>" +
  "<text>愛知</text></svg>";

const GOOD_ARTICLE = `---
title: なぜ東北で製造品出荷額が伸びたのか
seoTitle: "製造品出荷額ランキング｜なぜ東北が伸びたのか"
description: 同じ日本でも県によって製造業の厚みはまるで違います。上位と下位の差がどこから生まれるのかを出荷額の分布からたどります。
published: false
---

## 全体像

愛知県は58兆円で全国1位となっています。石川県は2.5兆円で31位、全国平均を下回ります。

![出荷額ランキング](data/sample-ranking.svg)

> [!NOTE]
> 事業所単位の集計です。本社一括計上により都市部が過大に出る点に注意してください。

くわしくは[ランキング](/ranking/manufacturing-shipment-amount)を参照してください。

## 地域差の背景

自動車産業の集積が愛知の厚みを生んでいます。

> [!WARNING]
> 2018年に産業分類が変更されており、それ以前の年との単純比較はできません。

## 読み方のコツ

人口あたりに直すと順位は入れ替わります。[都道府県一覧](/areas/23000)も合わせて見てください。

## まとめ

[カテゴリ一覧](/category/miningindustry)から関連指標をたどれます。

## データ出典

経済センサス活動調査
`;

/** 正常なドラフトを temp dir に作る。mutate で 1 箇所だけ壊す。 */
function makeFixture(mutate = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qg-"));
  const data = path.join(dir, "data");
  fs.mkdirSync(data);
  const f = {
    dir,
    article: GOOD_ARTICLE,
    files: {
      "sample-ranking.svg": GOOD_SVG,
      "sample-ranking.json": JSON.stringify([
        { areaName: "愛知", rank: 1, value: 58, unit: "兆円", label: "製造品出荷額" },
        { areaName: "石川", rank: 31, value: 2.5, unit: "兆円", label: "製造品出荷額" },
      ]),
      "sample-ranking.source.json": JSON.stringify({
        kind: "ranking",
        rankingKey: "manufacturing-shipment-amount",
        year: "2021",
      }),
    },
  };
  mutate(f);
  fs.writeFileSync(path.join(dir, "article.md"), f.article);
  for (const [name, body] of Object.entries(f.files)) fs.writeFileSync(path.join(data, name), body);
  return dir;
}

function runGate(dir) {
  try {
    return JSON.parse(execFileSync("node", [GATE, path.join(dir, "article.md")], { encoding: "utf8" }));
  } catch (e) {
    // blocker があると exit 1。stdout に JSON は出ているのでそれを読む。
    return JSON.parse(e.stdout);
  }
}

let pass = 0;
let fail = 0;
function test(name, fn) {
  const dirs = [];
  try {
    fn(dirs);
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  } finally {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
  }
}

/** 正常データとの差分で「その mutation が生んだ blocker」だけを取り出す */
function newBlockers(mutate, dirs) {
  const baseDir = makeFixture();
  const mutDir = makeFixture(mutate);
  dirs.push(baseDir, mutDir);
  const base = new Set(runGate(baseDir).blockers);
  return runGate(mutDir).blockers.filter((b) => !base.has(b));
}

// --- 正常データで発火しないこと (これが無いと下の検出は「常に発火する gate」でも通る) ---

test("正常なドラフトでは新 gate が 1 つも発火しない", (dirs) => {
  const dir = makeFixture();
  dirs.push(dir);
  const r = runGate(dir);
  const c = r.checks;
  for (const key of [
    "parenNumbers",
    "missingSvgFiles",
    "meaninglessSvgNames",
    "svgContentErrors",
    "svgLineageMissing",
    "svgSizeViolations",
    "svgPairViolations",
  ]) {
    assert.strictEqual(c[key], 0, `${key} が ${c[key]} (0 のはず): ${r.blockers.join(" / ")}`);
  }
});

// --- 違反を 1 つ注入すると発火すること ---

test("県名直後の括弧に値 → paren-number blocker", (dirs) => {
  const b = newBlockers((f) => {
    f.article = f.article.replace("愛知県は58兆円で全国1位となっています", "愛知県（58兆円）が全国1位となっています");
  }, dirs);
  assert.ok(b.some((x) => x.includes("paren-number")), `検出されず: ${b.join(" / ")}`);
});

test("参照 SVG が存在しない → 画像切れ blocker", (dirs) => {
  const b = newBlockers((f) => {
    delete f.files["sample-ranking.svg"];
  }, dirs);
  assert.ok(b.some((x) => x.includes("参照 SVG が存在しない")), `検出されず: ${b.join(" / ")}`);
});

test("SVG の width/height 欠落 → SVG 構造エラー blocker", (dirs) => {
  const b = newBlockers((f) => {
    f.files["sample-ranking.svg"] = GOOD_SVG.replace(' width="960" height="404"', "");
  }, dirs);
  assert.ok(b.some((x) => x.includes("SVG 構造エラー")), `検出されず: ${b.join(" / ")}`);
});

test("SVG の <text> に未解決値 (undefined) → SVG 構造エラー blocker", (dirs) => {
  const b = newBlockers((f) => {
    f.files["sample-ranking.svg"] = GOOD_SVG.replace("<text>愛知</text>", "<text>undefined</text>");
  }, dirs);
  assert.ok(
    b.some((x) => x.includes("未解決のテンプレート値")),
    `検出されず: ${b.join(" / ")}`,
  );
});

test("型を判別できない basename (chart-1) → 命名 blocker", (dirs) => {
  const b = newBlockers((f) => {
    f.article = f.article.replace("data/sample-ranking.svg", "data/chart-1.svg");
    for (const suffix of [".svg", ".json", ".source.json"]) {
      f.files[`chart-1${suffix}`] = f.files[`sample-ranking${suffix}`];
      delete f.files[`sample-ranking${suffix}`];
    }
  }, dirs);
  assert.ok(b.some((x) => x.includes("型を判別できない SVG 名")), `検出されず: ${b.join(" / ")}`);
});

// --- 誤検出しない境界 (gate が広すぎないこと) ---

test("クォート無しの seoTitle を「欠落」と誤報しない", (dirs) => {
  const dir = makeFixture((f) => {
    f.article = f.article.replace(
      'seoTitle: "製造品出荷額ランキング｜なぜ東北が伸びたのか"',
      "seoTitle: 製造品出荷額ランキング｜なぜ東北が伸びたのか",
    );
  });
  dirs.push(dir);
  const r = runGate(dir);
  assert.ok(!r.blockers.some((b) => b.includes("seoTitle")), `誤報: ${r.blockers.join(" / ")}`);
});

test("年次・単位・出典の括弧は paren gate を発火させない", (dirs) => {
  const b = newBlockers((f) => {
    f.article = f.article.replace(
      "## 全体像",
      "## 全体像\n\n愛知県の出荷額（2020年度）を人口10万人当たり（2人以上の世帯）で補正しています（出典: 経済センサス）。",
    );
  }, dirs);
  assert.ok(!b.some((x) => x.includes("paren-number")), `誤検出: ${b.join(" / ")}`);
});

console.log(`\n[quality-gate svg/paren gates test] pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
