import { execFileSync } from "node:child_process";

import { PROJECT_ROOT } from "./thresholds";

/** base..HEAD の変更ファイル一覧 (プロジェクトルート相対パス)。取得できなければ空配列。 */
export function changedFilesSince(base: string): string[] {
  try {
    const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    });
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    try {
      // 3点diffが解決できない場合 (shallow clone等) は素の2点diffにfallback
      const out = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
      });
      return out.split("\n").map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
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
