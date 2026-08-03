#!/usr/bin/env node
/**
 * docs/21 (ephemeral outbox) の自動掃除。
 *
 * 「published:true かつ R2 (正典) の article.md と内容が一致」するドラフトを git rm する。
 * R2 が唯一の真実源 (SSOT = app/blog/<slug>) なので、公開済みと完全一致のドラフトを docs/21 に
 * 残す理由はない (削除は可逆: git 履歴 + R2 に実体)。published:false の作業中ドラフトは残す。
 *
 * ★安全装置 (内容一致を要求する理由): brushup (既 live 記事の改稿) は docs/21 に published:true の
 *   まま新版を置き R2 には旧版が live。「存在」だけで消すと改稿中の新版を誤削除する (2026-06-21 監査で
 *   検出した統合バグ)。publish は cp -R で verbatim コピーなので、完全一致 = 公開済みの取り残しと確定できる。
 *
 * なぜ必要か: blog-auto-publish.yml は公開後に docs/21 を git rm するが、その後の広い
 * `git add` (統合コミット等) が掃除済みドラフトを git に出戻りさせて outbox に残骸が溜まる
 * (2026-06-21 発生)。本スクリプトを日次 cron で回すことで、出戻りしても翌日には自動で
 * 消える = 残骸が原理的に溜まらない。
 *
 * 正典: .claude/rules/blog-data-schema.md §0 (docs/21 = ephemeral outbox / R2 = SSOT)
 * 関連: .claude/memory/feedback_shared_working_copy_git_race.md (出戻り落とし穴)
 *
 * 使い方:
 *   node .claude/scripts/blog/prune-published-outbox.mjs            # dry-run (削除せず計画だけ表示)
 *   node .claude/scripts/blog/prune-published-outbox.mjs --apply    # 実際に git rm + 空ディレクトリ削除
 *   node .claude/scripts/blog/prune-published-outbox.mjs --check    # 検出のみ・取り残しがあれば exit 1 (deploy/publish ガード)
 *   R2_PUBLIC_FETCH_URL=... で正典判定先を上書き可 (既定 https://storage.stats47.jp)
 *
 * 呼び出し元: blog-remediation-daily.yml (日次 --apply) / check-published-drafts.cjs (--check ラッパー: /deploy・/publish-article)
 */

