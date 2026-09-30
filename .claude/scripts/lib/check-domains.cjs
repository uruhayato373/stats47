#!/usr/bin/env node
/**
 * 領域の正本 `.claude/config/domains.json` の整合検査 (DOMAIN-CONFIG-01)。
 *
 *   node .claude/scripts/lib/check-domains.cjs     # npm run check-domains
 *
 * 検査: 領域 id / label の重複なし・role が 5 役割のどれか・nav の kind が navKinds にある・
 * nav は href (管理画面のページが実在) か channels (チャネル別の枝) のどちらか 1 つ・href の重複なし・
 * documents の値が既知の領域 id でパスが実在。
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
  for (const e of result.errors) console.error(`✗ ${e}`);
  const summary = `領域 ${result.domainCount} / メニュー項目 ${result.navCount} / 文書の割り当て ${result.documentCount}`;
  if (result.errors.length > 0) {
    console.error(`check-domains: error ${result.errors.length} (${summary})`);
    process.exit(1);
  }
  console.log(`✓ check-domains: ${summary} を検査、error 0`);
}

if (require.main === module) main();

module.exports = { checkDomains, ROLES };
