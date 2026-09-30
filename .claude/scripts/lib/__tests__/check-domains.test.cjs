const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { checkDomains, checkOwners, frontmatterDomain } = require("../check-domains.cjs");

const ROOT = path.resolve(__dirname, "../../../..");
const always = { pageExists: () => true, pathExists: () => true };
const kinds = { navKinds: { actions: "要対応", results: "成果" } };
const domain = (over = {}) => ({ id: "plan", label: "計画", role: "決める", nav: [{ label: "今週", href: "/todo?f=weekly", kind: "actions" }], ...over });

test("正本の domains.json は error 0 で、全領域とメニュー項目を検査する", () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/config/domains.json"), "utf8"));
  const result = checkDomains(cfg, {
    pageExists: (href) => {
      const route = href.split("?")[0];
      return fs.existsSync(path.join(ROOT, "apps/admin/app", route === "/" ? "" : route, "page.tsx"));
    },
    pathExists: (p) => fs.existsSync(path.join(ROOT, p)),
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.domainCount, 8);
  assert.ok(result.navCount > 0);
});

test("管理画面に無いページを指す項目は error にする (リンク切れのメニューを出さない)", () => {
  const result = checkDomains({ ...kinds, domains: [domain()] }, { ...always, pageExists: () => false });
  assert.match(result.errors.join("\n"), /ページが無い/);
});

test("5 役割の並びが逆転したら error にする (決める → 売る → 集める → つくる → 支える)", () => {
  const cfg = { ...kinds, domains: [domain({ id: "ops", label: "管理", role: "支える" }), domain()] };
  assert.match(checkDomains(cfg, always).errors.join("\n"), /逆転/);
});

test("navKinds に無い画面の種類・href と channels の両持ち・id の重複を error にする", () => {
  const cfg = {
    ...kinds,
    domains: [
      domain({ nav: [{ label: "x", href: "/a", kind: "unknown" }, { label: "y", href: "/b", channels: "sns", kind: "actions" }] }),
      domain({ label: "計画2" }),
    ],
  };
  const text = checkDomains(cfg, always).errors.join("\n");
  assert.match(text, /kind が navKinds にない/);
  assert.match(text, /どちらか 1 つだけ/);
  assert.match(text, /id が重複/);
});

test("documents が未知の領域を指したら error にする", () => {
  const cfg = { ...kinds, domains: [domain()], documents: { "docs/x/": "nope" } };
  assert.match(checkDomains(cfg, always).errors.join("\n"), /未知の領域 id/);
});

const md = (fm) => `---\nname: x\n${fm}description: y\n---\n\n# body\ndomain: site\n`;
const IDS = ["plan", "site"];

test("frontmatter の domain だけを読み、本文の domain: 行は数えない", () => {
  assert.equal(frontmatterDomain(md("domain: plan\n")), "plan");
  assert.equal(frontmatterDomain(md("")), null);
  assert.equal(frontmatterDomain("# frontmatter なし\ndomain: plan\n"), null);
});

test("既知の領域を 1 つ持つエージェント・スキルは error 0 で領域別に数える (非発火側)", () => {
  const r = checkOwners(
    [
      { kind: "agent", file: "a.md", text: md("domain: plan\n") },
      { kind: "skill", file: "s/SKILL.md", text: md('domain: "site"\n') },
    ],
    IDS,
  );
  assert.deepEqual(r.errors, []);
  assert.equal(r.missing + r.unknown, 0);
  assert.deepEqual(r.byDomain, { plan: { agent: 1, skill: 0 }, site: { agent: 0, skill: 1 } });
});

test("domain の未設定・語彙外・複数指定を error にし、件数を分けて数える (発火側)", () => {
  const r = checkOwners(
    [
      { kind: "agent", file: "none.md", text: md("") },
      { kind: "agent", file: "bad.md", text: md("domain: marketing\n") },
      { kind: "skill", file: "two/SKILL.md", text: md("domain: plan\ndomain: site\n") },
    ],
    IDS,
  );
  const text = r.errors.join("\n");
  assert.match(text, /none\.md: frontmatter に domain が無い/);
  assert.match(text, /bad\.md: domain が領域の正本に無い: marketing/);
  assert.match(text, /two\/SKILL\.md: domain が複数ある/);
  assert.equal(r.missing, 1);
  assert.equal(r.unknown, 2);
});