import { readFileSync, readdirSync, existsSync, statSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

// prune (消す) と publish (出す) で同じ判定を使う。ズレると「消されないが出もしない」記事が生まれる
import {
  fetchR2Article as fetchR2ArticleShared,
  getPublished,
  normalizeBody,
} from "./lib/outbox-r2.mjs";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../..");
const OUTBOX_REL = "docs/21_ブログ記事原稿";
const OUTBOX = join(PROJECT_ROOT, OUTBOX_REL);
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const APPLY = process.argv.includes("--apply");
const CHECK = process.argv.includes("--check"); // 検出のみ・削除しない・取り残しがあれば exit 1 (deploy/publish ガード用)
const CONCURRENCY = 6;

const fetchR2Article = (slug) => fetchR2ArticleShared(slug, R2_BASE);

/** R2 に指定キーが存在するか (GET・200 のみ真) */
async function existsInR2(slug, file) {
  const url = `${R2_BASE}/app/blog/${encodeURIComponent(slug)}/${file}`;
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

/** slug ディレクトリ配下のファイルを相対パスで列挙する (再帰)。 */
function listLocalFiles(dirAbs, prefix = "") {
  const out = [];
  for (const e of readdirSync(dirAbs, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listLocalFiles(join(dirAbs, e.name), rel));
    else out.push(rel);
  }
  return out;
}

/**
 * ★安全装置 2 (2026-07-29 追加): **ローカルにあるファイルが全て R2 に載っているか**を確認する。
 *
 * なぜ要るか: これまで article.md の内容一致だけを見て `data/` ごと削除していた。
 * publish は `cp -R` + `diff-push-r2` なので通常は全部載るが、**push が部分的に失敗しても
 * article.md さえ一致すれば outbox を消してしまう**構造だった。元データ (data/*.json /
 * *.source.json) はローカルにしか無いので、そうなると再生成も出典追跡も永久に不能になる。
 * 2026-07 のタイルマップ再生成で 12 枚が復元不能だったのと同じ状態を、今後も静かに作りうる。
 *
 * 判定は「R2 に無いものが 1 つでもあれば消さない」。保持側の誤りは翌日また判定されるので無害、
 * 削除側の誤りは不可逆なので保守側に倒す。
 *
 * @returns {Promise<string[]>} R2 に欠けている相対パス。空配列なら削除して安全。
 */
async function findMissingInR2(slug, slugDirAbs) {
  const files = listLocalFiles(slugDirAbs).filter((f) => f !== "article.md");
  if (files.length === 0) return [];
  const present = await mapLimit(files, CONCURRENCY, (f) => existsInR2(slug, f));
  return files.filter((_, i) => !present[i]);
}

/** git rm -r (tracked のみ除去)。失敗は throw */
function gitRm(relDir) {
  execFileSync("git", ["rm", "-r", "-q", relDir], { cwd: PROJECT_ROOT, stdio: "pipe" });
}

/** dir に untracked ファイル (?? 行) が残っているか */
function hasUntracked(relDir) {
  const out = execFileSync("git", ["status", "--porcelain", "--", relDir], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  return out.split("\n").some((l) => l.startsWith("??"));
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  if (!existsSync(OUTBOX)) {
    console.log(`[prune-outbox] ${OUTBOX_REL} が無い → 何もしない`);
    return;
  }

  const entries = readdirSync(OUTBOX, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  // 各 slug を分類
  const candidates = []; // {slug, relDir, kind: "published-live" | "orphan-live"}
  const kept = []; // {slug, reason}

  const classified = await mapLimit(entries, CONCURRENCY, async (slug) => {
    const relDir = `${OUTBOX_REL}/${slug}`;
    const articlePath = join(OUTBOX, slug, "article.md");
    const hasArticle = existsSync(articlePath);

    if (hasArticle) {
      const pub = getPublished(articlePath);
      if (pub !== true) {
        return { slug, relDir, action: "keep", reason: `published:${pub} (作業中ドラフト) → 保持` };
      }
      // published:true → R2 (正典) と内容一致するときだけ削除する。
      // ★安全装置: brushup (既 live 記事の改稿) は docs/21 に published:true のまま新版を置き、
      //   R2 には旧版が live。内容が一致しない = 再公開待ちの改稿中なので消してはならない。
      const r2 = await fetchR2Article(slug);
      if (r2 == null) {
        return { slug, relDir, action: "keep", reason: "published:true だが R2 未掲載/取得失敗 (公開処理中の可能性) → 保持" };
      }
      const local = readFileSync(articlePath, "utf8");
      if (normalizeBody(local) !== normalizeBody(r2)) {
        return { slug, relDir, action: "keep", reason: "published:true だが R2 と内容差分 (改稿中/再公開待ち) → 保持" };
      }
      // ★安全装置 2: data/ 等が R2 に載っていることを確認してから消す (上記 findMissingInR2 参照)
      const missing = await findMissingInR2(slug, join(OUTBOX, slug));
      if (missing.length > 0) {
        return {
          slug,
          relDir,
          action: "keep",
          reason: `R2 に未反映のファイルが ${missing.length} 件 (${missing.slice(0, 3).join(", ")}${missing.length > 3 ? " 他" : ""}) → 保持 (消すと元データが失われる)`,
        };
      }
      return { slug, relDir, action: "rm", kind: "published-identical" };
    }

    // article.md なし = 孤児 (data/ 等の残骸)。R2 に公開済みで、かつローカルの中身が
    // 全て R2 に載っている場合のみ掃除する (本文比較対象が無いので存在で判定)。
    const r2 = await fetchR2Article(slug);
    if (r2 == null) {
      return { slug, relDir, action: "keep", reason: "article.md 無し・R2 未掲載 (新規作業中の可能性) → 保持" };
    }
    const missingOrphan = await findMissingInR2(slug, join(OUTBOX, slug));
    if (missingOrphan.length > 0) {
      return {
        slug,
        relDir,
        action: "keep",
        reason: `article.md 無しだが R2 に未反映のファイルが ${missingOrphan.length} 件 → 保持 (消すと元データが失われる)`,
      };
    }
    return { slug, relDir, action: "rm", kind: "orphan-live" };
  });

  for (const c of classified) {
    if (c.action === "rm") candidates.push(c);
    else kept.push(c);
  }

  console.log(`[prune-outbox] 走査 ${entries.length} slug / 削除対象 ${candidates.length} / 保持 ${kept.length}`);
  console.log(`[prune-outbox] 正典判定先: ${R2_BASE}/app/blog/<slug>/article.md`);

  if (candidates.length) {
    console.log(`\n削除対象 (公開済み=R2 にある):`);
    for (const c of candidates) console.log(`  - ${c.slug} (${c.kind})`);
  }
  if (kept.length) {
    console.log(`\n保持:`);
    for (const k of kept) console.log(`  - ${k.slug}: ${k.reason}`);
  }

  if (!candidates.length) {
    console.log(`\n[prune-outbox] 掃除対象なし (outbox はクリーン)`);
    return;
  }

  // --check: 検出のみ。取り残しがあれば exit 1 (deploy / publish 前ガード用)。
  if (CHECK) {
    console.error(
      `\n[prune-outbox] ❌ 公開済み (R2 と内容一致) なのに docs/21 に取り残しが ${candidates.length} 件あります。\n` +
        `  → node .claude/scripts/blog/prune-published-outbox.mjs --apply で掃除 (または日次 cron が翌朝処理)。`,
    );
    process.exit(1);
  }

  if (!APPLY) {
    console.log(`\n[prune-outbox] dry-run。実行するには --apply を付ける`);
    return;
  }

  let removed = 0;
  for (const c of candidates) {
    try {
      // tracked を git rm
      try {
        gitRm(c.relDir);
      } catch (e) {
        // tracked ファイルが無い (純孤児) 場合は git rm が失敗する → FS 削除にフォールバック
      }
      // git rm 後に残る空ディレクトリ / 純孤児を FS から除去 (untracked が残る場合は安全のため残す)
      const absDir = join(PROJECT_ROOT, c.relDir);
      if (existsSync(absDir)) {
        if (hasUntracked(c.relDir)) {
          console.log(`  ! ${c.slug}: untracked ファイルが残存 → FS 削除はスキップ (要手動確認)`);
        } else {
          rmSync(absDir, { recursive: true, force: true });
        }
      }
      removed++;
    } catch (e) {
      console.log(`  ! ${c.slug}: 削除失敗 ${e?.message || e}`);
    }
  }
  console.log(`\n[prune-outbox] git rm / FS 削除完了: ${removed}/${candidates.length} 件 (commit は呼び出し元が行う)`);
}

main().catch((e) => {
  console.error("[prune-outbox] error:", e);
  process.exit(1);
});
