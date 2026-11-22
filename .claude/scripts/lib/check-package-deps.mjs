#!/usr/bin/env node
/**
 * packages/* が import する依存を package.json に宣言しているか (未宣言・未使用) を knip で検査する。
 *
 * 2026-11-21: packages の import を走査すると、宣言の無い依存が 194 件あり (巻き上げで偶然解決していた)、
 * 宣言だけ残って使われていない依存もあった (visualization の leaflet 一式など)。gis は lock にも無い `tokml`
 * を require していた。宣言を実体に合わせた後の再発防止として置く。
 *
 * 判定は knip に任せ、ここは呼ぶだけ。入口の設定は `knip.config.ts` の `packages/*`。
 * `--workspace 'packages/*'` はディレクトリの glob として何にも当たらず 0 件に見えるので、パッケージ名で絞る。
 *
 * 入口: `npm run knip:deps`
 * 登録: .claude/config/quality-gates.json (id: package-deps) → preflight:pr と pr-quality-check.yml
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const args = ["knip", "--include", "dependencies,unlisted", "--workspace", "@stats47/*", "--no-progress", "--no-config-hints"];
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npx, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
if (result.error) {
  console.error(`check-package-deps: knip を起動できない: ${result.error.message}`);
  process.exit(2);
}
if (result.status !== 0) {
  console.error("\npackages の依存宣言が import と食い違っています。使う側の package.json に宣言するか、使わない宣言を消してください。");
}
process.exit(result.status ?? 1);
