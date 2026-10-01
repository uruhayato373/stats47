const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { checkDomains, checkOwners, checkDocuments, documentDomain, frontmatterDomain } = require("../check-domains.cjs");

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
  assert.match(text, /どれか 1 つだけ/);
  assert.match(text, /id が重複/);
});

// 意図: レビュー (週次・月次) のような固定の枝は children で持つ。子のページ実在と href 重複も葉と同じに検査する
test("children の枝は子ごとにページ実在と href 重複を検査し、空の枝と href の両持ちを error にする", () => {
  const branch = { label: "レビュー", kind: "results", children: [{ label: "週次", href: "/r/weekly" }, { label: "月次", href: "/r/monthly" }] };
  assert.deepEqual(checkDomains({ ...kinds, domains: [domain({ nav: [branch] })] }, always).errors, []);
  const missing = checkDomains({ ...kinds, domains: [domain({ nav: [branch] })] }, { ...always, pageExists: (h) => h !== "/r/monthly" });
  assert.match(missing.errors.join("\n"), /レビュー > 月次: 管理画面のページが無い/);
  const bad = checkDomains(
    { ...kinds, domains: [domain({ nav: [{ ...branch, children: [] }, { ...branch, label: "両持ち", href: "/x" }, { label: "重複", href: "/r/weekly", kind: "actions" }] })] },
    always,
  ).errors.join("\n");
  assert.match(bad, /children が空/);
  assert.match(bad, /どれか 1 つだけ/);
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

test("文書は documents の長い接頭辞を優先して 1 つの領域に決まり、どれにも一致しなければ error にする", () => {
  const docs = { "docs/": "ops", "docs/00_x/": "strategy", "docs/INDEX.md": "ops" };
  assert.equal(documentDomain(docs, "docs/00_x/a.md"), "strategy");
  assert.equal(documentDomain(docs, "docs/y/b.md"), "ops");
  assert.equal(documentDomain({ "docs/00_x/": "strategy" }, "docs/y/b.md"), null);
  const r = checkDocuments(["docs/00_x/a.md", "docs/z.md"], { "docs/00_x/": "strategy" });
  assert.equal(r.docCount, 2);
  assert.match(r.errors.join("\n"), /docs\/z\.md: documents のどの接頭辞にも一致しない/);
  assert.deepEqual(checkDocuments(["docs/00_x/a.md"], { "docs/00_x/": "strategy" }).errors, []);
});
