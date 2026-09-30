#!/usr/bin/env node
/**
 * 領域の正本 `.claude/config/domains.json` の整合検査 (DOMAIN-CONFIG-01)。
 *
 *   node .claude/scripts/lib/check-domains.cjs     # npm run check-domains
 *
 * 検査: 領域 id / label の重複なし・role が 5 役割のどれか・nav の kind が navKinds にある・
 * nav は href (管理画面のページが実在) か channels (チャネル別の枝) のどちらか 1 つ・href の重複なし・
 * documents の値が既知の領域 id でパスが実在。
 * エージェント (.claude/agents 直下の .md) とスキル (.claude/skills 配下の SKILL.md) の frontmatter `domain:` が
 * ちょうど 1 つあり、既知の領域 id であること、docs/ 配下の Markdown が documents で 1 つの領域に決まること (DOMAIN-AGENT-01)。
 * 領域 0 件は検査不成立として exit 2 (全 PASS が何も見ていない状態と区別する)。
 */
const fs = require("node:fs");
const path = require("node:path");

const ROLES = ["決める", "売る", "集める", "つくる", "支える"];
const CHANNEL_GROUPS = ["product", "sns"];

function checkDomains(cfg, { pageExists, pathExists }) {
  const errors = [];
  const domains = Array.isArray(cfg.domains) ? cfg.domains : [];
  const kinds = new Set(Object.keys(cfg.navKinds ?? {}));
  const ids = new Set();
  const labels = new Set();
  const hrefs = new Set();
  let navCount = 0;
  let lastRoleIndex = -1;

  for (const d of domains) {
    if (ids.has(d.id)) errors.push(`領域 id が重複: ${d.id}`);
    if (labels.has(d.label)) errors.push(`領域 label が重複: ${d.label}`);
    ids.add(d.id);
    labels.add(d.label);
    const roleIndex = ROLES.indexOf(d.role);
    if (roleIndex < 0) errors.push(`${d.id}: role が 5 役割にない: ${d.role}`);
    else if (roleIndex < lastRoleIndex) errors.push(`${d.id}: 役割の並び (${ROLES.join(" → ")}) が逆転している`);
    else lastRoleIndex = roleIndex;

    for (const n of d.nav ?? []) {
      navCount++;
      const where = `${d.id} > ${n.label}`;
      if (!kinds.has(n.kind)) errors.push(`${where}: kind が navKinds にない: ${n.kind}`);
      const hasHref = typeof n.href === "string";
      const hasChannels = typeof n.channels === "string";
      if (hasHref === hasChannels) {
        errors.push(`${where}: href と channels のどちらか 1 つだけを持つ`);
        continue;
      }
      if (hasChannels) {
        if (!CHANNEL_GROUPS.includes(n.channels)) errors.push(`${where}: channels は ${CHANNEL_GROUPS.join("/")} のどれか`);
        continue;
      }
      if (hrefs.has(n.href)) errors.push(`${where}: href が重複: ${n.href}`);
      hrefs.add(n.href);
      if (!pageExists(n.href)) errors.push(`${where}: 管理画面のページが無い: ${n.href}`);
    }
  }

  for (const [prefix, id] of Object.entries(cfg.documents ?? {})) {
    if (!ids.has(id)) errors.push(`documents ${prefix}: 未知の領域 id: ${id}`);
    if (!pathExists(prefix)) errors.push(`documents ${prefix}: パスが実在しない`);
  }

  return { errors, domainCount: domains.length, navCount, documentCount: Object.keys(cfg.documents ?? {}).length };
}

/** 文書パス (リポジトリ相対) → 領域 id。documents のパス接頭辞で長い一致を優先する。一致しなければ null。 */
function documentDomain(documents, file) {
  const p = file.split(path.sep).join("/");
  let best = null;
  for (const [key, id] of Object.entries(documents ?? {})) {
    const hit = key.endsWith("/") ? p.startsWith(key) : p === key;
    if (hit && (!best || key.length > best.key.length)) best = { key, id };
  }
  return best?.id ?? null;
}

/** docs/ 配下の Markdown がすべて documents でちょうど 1 つの領域に解決するか。 */
function checkDocuments(files, documents) {
  const unresolved = files.filter((f) => documentDomain(documents, f) === null);
  return { errors: unresolved.map((f) => `${f}: documents のどの接頭辞にも一致しない (領域が決まらない)`), docCount: files.length };
}

