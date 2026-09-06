#!/usr/bin/env node
/**
 * commit 前の高速プリフライト — blocker を「一度に全部」出す。
 *
 * ★なぜ要るか (2026-08-20 の実測):
 *   pre-commit フックは直列 all-or-nothing で 2 分超かかる。blocker が 1 つ出ると
 *   全体が abort するので、「直す → 再実行 → 次の blocker が出る」を繰り返すことになる。
 *   実際に develop のマージで 3 サイクル・十数分を検査待ちに使った。3 つの blocker は
 *   最初から同時に存在していたので、並列に 1 回走らせれば 1 サイクルで済んだ。
 *
 * ★このスクリプトは pre-commit の代替ではない。
 *   pre-commit が持つ深い検査 (型チェック・docs governance・画像 pipeline 等) は
 *   ここには無い。ここにあるのは「速くて・決定的で・実際によく引っかかる」3 つだけ。
 *   通ったからといって commit が通る保証はしない (逆に、ここで落ちれば確実に落ちる)。
 *
 * ★失敗しても止まらない: 全ゲートを最後まで走らせて結果をまとめて出す。
 *   これが本スクリプトの存在理由なので、fail-fast へ変えてはならない。
 *
 * ★--pr モード (2026-09-06 追加。実測に基づく):
 *   PR CI の Static Gates は 61 個の検査を**直列**に回し、最初の失敗で残りを実行しない。
 *   2026-09-06 の develop→main で 6 個の生成物が同時に古くなっていたが、1 回の CI が
 *   1 個しか報告しないため往復が 8 回 (1 回あたり検査 6 分 + 事前 commit 5 分) 発生した。
 *   6 個は互いに独立で、まとめて分かれば 1 回で済んだ。
 *
 *   --pr は「指標や記事の母集団が変わると連鎖して古くなる生成物」の鮮度ゲートだけを
 *   並列で回し、落ちたもの全部を 1 回で出す。CI と同じコマンドを呼ぶので判定は一致する。
 *   ネットワーク (R2 公開 URL) を使うゲートを含むので commit ごとではなく push 前に使う。
 *
 * 使い方:
 *   node .claude/scripts/lib/preflight-commit.mjs          # staged ファイルを対象
 *   node .claude/scripts/lib/preflight-commit.mjs --all    # リポジトリ全体を lint
 *   node .claude/scripts/lib/preflight-commit.mjs --pr     # push 前: 生成物の鮮度ゲート
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

// ★2 つの root を混同しない (2026-08-20 に自テストが実バグとして検出した):
//   REPO_ROOT = チェッカー本体の在り処。**必ずこのファイルの位置から解決する**
//               (cwd 由来にすると実行ディレクトリ次第で壊れる)。
//   SCAN_ROOT = 検査対象。CLAUDE_PROJECT_DIR で差し替えられる (テスト・別チェックアウト用)。
// 両者を 1 変数にすると、CLAUDE_PROJECT_DIR を設定した瞬間に自分のチェッカーを見失い、
// 「チェッカーが落ちた」を「違反を検出した」と取り違える (実際にそう動いていた)。
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const SCAN_ROOT = process.env.CLAUDE_PROJECT_DIR || REPO_ROOT;
const WEB_DIR = path.join(SCAN_ROOT, "apps", "web");
const checker = (name) => path.join(REPO_ROOT, ".claude/scripts/lib", name);

const GREEN = "[0;32m";
const RED = "[0;31m";
const YELLOW = "[1;33m";
const DIM = "[2m";
const NC = "[0m";

/** 実行して {ok, output} を返す。throw しない (1 つの失敗で他を止めないため)。 */
async function tryRun(command, args, options = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: SCAN_ROOT,
      maxBuffer: 32 * 1024 * 1024,
      ...options,
    });
    return { ok: true, output: `${stdout}${stderr}` };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}` };
  }
}

/** staged な apps/web の TS/TSX を返す。--all なら null (= 全体 lint)。 */
async function stagedWebFiles() {
  const { ok, output } = await tryRun("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"]);
  if (!ok) return [];
  return output
    .split(/\r?\n/)
    .filter((line) => /^apps\/web\/src\/.*\.(ts|tsx)$/.test(line))
    .map((line) => line.replace(/^apps\/web\//, ""));
}

async function eslintGate(all) {
  if (all) {
    const result = await tryRun("npm", ["run", "lint"]);
    return { ...result, hint: "cd apps/web && npx eslint <file> --fix" };
  }
  const files = await stagedWebFiles();
  if (files.length === 0) {
    return { ok: true, output: "staged な apps/web/src の TS/TSX なし", skipped: true };
  }
  const result = await tryRun("npx", ["eslint", ...files], { cwd: WEB_DIR });
  return { ...result, hint: `cd apps/web && npx eslint ${files[0]} --fix` };
}

/**
 * push 前ゲート (--pr)。CI の Static Gates と同じコマンドを呼ぶ。
 *
 * 選定基準は「指標・記事の母集団が変わると連鎖して古くなる生成物」。
 * 2026-09-06 の 8 往復で実際に落ちたものを起点に、同じ連鎖に属するものを揃えた:
 *   指標を足す/止める → registry / known-ranking-keys / sitemap / polarity / survey taxonomy /
 *   theme catalog / area databook / topic catalog が順に古くなる。
 * 重い vitest・playwright・coverage は含めない (push 前に 1 分で終わることを優先する)。
 */
const PR_GATES = [
  {
    name: "Metric Registry",
    why: "metric を足す/消すと registry.ts が古くなる",
    run: () => tryRun("npm", ["run", "build:registry", "--workspace=@stats47/data-configs", "--", "--check"]),
    hint: "npm run build:registry --workspace=@stats47/data-configs",
  },
  {
    name: "Metric Config / Years",
    why: "category・unit・年の 4 桁正規化",
    run: async () => {
      const a = await tryRun("npm", ["run", "validate:config", "--workspace=@stats47/data-configs"]);
      if (!a.ok) return a;
      return tryRun("npm", ["run", "validate:years", "--workspace=@stats47/data-configs"]);
    },
    hint: "metric config を是正する (.claude/rules/metric-config-standards.md)",
  },
  {
    name: "Colorscheme Polarity",
    why: "新 metric に極性が無いと未割当ラチェットが増える",
    run: () => tryRun("npm", ["run", "validate:polarity", "--workspace=@stats47/data-configs"]),
    hint: "packages/data-configs/src/metric-polarity.ts に根拠つきで収載し MIN_POLARITY_COVERAGE を上げる",
  },
  {
    name: "Theme Catalog",
    why: "evidenceTopics / chart を足すと生成物が古くなる",
    run: async () => {
      const a = await tryRun("npm", ["run", "validate:catalog", "--workspace=@stats47/data-configs"]);
      if (!a.ok) return a;
      return tryRun("npm", ["run", "generate:catalog", "--workspace=@stats47/data-configs", "--", "--check"]);
    },
    hint: "npm run generate:catalog --workspace=@stats47/data-configs",
  },
  {
    name: "Theme Dependency Mirror",
    why: "ThemeCatalog の依存ミラー",
    run: () => tryRun("npx", ["tsx", "packages/data-configs/scripts/generate-theme-dependency-mirror.ts", "--check"]),
    hint: "同スクリプトを --check なしで実行",
  },
  {
    name: "Unit Semantics Mirror",
    why: "単位セマンティクスの正典と鏡のずれ",
    run: () => tryRun("npx", ["tsx", "packages/data-configs/scripts/generate-unit-semantics-mirror.ts", "--check"]),
    hint: "同スクリプトを --check なしで実行",
  },
  {
    name: "Area Databook",
    why: "テンプレ・editorial と生成物のずれ",
    run: async () => {
      const a = await tryRun("npm", ["run", "validate:area-databook", "--workspace=@stats47/data-configs"]);
      if (!a.ok) return a;
      return tryRun("npm", ["run", "generate:area-databook", "--workspace=@stats47/data-configs", "--", "--check"]);
    },
    hint: "npm run generate:area-databook --workspace=@stats47/data-configs",
  },
  {
    name: "Topic Catalog",
    why: "topic 定義の実在・重複",
    run: () => tryRun("npm", ["run", "validate:topics", "--workspace=@stats47/data-configs"]),
    hint: "topic catalog を是正する",
  },
  {
    name: "Survey Taxonomy",
    why: "active metric 数が変わると taxonomy state が drift する",
    run: () => tryRun("npx", ["tsx", "packages/ranking/src/scripts/audit-survey-taxonomy.ts", "--offline", "--check"]),
    hint: "npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --json .claude/state/surveys/taxonomy.json",
  },
  {
    name: "Sitemap / Tag Keys",
    why: "公開記事の増減で sitemap・tag・prominence が古くなる (R2 実測)",
    run: async () => {
      for (const script of [
        "generate-sitemap-blog-entries.ts",
        "generate-known-tag-keys.ts",
        "generate-unpublished-blog-slugs.ts",
        "generate-ranking-prominence.ts",
        "generate-runtime-metric-summaries.ts",
      ]) {
        const r = await tryRun("npx", ["tsx", `scripts/${script}`, "--check"], { cwd: WEB_DIR });
        if (!r.ok) return { ...r, hint: `cd apps/web && npx tsx scripts/${script}` };
      }
      return { ok: true, output: "sitemap / tag / prominence すべて最新" };
    },
  },
  {
    name: "main 先行チェック",
    why: "main が develop 非経由で進むと PR が競合する (branch-workflow.md の同期規約)",
    run: async () => {
      const fetched = await tryRun("git", ["fetch", "origin", "main", "develop", "--quiet"]);
      if (!fetched.ok) return { ok: true, output: "origin へ到達できないので判定を見送る", skipped: true };
      // commit 数ではなく**内容の差分**で判定する。
      // main には cron が state を書き戻すので、commit 数だけ見ると毎回赤くなり無視される。
      // 実際に PR を壊すのは code / rules / docs の乖離なので、.claude/state 配下は除く。
      const { ok, output } = await tryRun("git", [
        "diff",
        "--name-only",
        // merge-base→main の片側だけを見る。tip同士ではdevelopだけの変更も未同期と誤認する。
        "origin/develop...origin/main",
      ]);
      if (!ok) return { ok: true, output: "比較できないので見送る", skipped: true };
      const files = output.split(/\r?\n/).filter(Boolean);
      const substantive = files.filter((f) => !f.startsWith(".claude/state/"));
      if (substantive.length === 0) {
        const note = files.length === 0 ? "main 由来の未同期変更なし" : `main 側は cron の state 書き戻し ${files.length} 件のみ`;
        return { ok: true, output: note };
      }
      return {
        ok: false,
        output: [`main に develop 非経由の変更が ${substantive.length} 件ある:`, ...substantive.slice(0, 12)].join("\n"),
      };
    },
    hint: "git switch develop && git merge origin/main してから push する (merge の後に rebase しない)",
  },
];

const GATES = [
  {
    name: "ESLint",
    why: "import/order・no-duplicate-imports・set-state-in-effect 等",
    run: (all) => eslintGate(all),
  },
  {
    name: "Env Registry",
    why: "新規 process.env は .claude/config/env-registry.json への登録が必須",
    run: () => tryRun("node", [checker("check-env-registry.cjs")]),
    hint: "検出された変数名を .claude/config/env-registry.json の variables へ追加する",
  },
  {
    name: "Maintenance Debt",
    why: "無根拠 TODO / 削除条件のない legacy / 永続 D1 runtime の新規増加",
    run: () => tryRun("node", [checker("check-maintenance-debt.cjs"), "--baseline"]),
    hint: "実修正 (期限・削除条件を書く / backlog 化) か、誤検知ならチェッカー側のルール修正",
  },
];

async function main() {
  const all = process.argv.includes("--all");
  const pr = process.argv.includes("--pr");
  const gates = pr ? PR_GATES : GATES;
  const started = Date.now();

  const label = pr ? "push 前プリフライト (生成物の鮮度)" : "プリフライト";
  console.log(`${GREEN}🚀 ${label} — ${gates.length} ゲートを並列実行${NC}${all ? " (--all)" : ""}\n`);

  // ★並列。1 つ落ちても他を止めない (まとめて出すのが本スクリプトの目的)。
  const results = await Promise.all(
    gates.map(async (gate) => ({ gate, result: await gate.run(all) })),
  );

  const failed = [];
  for (const { gate, result } of results) {
    if (result.skipped) {
      console.log(`${DIM}⊘ ${gate.name} — ${result.output}${NC}`);
    } else if (result.ok) {
      console.log(`${GREEN}✅ ${gate.name}${NC}`);
    } else {
      console.log(`${RED}❌ ${gate.name}${NC} ${DIM}(${gate.why})${NC}`);
      failed.push({ gate, result });
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (failed.length === 0) {
    console.log(`\n${GREEN}✅ ${label}通過 (${elapsed}s)${NC}`);
    console.log(
      pr
        ? `${DIM}※ 重い検査 (型 / build / vitest / coverage / e2e) はここには無い。CI が権威。${NC}`
        : `${DIM}※ pre-commit の深い検査 (型 / docs / 画像 pipeline) はここには無い。${NC}`,
    );
    return;
  }

  console.log(`\n${RED}✗ ${failed.length} / ${gates.length} ゲートが失敗 (${elapsed}s)${NC}`);
  for (const { gate, result } of failed) {
    console.log(`\n${YELLOW}── ${gate.name} ──${NC}`);
    const lines = result.output.split(/\r?\n/).filter(Boolean);
    lines.slice(0, 25).forEach((line) => console.log(`  ${line}`));
    if (lines.length > 25) console.log(`  ${DIM}… 他 ${lines.length - 25} 行${NC}`);
    const hint = result.hint ?? gate.hint;
    if (hint) console.log(`  ${YELLOW}💡 ${hint}${NC}`);
  }
  console.log(`\n${YELLOW}上記を全部直してから commit すると、pre-commit の再実行サイクルを節約できる。${NC}`);
  process.exitCode = 1;
}

// ESM のエントリポイント判定は pathToFileURL 経由 (Windows で文字列連結は必ず不一致になる。
// 正典: .claude/rules/local-environment.md「file:// URL を文字列連結しない」)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
