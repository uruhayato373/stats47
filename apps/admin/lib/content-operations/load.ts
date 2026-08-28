import fs from "node:fs";
import path from "node:path";

import { NOTE_ARTICLES } from "../../../../.claude/scripts/note/catalog";
import { KDP_PORTFOLIO_POLICY } from "../../../../packages/product-factory/src/channels/kindle/kdp-publishing-policy";

import {
  ContentKdpListingsState,
  ContentKindleBuildState,
  ContentNoteDraftIndex,
  ContentSocialPostsState,
} from "../contracts/schemas";
import type { ContentOperationsResponse } from "../contracts/types";
import { buildContentOperations } from "./core";

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
  const noteDraftIndex = ContentNoteDraftIndex.parse(
    readJson(root, ".claude/state/note-draft-index.json"),
  );

  return buildContentOperations({
    generatedAt,
    socialPosts: social.posts,
    kindleListings: Object.values(kdp.listings).map((listing) => ({
      ...listing,
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
  });
}
