import "server-only";

import fs from "node:fs";
import path from "node:path";

import domainsConfig from "../../../../config/domains.json";

import { projectRoot } from "./project-root";
import { resolveSafe } from "./safe-local-file";
import { cached, frontmatterValue } from "./state-io";
import { strategyLaneBoard, type LaneCard } from "./strategy-lanes";

/**
 * 領域 (config/domains.json) ごとの概要と、docs/ の文書の一覧・本文 (doboku-note admin-app の /domains・/docs と同じ役割)。
 * 文書の領域は check-domains.cjs の documentDomain (documents の最長一致) をそのまま使い、判定を二重に持たない。
 */

type CheckDomainsLib = {
  documentDomain: (documents: Record<string, string>, file: string) => string | null;
  frontmatterDomain: (text: string) => string | string[] | null;
};

// .cjs は webpack の静的解析を避けて実行時に読む (posts-store.ts と同じ理由・同じ方法)。
let cachedLib: CheckDomainsLib | null = null;
function lib(): CheckDomainsLib {
  if (cachedLib) return cachedLib;
  const abs = path.join(projectRoot(), ".claude/scripts/lib/check-domains.cjs");
  const nativeRequire = eval("require") as NodeRequire;
  cachedLib = nativeRequire(abs) as CheckDomainsLib;
  return cachedLib;
}

export interface DomainNavLink {
  label: string;
  href: string | null;
  kind: string;
}

export interface DomainInfo {
  id: string;
  label: string;
  role: string;
  manages: string;
  nav: DomainNavLink[];
}

export interface DomainDoc {
  /** リポジトリ相対パス (docs/ から始まり .md で終わる) */
  path: string;
  /** 管理画面の閲覧 URL (/docs/ の後に拡張子を除いたパス) */
  href: string;
  title: string;
}

export interface DomainOwner {
  name: string;
  kind: "エージェント" | "スキル";
  description: string;
}

export interface DomainOverview {
  domain: DomainInfo;
  stance: string | null;
  aim: string | null;
  cards: LaneCard[];
  owners: DomainOwner[];
  documents: DomainDoc[];
}

type RawNav = { label: string; kind: string; href?: string; channels?: string; children?: { href: string }[] };
type RawDomain = { id: string; label: string; role: string; manages: string; nav: RawNav[] };
const DOMAINS = domainsConfig.domains as RawDomain[];
const DOCUMENTS = domainsConfig.documents as Record<string, string>;

export function domainList(): DomainInfo[] {
  return DOMAINS.map((d) => ({
    id: d.id,
    label: d.label,
    role: d.role,
    manages: d.manages,
    nav: d.nav.map((n) => ({ label: n.label, kind: n.kind, href: n.href ?? n.children?.[0]?.href ?? null })),
  }));
}

/** 文書のパスを閲覧 URL にする。docs/ を /docs/ に、拡張子 .md を外し、区切りごとに符号化する (ファイル名由来の値を生で href に入れない) */
export function docHref(rel: string): string {
  const rest = rel.replace(/^docs\//, "").replace(/\.md$/, "");
  return `/docs/${rest.split("/").map(encodeURIComponent).join("/")}`;
}

function docTitle(text: string, rel: string): string {
  return frontmatterValue(text, "title") ?? path.basename(rel, ".md");
}

function walkMarkdown(dir: string, root: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMarkdown(p, root, out);
    else if (e.name.endsWith(".md")) out.push(path.relative(root, p).split(path.sep).join("/"));
  }
}

/** 文書の一覧と担当の索引は全領域で共通なので、60 秒だけ使い回す (他の read model と同じ間隔) */
const CACHE_MS = 60_000;

/** docs/ 配下の全文書と、その領域 id (未決は null)。 */
export function allDocuments(): (DomainDoc & { domainId: string | null })[] {
  return cached("domains:documents", CACHE_MS, scanDocuments);
}

function scanDocuments(): (DomainDoc & { domainId: string | null })[] {
  const root = projectRoot();
  const files: string[] = [];
  walkMarkdown(path.join(root, "docs"), root, files);
  const { documentDomain } = lib();
  return files.sort().map((rel) => ({
    path: rel,
    href: docHref(rel),
    title: docTitle(fs.readFileSync(path.join(root, rel), "utf8"), rel),
    domainId: documentDomain(DOCUMENTS, rel),
  }));
}

function owners(domainId: string): DomainOwner[] {
  return cached("domains:owners", CACHE_MS, scanOwners).filter((o) => o.domainId === domainId).map(({ domainId: _, ...o }) => o);
}

/** エージェント (.claude/agents/*.md) とスキル (SKILL.md) を一度だけ走査し、frontmatter の domain を付ける */
function scanOwners(): (DomainOwner & { domainId: string | string[] | null })[] {
  const root = projectRoot();
  const { frontmatterDomain } = lib();
  const out: (DomainOwner & { domainId: string | string[] | null })[] = [];
  const agentsDir = path.join(root, ".claude/agents");
  for (const f of fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).sort() : []) {
    if (!f.endsWith(".md") || f === "README.md") continue;
    const text = fs.readFileSync(path.join(agentsDir, f), "utf8");
    out.push({ name: f.replace(/\.md$/, ""), kind: "エージェント", description: frontmatterValue(text, "description") ?? "", domainId: frontmatterDomain(text) });
  }
  const skills: string[] = [];
  const walkSkills = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkSkills(p);
      else if (e.name === "SKILL.md") skills.push(p);
    }
  };
  walkSkills(path.join(root, ".claude/skills"));
  for (const p of skills.sort()) {
    const text = fs.readFileSync(p, "utf8");
    out.push({ name: frontmatterValue(text, "name") ?? path.basename(path.dirname(p)), kind: "スキル", description: frontmatterValue(text, "description") ?? "", domainId: frontmatterDomain(text) });
  }
  return out;
}

/** 領域の概要: 構えと狙い (収益化戦略 §5)・バックログのカード ([領域:])・担当 (frontmatter domain)・文書 (documents)。 */
export function domainOverview(id: string): DomainOverview | null {
  const domain = domainList().find((d) => d.id === id);
  if (!domain) return null;
  const board = strategyLaneBoard();
  const lane = board.lanes.find((l) => l.name === domain.label);
  return {
    domain,
    stance: lane?.stance ?? null,
    aim: lane?.aim ?? null,
    cards: lane?.cards ?? [],
    owners: owners(domain.id),
    documents: allDocuments().filter((d) => d.domainId === domain.id),
  };
}

export interface DocumentDetail {
  path: string;
  title: string;
  updated: string | null;
  status: string | null;
  domainId: string | null;
  body: string;
}

/** /docs/<segments> の本文。docs/ の外・.md 以外・symlink 脱出は null (resolveSafe が拒否する)。 */
export function readDocument(segments: string[]): DocumentDetail | null {
  if (segments.length === 0) return null;
  const root = projectRoot();
  const last = segments.length - 1;
  const withExt = segments.map((s, i) => (i === last ? `${s}.md` : s));
  const resolved = resolveSafe(path.join(root, "docs"), withExt);
  if ("error" in resolved) return null;
  const text = fs.readFileSync(resolved.file, "utf8");
  const rel = path.relative(root, resolved.file).split(path.sep).join("/");
  return {
    path: rel,
    title: docTitle(text, rel),
    updated: frontmatterValue(text, "updated"),
    status: frontmatterValue(text, "status"),
    domainId: lib().documentDomain(DOCUMENTS, rel),
    body: text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim(),
  };
}
