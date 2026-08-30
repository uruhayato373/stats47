import fs from "node:fs";
import path from "node:path";

import { NOTE_ARTICLES } from "../../../../.claude/scripts/note/catalog";
import { REFERENCE_SOURCE_POLICIES } from "../../../../packages/data-configs/src/evidence-inventory/reference-sources";
import { KINDLE_BOOKS } from "../../../../packages/product-factory/src/channels/kindle/book-catalog";
import { KDP_PORTFOLIO_POLICY } from "../../../../packages/product-factory/src/channels/kindle/kdp-publishing-policy";

import {
  ContentBlogIndex,
  ContentKdpListingsState,
  ContentKindleBuildState,
  ContentKindleArchiveState,
  ContentNoteDraftIndex,
  ContentPrefectures,
  ContentReferenceInventory,
  ContentSocialPostsState,
} from "../contracts/schemas";
import type { ContentOperationsResponse } from "../contracts/types";
import { buildContentOperations } from "./core";
import {
  buildReferenceContentPortfolio,
  type ReferenceBlogSource,
  type ReferenceMetricSource,
} from "./reference";

function readJson(root: string, rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function fileCount(root: string, rel: string): number {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md")).length;
}

function readOptionalJson(root: string, rel: string): unknown | null {
  const abs = path.join(root, rel);
  return fs.existsSync(abs) ? JSON.parse(fs.readFileSync(abs, "utf8")) : null;
}

function loadMetrics(root: string, metricKeys: string[]): ReferenceMetricSource[] {
  const relDir = "packages/data-configs/src/metrics";
  const absDir = path.join(root, relDir);
  if (!fs.existsSync(absDir)) return [];
  const metrics: ReferenceMetricSource[] = [];
  for (const key of metricKeys) {
    const name = `${key}.ts`;
    if (!fs.existsSync(path.join(absDir, name))) continue;
    const sourcePath = `${relDir}/${name}`;
    const body = fs.readFileSync(path.join(absDir, name), "utf8");
    const configuredKey = body.match(/"key":\s*"([^"]+)"/)?.[1];
    if (!configuredKey) continue;
    metrics.push({
      key: configuredKey,
      title: body.match(/"title":\s*"([^"]+)"/)?.[1] ?? configuredKey,
      active: /"isActive":\s*true/.test(body),
      sourcePath,
    });
  }
  return metrics;
}

