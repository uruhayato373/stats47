import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

/** 配布された共有 SSOT 1 本（`.claude/shared-policy/<name>`）。 */
export interface SharedPolicyDocument {
  /** 配布ファイル名（POLICY.md 等） */
  name: string;
  /** URL セグメント（拡張子なし） */
  slug: string;
  /** 索引カードの見出しと 1 行説明。正本の frontmatter → manifest 経由（配布時に必須検査済み）。ここに写しを持たない */
  title: string;
  summary: string;
  version: string;
  updated: string;
  /** Obsidian vault 内の正本パス（memos/…SSOT.md） */
  sourcePath: string;
  body: string;
}

interface ManifestDoc {
  sourcePath: string;
  version: string;
  updated: string;
  title?: string;
  summary?: string;
}

interface Manifest {
  schemaVersion?: number;
  version?: string;
  updated?: string;
  sourcePath?: string;
  docs?: Record<string, ManifestDoc>;
}

function dir() {
  return path.join(projectRoot(), ".claude/shared-policy");
}

function manifest(): Manifest | null {
  const p = path.join(dir(), "manifest.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as Manifest;
  } catch {
    return null;
  }
}

/**
 * 配布された共有 SSOT の一覧（本文なし）。manifest の `docs`（schema 2）を正とし、
 * 旧 schema 1（POLICY.md のみ）ならトップレベルの値から 1 件だけ組む。manifest が無ければ空（＝未配布）。
 * 文書を増やすときはここを触らない——正本側（obsidian の sync.mjs `docs`）に 1 行足して配布すれば索引に出る。
 */
export function sharedPolicyDocuments(): Omit<SharedPolicyDocument, "body">[] {
  const m = manifest();
  if (!m) return [];
  const entries: [string, ManifestDoc][] = m.docs
    ? Object.entries(m.docs)
    : m.version && m.sourcePath
      ? [["POLICY.md", { sourcePath: m.sourcePath, version: m.version, updated: m.updated ?? "" }]]
      : [];
  return entries
    .filter(([name]) => fs.existsSync(path.join(dir(), name)))
    .map(([name, d]) => {
      const slug = name.replace(/\.md$/, "");
      return {
        name,
        slug,
        title: d.title ?? slug,
        summary: d.summary ?? "",
        version: d.version,
        updated: d.updated,
        sourcePath: d.sourcePath,
      };
    });
}

/**
 * 共有 SSOT 1 本を本文つきで読む（読み取り専用）。引数なしは従来どおり POLICY.md。
 * slug は拡張子なし（POLICY / REPURPOSE / STRUCTURE）。manifest に無い名前は null。
 */
export function sharedPolicyDocument(slug = "POLICY"): SharedPolicyDocument | null {
  const meta = sharedPolicyDocuments().find((d) => d.slug === slug);
  if (!meta) return null;
  const raw = fs.readFileSync(path.join(dir(), meta.name), "utf8");
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  return { ...meta, body };
}
