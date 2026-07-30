/**
 * 形状 allowlist の**縮小だけ**を自動反映する。
 *
 * ## なぜ縮小だけか
 *
 * allowlist に載っている key では形状ゲートが黙る。再取得で直った metric を載せたままに
 * すると、その key の**次の退行を見逃す**。だから直ったら外したい。
 *
 * 一方「増やす」方向を自動化すると、壊れたデータを CI が勝手に追認することになる。
 * 何が壊れているかの判断は人 (or agent) がやるべきで、機械にやらせてはいけない。
 * → **現行リストの部分集合になったときだけ**書き換える。新しい key が 1 件でもあれば no-op。
 *
 * ## 使い方
 *
 *   npx tsx packages/data-configs/scripts/shrink-shape-allowlist.ts           # dry-run
 *   npx tsx packages/data-configs/scripts/shrink-shape-allowlist.ts --apply   # 書き換え
 *
 * R2 の公開済みデータを読むので `R2_PUBLIC_FETCH_URL` (既定 https://storage.stats47.jp) が要る。
 * CI では data-refresh.yml の R2 push 後に走らせる (再生成の結果を即反映するため)。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { EXPECTED_SHAPE_ANOMALY } from "../src/expected-shape-anomaly.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const TARGET = resolve(REPO_ROOT, "packages/data-configs/src/expected-shape-anomaly.ts");
const SCANNER = resolve(__dirname, "scan-stats-shape.ts");

function entryId(e: { key: string; check: string }): string {
  return `${e.key}::${e.check}`;
}

/**
 * 既存ファイルの**配列の中身だけ**を差し替える。
 *
 * ★scanner の `--emit-allowlist` はエントリのリテラルしか出さない
 * (import / 型 / MAX_KNOWN_BROKEN / 先頭の設計コメントを含まない)。
 * これをそのまま上書きするとファイルが壊れてビルドが通らなくなるので、
 * 配列本体と MAX_KNOWN_BROKEN だけをピンポイントで書き換える。
 */
export function spliceEntries(current: string, emitted: string, count: number): string {
  const marker = "export const EXPECTED_SHAPE_ANOMALY: readonly ExpectedShapeAnomalyEntry[] = [";
  const start = current.indexOf(marker);
  if (start < 0) throw new Error(`配列宣言が見つかりません: ${marker}`);
  const bodyStart = start + marker.length;
  const end = current.indexOf("\n];", bodyStart);
  if (end < 0) throw new Error("配列の終端 (\\n];) が見つかりません");

  // 生成物の先頭コメント行 (生成日時) は配列の中に入れない
  const entries = emitted
    .split("\n")
    .filter((l) => !l.startsWith("//"))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");

  const spliced = `${current.slice(0, bodyStart)}\n${entries}${current.slice(end)}`;

  // ラチェット定数も一緒に下げる (エントリだけ減らすとテストが「上限より少ない」で通り、
  // 次に増えたときに気づけなくなる)
  return spliced.replace(
    /export const MAX_KNOWN_BROKEN = \d+;/,
    `export const MAX_KNOWN_BROKEN = ${count};`,
  );
}

function main(): void {
  const apply = process.argv.includes("--apply");

  // scanner に現状の R2 から allowlist を再生成させる (判定ロジックを二重に持たない)
  const emitted = execFileSync(
    "npx",
    ["tsx", SCANNER, "--emit-allowlist", "--ignore-allowlist"],
    { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );

  // 生成物から key::check を拾う (TS を評価せずテキストで照合する)
  const nextIds = new Set<string>();
  const re = /key:\s*"([^"]+)",\s*\n\s*check:\s*"([^"]+)"/g;
  for (let m = re.exec(emitted); m !== null; m = re.exec(emitted)) {
    nextIds.add(`${m[1]}::${m[2]}`);
  }

  if (nextIds.size === 0) {
    console.error("✗ scanner の出力からエントリを 1 件も読めませんでした (書式変更を疑う)。中止");
    process.exit(1);
  }

  const currentIds = new Set(EXPECTED_SHAPE_ANOMALY.map(entryId));
  const added = [...nextIds].filter((id) => !currentIds.has(id));
  const removed = [...currentIds].filter((id) => !nextIds.has(id));

  console.log(`現行 ${currentIds.size} 件 / 再スキャン ${nextIds.size} 件`);
  console.log(`  解消 (削除できる): ${removed.length} 件`);
  for (const id of removed.slice(0, 20)) console.log(`    - ${id}`);
  if (removed.length > 20) console.log(`    … 他 ${removed.length - 20} 件`);
  console.log(`  新規 (増える): ${added.length} 件`);
  for (const id of added.slice(0, 20)) console.log(`    + ${id}`);

  if (added.length > 0) {
    // ★これが安全弁。増える方向は絶対に自動反映しない。
    console.log(
      "\n✋ 新規エントリがあるため何もしません (縮小専用)。\n" +
        "   新しい破損は人が原因を見てから登録してください:\n" +
        "     npx tsx packages/data-configs/scripts/scan-stats-shape.ts --emit-allowlist",
    );
    return;
  }

  if (removed.length === 0) {
    console.log("\n変化なし。");
    return;
  }

  if (!apply) {
    console.log("\n(dry-run) --apply で書き換えます。");
    return;
  }

  const before = readFileSync(TARGET, "utf8");
  const next = spliceEntries(before, emitted, nextIds.size);
  if (before === next) {
    console.log("\n内容が同一のため書き換えなし。");
    return;
  }
  writeFileSync(TARGET, next);
  console.log(`\n✅ ${TARGET} を更新 (${currentIds.size} → ${nextIds.size} 件)`);
}

// 直接実行されたときだけ走らせる (テストが spliceEntries だけを import できるように。
// 素の main() 呼び出しだと import しただけで実 scanner が起動してしまう)
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