function loadBlogs(root: string): ReferenceBlogSource[] {
  const raw = readOptionalJson(root, ".local/r2/app/blog/all.json");
  if (!raw) return [];
  const index = ContentBlogIndex.parse(raw);
  const published = index.articles.map((article) => {
    const articlePath = path.join(root, ".local/r2/app", article.filePath);
    const body = fs.existsSync(articlePath) ? fs.readFileSync(articlePath, "utf8") : "";
    const rankingKeys = [
      ...body.matchAll(/\/ranking\/([a-z0-9-]+)/g),
    ].map((match) => match[1]);
    return {
      slug: article.slug,
      title: article.title,
      published: article.published,
      rankingKeys: [...new Set(rankingKeys)],
    };
  });
  const outbox = path.join(root, "docs/21_ブログ記事原稿");
  const drafts: ReferenceBlogSource[] = [];
  if (fs.existsSync(outbox)) {
    for (const entry of fs.readdirSync(outbox, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const articlePath = path.join(outbox, entry.name, "article.md");
      if (!fs.existsSync(articlePath)) continue;
      const body = fs.readFileSync(articlePath, "utf8");
      const rankingKeys = [...body.matchAll(/\/ranking\/([a-z0-9-]+)/g)].map(
        (match) => match[1],
      );
      drafts.push({
        slug: body.match(/^slug:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1] ?? entry.name,
        title: body.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? entry.name,
        published: false,
        rankingKeys: [...new Set(rankingKeys)],
      });
    }
  }
  return [...published, ...drafts];
}

function loadNoteOutbox(root: string) {
  const outbox = path.join(root, "docs/31_note記事原稿");
  if (!fs.existsSync(outbox)) return [];
  return fs
    .readdirSync(outbox, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("a-"))
    .flatMap((entry) => {
      const draftPath = path.join(outbox, entry.name, "draft.md");
      if (!fs.existsSync(draftPath)) return [];
      const rankingKey = entry.name.slice(2);
      return [
        {
          key: entry.name,
          status: "draft",
          stats47Targets: [`/ranking/${rankingKey}`],
        },
      ];
    });
}

function loadNoteGenerationBlockers(root: string) {
  const rel = ".claude/state/content-operations/note-generation-blockers.json";
  const raw = readOptionalJson(root, rel) as
    | { blockers?: Record<string, { code?: string; message?: string; source?: string }> }
    | null;
  return Object.entries(raw?.blockers ?? {}).map(([rankingKey, blocker]) => ({
    rankingKey,
    code: blocker.code ?? "UNKNOWN",
    message: blocker.message ?? "note生成ゲートで停止",
    sourcePath: rel,
  }));
}

/**
 * 各チャネルの既存SSOTを、管理画面専用の読み取りモデルへ正規化する。
 * ここには書き込みを置かない。公開状態の更新は各channel owner/skillだけが行う。
 */
export function loadContentOperations(
  root: string,
  generatedAt = new Date().toISOString(),
): ContentOperationsResponse {
  const social = ContentSocialPostsState.parse(
    readJson(root, ".claude/state/sns/posts.json"),
  );
  const kdp = ContentKdpListingsState.parse(
    readJson(root, ".claude/config/kdp-listings.json"),
  );
  const kindleBuild = ContentKindleBuildState.parse(
    readJson(root, ".claude/state/products/kindle-status.json"),
  );
  const kindleArchivesRaw = readOptionalJson(root, ".claude/state/products/kindle-archives.json");
  const kindleArchives = kindleArchivesRaw ? ContentKindleArchiveState.parse(kindleArchivesRaw) : null;
  const noteDraftIndex = ContentNoteDraftIndex.parse(
    readJson(root, ".claude/state/note-draft-index.json"),
  );
  const inventories = REFERENCE_SOURCE_POLICIES.flatMap((policy) => {
    const raw = readOptionalJson(root, policy.statePath);
    if (!raw) return [];
    const inventory = ContentReferenceInventory.parse(raw);
    return [{ ...inventory, sourcePath: policy.statePath }];
  });
  const referenceMetricKeys = [
    ...new Set(
      inventories.flatMap((inventory) =>
        inventory.items.flatMap((item) => item.mapping?.metricKeys ?? []),
      ),
    ),
  ];
  const prefecturesRaw = readOptionalJson(root, "packages/area/src/data/prefectures.json");
  const prefectures = prefecturesRaw ? ContentPrefectures.parse(prefecturesRaw) : [];
  const blogs = loadBlogs(root);
  const references = buildReferenceContentPortfolio({
    expectedSourceKeys: REFERENCE_SOURCE_POLICIES.map((policy) => policy.sourceKey),
    inventories,
    metrics: loadMetrics(root, referenceMetricKeys),
    blogs,
    notes: [
      ...NOTE_ARTICLES.map((article) => ({
        key: article.key,
        status: article.status,
        stats47Targets: article.stats47Targets,
      })),
      ...loadNoteOutbox(root),
    ],
    noteBlockers: loadNoteGenerationBlockers(root),
    kindleBooks: KINDLE_BOOKS.map((book) => ({
      id: book.id,
      status: book.status,
      rankingKeys: book.chapters.flatMap((chapter) => chapter.rankingKeys ?? []),
      blogSlugs: book.chapters.flatMap((chapter) =>
        chapter.blogSlug ? [chapter.blogSlug] : [],
      ),
    })),
    areas: prefectures.map((prefecture) => {
      const editorialPath = `packages/data-configs/src/area-databook/editorial/${prefecture.prefCode}.ts`;
      return {
        code: prefecture.prefCode,
        name: prefecture.prefName,
        editorialPath: fs.existsSync(path.join(root, editorialPath)) ? editorialPath : null,
      };
    }),
  });

  return buildContentOperations({
    generatedAt,
    socialPosts: social.posts,
    kindleListings: Object.values(kdp.listings).map((listing) => ({
      ...listing,
      ...(() => {
        const archive = kindleArchives?.books[listing.id];
        const revision = archive?.revisions.find((item) => item.revision === archive.latestRevision);
        const markerRaw = readOptionalJson(
          root,
          `.local/kindle-books/${listing.id}/${archive?.version ?? "v1"}/.kindle-archive.json`,
        ) as { revision?: string } | null;
        return {
          archiveVersion: archive?.version ?? null,
          archiveRevision: archive?.latestRevision ?? null,
          archiveArchivedAt: revision?.archivedAt ?? null,
          archiveVerifiedAt: revision?.verifiedAt ?? null,
          localArchiveRevision: markerRaw?.revision ?? null,
        };
      })(),
      hasEpub: fs.existsSync(path.join(root, listing.epubPath)),
      hasCover: fs.existsSync(path.join(root, listing.coverPath)),
      manuscriptCount: fileCount(
        root,
        `packages/product-factory/src/channels/kindle/manuscripts/${listing.id}`,
      ),
    })),
    kindleBuildBooks: kindleBuild.books,
    noteArticles: NOTE_ARTICLES,
    noteDraftStatuses: Object.fromEntries(
      Object.entries(noteDraftIndex.drafts).map(([key, value]) => [key, value.status]),
    ),
    backlogText: fs.existsSync(path.join(root, ".claude/todo/backlog.md"))
      ? fs.readFileSync(path.join(root, ".claude/todo/backlog.md"), "utf8")
      : "",
    kdpPolicy: KDP_PORTFOLIO_POLICY,
    references,
  });
}
