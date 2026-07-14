/**
 * アフィリエイト直接配置 (direct-attribute) の決定的 compliance 監査 CLI。
 *
 * SSOT = apps/web/scripts/affiliate-direct-placements-data.ts を読み、
 *   - 構造検証 (ID 重複 / URL scheme / サイズ / 配置形式) — ネットワーク不要
 *   - --live: 配置先記事 (R2 公開 URL) と突合 — 孤立配置 / 本文タグ不一致 / PR 表記漏れ
 *   - --scan-all-blog: 公開全記事を走査し台帳未登録の <affiliate-banner> を検出
 * を行う。判定ロジックは lib/affiliate-compliance-core.mjs (純粋関数・node --test 対象)。
 *
 * 実行:
 *   npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts            # 構造のみ
 *   npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --check    # 構造 NG で exit 1 (pre-commit)
 *   npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --live --scan-all-blog --check  # 週次 CI
 *
 * state 出力 (--live 時のみ): .claude/state/ads/compliance-latest.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AFFILIATE_DIRECT_PLACEMENTS } from "../../../apps/web/scripts/affiliate-direct-placements-data";
import {
  auditPlacementsAgainstContent,
  findUnregisteredAffiliateTags,
  lintDirectPlacementSizes,
  validateDirectPlacementsStructure,
} from "./lib/affiliate-compliance-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

interface FetchedContent {
  found: boolean;
  body?: string;
}

/** R2 公開 URL から本文を取得する。404 = not found、その他のエラーは隠さず throw。 */
async function fetchContent(url: string): Promise<FetchedContent> {
  const res = await fetch(url);
  if (res.status === 404) return { found: false };
  if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
  return { found: true, body: await res.text() };
}

function noteR2Path(slug: string): string | null {
  try {
    const index = JSON.parse(
      readFileSync(resolve(PROJECT_ROOT, ".claude/state/note-draft-index.json"), "utf8"),
    );
    return index?.drafts?.[slug]?.r2_path ?? null;
  } catch {
    return null;
  }
}