function collectDocs(root) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.push(path.relative(root, p).split(path.sep).join("/"));
    }
  };
  walk(path.join(root, "docs"));
  return out.sort();
}

/** frontmatter の `domain:` を読む。無ければ null、複数行あれば配列で返す。 */
function frontmatterDomain(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const found = m[1]
    .split(/\r?\n/)
    .filter((l) => /^domain:/.test(l))
    .map((l) => l.slice("domain:".length).trim().replace(/^["']|["']$/g, ""));
  if (found.length === 0) return null;
  return found.length === 1 ? found[0] : found;
}

/** owners: [{ kind: "agent"|"skill", file, text }] を検査し、未設定・語彙外・複数指定を error にする。 */
function checkOwners(owners, domainIds) {
  const ids = new Set(domainIds);
  const errors = [];
  const byDomain = Object.fromEntries(domainIds.map((id) => [id, { agent: 0, skill: 0 }]));
  let missing = 0;
  let unknown = 0;
  for (const o of owners) {
    const d = frontmatterDomain(o.text);
    if (d === null) {
      missing++;
      errors.push(`${o.file}: frontmatter に domain が無い`);
    } else if (Array.isArray(d)) {
      unknown++;
      errors.push(`${o.file}: domain が複数ある (主担当を 1 つにする)`);
    } else if (!ids.has(d)) {
      unknown++;
      errors.push(`${o.file}: domain が領域の正本に無い: ${d}`);
    } else {
      byDomain[d][o.kind]++;
    }
  }
  const count = (k) => owners.filter((o) => o.kind === k).length;
  return { errors, missing, unknown, agentCount: count("agent"), skillCount: count("skill"), byDomain };
}

function collectOwners(root) {
  const owners = [];
  const agentsDir = path.join(root, ".claude/agents");
  for (const f of fs.readdirSync(agentsDir).sort()) {
    if (!f.endsWith(".md") || f === "README.md") continue;
    owners.push({ kind: "agent", file: `.claude/agents/${f}`, text: fs.readFileSync(path.join(agentsDir, f), "utf8") });
  }
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "SKILL.md") owners.push({ kind: "skill", file: path.relative(root, p), text: fs.readFileSync(p, "utf8") });
    }
  };
  walk(path.join(root, ".claude/skills"));
  return owners;
}

function main() {
  const root = path.resolve(__dirname, "../../..");
  const cfg = JSON.parse(fs.readFileSync(path.join(root, ".claude/config/domains.json"), "utf8"));
  const appDir = path.join(root, "apps/admin/app");
  const result = checkDomains(cfg, {
    pageExists: (href) => {
      const route = href.split("?")[0];
      return fs.existsSync(path.join(appDir, route === "/" ? "" : route, "page.tsx"));
    },
    pathExists: (p) => fs.existsSync(path.join(root, p)),
  });

  if (result.domainCount === 0) {
    console.error("✗ check-domains: 領域が 0 件 (検査不成立)");
    process.exit(2);
  }
  const owners = checkOwners(collectOwners(root), cfg.domains.map((d) => d.id));
  const docs = checkDocuments(collectDocs(root), cfg.documents);
  const errors = [...result.errors, ...owners.errors, ...docs.errors];
  for (const e of errors) console.error(`✗ ${e}`);
  const perDomain = Object.entries(owners.byDomain).map(([id, c]) => `${id} ${c.agent}/${c.skill}`).join(", ");
  console.log(`  領域別 エージェント/スキル: ${perDomain}`);
  const summary =
    `領域 ${result.domainCount} / メニュー項目 ${result.navCount} / 文書の割り当て ${result.documentCount} / ` +
    `エージェント ${owners.agentCount}・スキル ${owners.skillCount} (domain 未設定 ${owners.missing}・語彙外 ${owners.unknown}) / 文書 ${docs.docCount} (領域未決 ${docs.errors.length})`;
  if (errors.length > 0) {
    console.error(`check-domains: error ${errors.length} (${summary})`);
    process.exit(1);
  }
  console.log(`✓ check-domains: ${summary} を検査、error 0`);
}

if (require.main === module) main();

module.exports = { checkDomains, checkOwners, checkDocuments, documentDomain, frontmatterDomain, ROLES };
