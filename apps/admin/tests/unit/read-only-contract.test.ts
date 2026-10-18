import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const adminRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

/**
 * 子プロセスの例外 (理由付き)。例外のファイルも書き込みはしない (下のテストで固定)。
 * auth-credentials.ts: /ops/auth で資格情報の登録状況をページを開くたびに読む (2026-10-01 オーナー判断)。
 *   呼ぶのは gh secret list と credential-store の storedAccounts (cmdkey /list・security -w なし) だけ。
 */
const CHILD_PROCESS_EXCEPTIONS: Record<string, RegExp> = {
  "lib/server/auth-credentials.ts": /execFileSync\("gh", \["secret", "list"/,
};

describe("admin read-only contract", () => {
  it("API routeは下書き本文とカバー制作確認のPATCH以外はGETだけを公開する", () => {
    const violations = filesUnder(path.join(adminRoot, "app/api"))
      .filter((file) => file.endsWith("route.ts"))
      .flatMap((file) => {
        const source = fs.readFileSync(file, "utf8");
        const rel = path.relative(adminRoot, file).replaceAll("\\", "/");
        if (["app/api/posts/[id]/caption/route.ts", "app/api/note-covers/[key]/production/route.ts","app/api/content-quality/route.ts","app/api/media-library/[id]/route.ts","app/api/media-templates/[id]/route.ts"].includes(rel)) {
          expect(source).toMatch(/export async function PATCH/);
          expect(source).not.toMatch(/export\s+(?:async\s+)?function\s+(POST|PUT|DELETE)/);
          return [];
        }
        if(rel==="app/api/media-library/[id]/candidate/route.ts"){
          expect(source).toMatch(/export async function POST/);
          expect(source).not.toMatch(/export\s+(?:async\s+)?function\s+(PATCH|PUT|DELETE)/);
          return [];
        }
        return /export\s+(?:async\s+)?function\s+(POST|PATCH|PUT|DELETE)|export\s+const\s+(POST|PATCH|PUT|DELETE)/.test(
          source,
        )
          ? [path.relative(adminRoot, file)]
          : [];
      });
    expect(violations).toEqual([]);
  });

  it("カバー制作の書込は専用adapterだけで行い、公開処理を呼ばない", () => {
    const source = fs.readFileSync(path.join(adminRoot, 'lib/server/note-cover-production.ts'), 'utf8');
    expect(source.match(/await updateCoverLedger\(/g)).toHaveLength(1);
    expect(source).toContain('coverProductionToken(row, article, policies) !== edit.revision');
    expect(source).not.toMatch(/update-note-covers|uploadInBrowser|child_process/);
  });

  it("clientに書き込みhelperと実行endpointを持たない", () => {
    const clientFiles = filesUnder(path.join(adminRoot, "components")).filter((file) =>
      file.endsWith(".tsx"),
    );
    const violations = clientFiles.flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      return /apiSend|\/api\/actions\/|\/api\/buzz-map\/actions\//.test(source)
        ? [path.relative(adminRoot, file)]
        : [];
    });
    expect(violations).toEqual([]);
  });

  it("server層に子プロセス起動・ファイル書き込みadapterを持たない", () => {
    const serverFiles = filesUnder(path.join(adminRoot, "lib/server")).filter((file) =>
      file.endsWith(".ts"),
    );
    const forbidden =
      /node:child_process|from\s+["']child_process["']|\bspawn\s*\(|\bexecFile\s*\(|\bwriteFile(?:Sync)?\s*\(|\bappendFile(?:Sync)?\s*\(|\bupdateById\s*\(|\binsert\s*\(/;
    const violations = serverFiles
      .filter((file) => !Object.hasOwn(CHILD_PROCESS_EXCEPTIONS, path.relative(adminRoot, file).replaceAll("\\", "/")))
      .flatMap((file) => {
        let source = fs.readFileSync(file, "utf8");
        if (path.relative(adminRoot, file).replaceAll("\\", "/") === "lib/server/posts-store.ts") {
          // 2026-10-11 ユーザー指定: draft captionだけ既存store経由で保存する。
          expect(source.match(/store\(\)\.updateById\(/g)).toHaveLength(1);
          expect(source).toContain('post.status !== "draft"');
          expect(source).toContain('postRevision(post) !== revision');
          source = source.replace(/\bupdateById\s*\(/g, "allowedDraftWrite(");
        }
        return forbidden.test(source) ? [path.relative(adminRoot, file)] : [];
      });
    expect(violations).toEqual([]);
  });

  it("子プロセスの例外はパスワードを読まない読み取りコマンドだけで、書き込みをしない", () => {
    for (const [rel, allowed] of Object.entries(CHILD_PROCESS_EXCEPTIONS)) {
      const source = fs.readFileSync(path.join(adminRoot, rel), "utf8");
      expect(source, rel).toMatch(allowed);
      expect(source.match(/\b(?:execFileSync|execFile|execSync|exec|spawn|spawnSync)\(/g)?.length, rel).toBe(1);
      // パスワードを読む経路 (資格情報ストアの直接読み) と書き込みを持たない
      expect(source, rel).not.toMatch(/writeFile|appendFile|CredRead|find-generic-password|readCredential|readSecret/);
    }
  });
});
