const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { checkDomains } = require("../check-domains.cjs");

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