function contentUrl(channel: string, slug: string): string | null {
  if (channel === "blog") return `${R2_BASE}/app/blog/${slug}/article.md`;
  if (channel === "note") {
    const r2Path = noteR2Path(slug);
    return r2Path ? `${R2_BASE}/${r2Path}/draft.md` : null;
  }
  return null;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const scanAllBlog = args.includes("--scan-all-blog");
  const jsonOnly = args.includes("--json");
  const check = args.includes("--check");

  const activePlacements = AFFILIATE_DIRECT_PLACEMENTS.filter((p) => p.isActive);
  const structureIssues = validateDirectPlacementsStructure(AFFILIATE_DIRECT_PLACEMENTS);
  const structureErrors = structureIssues.filter((i) => i.severity === "error");
  const sizeWarnings = lintDirectPlacementSizes(activePlacements);

  // 台帳に登録済みの href (channel:slug 単位) — 逆方向監査 (記事 → 台帳) の照合集合
  const registeredHrefsBySlug = new Map<string, Set<string>>();
  for (const p of activePlacements) {
    for (const t of p.placements) {
      const key = `${t.channel}:${t.slug}`;
      const set = registeredHrefsBySlug.get(key) ?? new Set<string>();
      set.add(p.href);
      registeredHrefsBySlug.set(key, set);
    }
  }

  let contentAudit: ReturnType<typeof auditPlacementsAgainstContent> = {
    total: activePlacements.length,
    orphaned: [],
    missingDisclosure: [],
  };
  const unregisteredTags: Array<{ target: string; href: string }> = [];

  if (live) {
    // 台帳 → 記事方向: 配置先本文を取得して突合
    const targets = [...registeredHrefsBySlug.keys()];
    const contents = new Map<string, FetchedContent>();
    await mapPool(targets, 8, async (key) => {
      const [channel, slug] = key.split(/:(.*)/s);
      const url = contentUrl(channel, slug);
      contents.set(key, url ? await fetchContent(url) : { found: false });
    });
    contentAudit = auditPlacementsAgainstContent(activePlacements, contents);

    // 記事 → 台帳方向 (blog のみ。note は生 HTML でタグが無い)
    for (const [key, content] of contents) {
      if (!key.startsWith("blog:") || !content.found) continue;
      for (const href of findUnregisteredAffiliateTags(
        content.body ?? "",
        registeredHrefsBySlug.get(key) ?? new Set(),
      )) {
        unregisteredTags.push({ target: key, href });
      }
    }

    if (scanAllBlog) {
      const all = (await (await fetch(`${R2_BASE}/app/blog/all.json`)).json()) as {
        articles: Array<{ slug: string; published?: boolean }>;
      };
      const scanned = new Set([...registeredHrefsBySlug.keys()]);
      const slugs = all.articles
        .filter((a) => a.published && !scanned.has(`blog:${a.slug}`))
        .map((a) => a.slug);
      await mapPool(slugs, 8, async (slug) => {
        const content = await fetchContent(`${R2_BASE}/app/blog/${slug}/article.md`);
        if (!content.found) return;
        for (const href of findUnregisteredAffiliateTags(content.body ?? "", new Set())) {
          unregisteredTags.push({ target: `blog:${slug}`, href });
        }
      });
    }
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    live,
    scanAllBlog,
    structureIssues,
    sizeWarnings,
    directPlacements: {
      total: contentAudit.total,
      orphaned: contentAudit.orphaned,
      missingDisclosure: contentAudit.missingDisclosure,
    },
    unregisteredTags,
  };

  // state 書き出しは --live のみ (構造のみの実行で live 監査結果を上書きしない)
  if (live) {
    const stateDir = resolve(PROJECT_ROOT, ".claude/state/ads");
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(resolve(stateDir, "compliance-latest.json"), JSON.stringify(snapshot, null, 2));
  }

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
  } else {
    const lines: string[] = [];
    lines.push(`# 直接配置 compliance 監査 (${snapshot.generatedAt.slice(0, 10)})`);
    lines.push("");
    lines.push(
      `台帳 active **${contentAudit.total}** 件 / 構造 error **${structureErrors.length}** / ` +
        (live
          ? `孤立 **${contentAudit.orphaned.length}** / PR 表記漏れ **${contentAudit.missingDisclosure.length}** / 未登録タグ **${unregisteredTags.length}**`
          : "本文突合は未実行 (--live で実行)"),
    );
    lines.push("");
    if (structureIssues.length) {
      lines.push("| id | code | severity | message |");
      lines.push("|---|---|---|---|");
      for (const i of structureIssues) lines.push(`| ${i.id} | ${i.code} | ${i.severity} | ${i.message} |`);
      lines.push("");
    }
    for (const o of contentAudit.orphaned) lines.push(`- ❌ 孤立: ${o.id} @ ${o.target} (${o.reason})`);
    for (const m of contentAudit.missingDisclosure) {
      lines.push(`- ❌ PR 表記漏れ: ${m.id} @ ${m.target} (${m.missing.join(", ")})`);
    }
    for (const u of unregisteredTags) lines.push(`- ❌ 台帳未登録タグ: ${u.target} → ${u.href}`);
    for (const w of sizeWarnings) lines.push(`- ⚠ 非 canonical サイズ (直接配置は warn): ${w.id} ${w.size}`);
    process.stdout.write(lines.join("\n") + "\n");
  }

  if (live) {
    process.stderr.write(`\n[compliance] snapshot → .claude/state/ads/compliance-latest.json\n`);
  }

  const hasBlockers =
    structureErrors.length > 0 ||
    contentAudit.orphaned.length > 0 ||
    contentAudit.missingDisclosure.length > 0 ||
    unregisteredTags.length > 0;
  if (check && hasBlockers) process.exitCode = 1;
}

main().catch((e) => {
  process.stderr.write(`[error] ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
