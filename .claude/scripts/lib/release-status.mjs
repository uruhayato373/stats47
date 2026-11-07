#!/usr/bin/env node
/**
 * 今 main へ出すべきかを 1 画面で示す (npm run release:status)。読み取りのみ。
 * develop と main の差分・今日のデプロイの回数・開いている PR から案を出す。出すかどうかはオーナーが決める。
 * 正典: .claude/rules/branch-workflow.md「main へのマージは本番反映の判断」
 */
import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { changedPaths, SITE_INDEPENDENT } from "./plan-deploy-scope.mjs";

/** @returns {{ action: "wait" | "ask-owner" | "none", reason: string }} */
export function recommendRelease({ sitePaths, otherPaths, deploysToday, openPr }) {
  if (openPr) return { action: "wait", reason: `PR #${openPr} が開いている。merge か close まで develop へ push しない` };
  if (sitePaths === 0 && otherPaths === 0) return { action: "none", reason: "main との差分が無い" };
  if (sitePaths === 0) return { action: "none", reason: "本番に効く変更が無い。運用の変更だけなので急がない (デプロイは走らない)" };
  if (deploysToday > 0) return { action: "wait", reason: `今日は既に ${deploysToday} 回デプロイした。障害の修正でなければ明日にまとめる` };
  return { action: "ask-owner", reason: `本番に効く変更が ${sitePaths} 件ある。オーナーに出すかを確認する` };
}

function main() {
  const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const gh = (args) => execFileSync("gh", args, { encoding: "utf8" }).trim();
  git(["fetch", "-q", "origin", "main", "develop"]);
  const paths = changedPaths("origin/main", "origin/develop") ?? [];
  const site = paths.filter((path) => !SITE_INDEPENDENT.some((pattern) => pattern.test(path)));
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const created = gh(["run", "list", "--workflow", "deploy-workers.yml", "--limit", "20", "--json", "createdAt", "--jq", ".[].createdAt"]).split("\n").filter(Boolean);
  const deploysToday = created.filter((at) => new Date(at).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }) === today).length;
  const openPr = gh(["pr", "list", "--base", "main", "--state", "open", "--json", "number", "--jq", ".[0].number"]) || null;
  const { action, reason } = recommendRelease({ sitePaths: site.length, otherPaths: paths.length - site.length, deploysToday, openPr });
  console.log(`main との差分: ${paths.length} 件 (本番に効く ${site.length} 件)`);
  for (const path of site.slice(0, 10)) console.log(`  ${path}`);
  console.log(`今日のデプロイの実行: ${deploysToday} 回 (skip された回を含む) / 開いている PR: ${openPr ? `#${openPr}` : "なし"}`);
  console.log(`案: ${action} — ${reason}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
