import { execFileSync } from "node:child_process";

import { PROJECT_ROOT } from "./thresholds";

function readGitPaths(args: string[]): string[] {
  const out = execFileSync("git", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf-8",
  });
  return out.split("\0").map((line) => line.trim()).filter(Boolean);
}

/** base..HEAD、staged・未staged・untracked の和集合。ローカル作業中の差分を取りこぼさない。 */
export function changedFilesSince(base: string): string[] {
  let committed: string[] = [];
  try {
    committed = readGitPaths(["diff", "--name-only", "-z", `${base}...HEAD`]);
  } catch {
    try {
      // 3点diffが解決できない場合 (shallow clone等) は素の2点diffにfallback
      committed = readGitPaths(["diff", "--name-only", "-z", base, "HEAD"]);
    } catch {
      committed = [];
    }
  }

  let workingTree: string[] = [];
  let untracked: string[] = [];
  try {
    workingTree = readGitPaths(["diff", "--name-only", "-z", "HEAD"]);
  } catch {
    // Git外や初回commit前は、取得できた集合だけで判定する。
  }
  try {
    untracked = readGitPaths(["ls-files", "--others", "--exclude-standard", "-z"]);
  } catch {
    // 同上。
  }
  return [...new Set([...committed, ...workingTree, ...untracked])];
}

export function currentCommitSha(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}
