const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const guardPath = path.resolve(__dirname, "../check-r2-route-ssg.cjs");
const guard = fs.readFileSync(guardPath, "utf8");
const catalogRoute = "apps/web/src/app/geo/data-catalog/page.tsx";

function checkCatalog(source) {
  const errors = [];
  let exitCode = 0;
  const stopped = {};
  try {
    vm.runInNewContext(guard, {
      __dirname: path.dirname(guardPath),
      require: (name) => name === "fs" ? {
        // path.join は Windows で \ 区切りを返すので / にそろえてから比べる
        existsSync: (file) => file.split(path.sep).join("/").endsWith(catalogRoute),
        readFileSync: () => source,
      } : require(name),
      console: { log: () => {}, error: (message) => errors.push(message) },
      process: { exit: (code) => { exitCode = code; throw stopped; } },
    });
  } catch (error) {
    if (error !== stopped) throw error;
  }
  return { exitCode, errors: errors.join("\n") };
}

test("R2出典カタログはrevalidateだけではビルド時の取得失敗が固着するため拒否する", () => {
  const result = checkCatalog("export const revalidate = 86400;");
  assert.equal(result.exitCode, 1);
  assert.match(result.errors, /geo\/data-catalog\/page\.tsx/);
});

test("出典カタログのランタイム描画は許可するがコメントだけの宣言は拒否する", () => {
  assert.equal(checkCatalog("export const dynamic = 'force-dynamic';").exitCode, 0);
  assert.equal(checkCatalog("// export const dynamic = 'force-dynamic';").exitCode, 1);
});

test("実際の出典カタログもR2をビルド時に固定しないroute契約を維持する", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../../../../..", catalogRoute), "utf8");
  assert.match(source, /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  assert.equal(checkCatalog(source).exitCode, 0);
});

function checkRoute(route, source) {
  const errors = [];
  let exitCode = 0;
  const stopped = {};
  try {
    vm.runInNewContext(guard, {
      __dirname: path.dirname(guardPath),
      require: (name) => name === "fs" ? {
        existsSync: (file) => file.split(path.sep).join("/").endsWith(route),
        readFileSync: () => source,
      } : require(name),
      console: { log: () => {}, error: (message) => errors.push(message) },
      process: { exit: (code) => { exitCode = code; throw stopped; } },
    });
  } catch (error) {
    if (error !== stopped) throw error;
  }
  return { exitCode, errors: errors.join("\n") };
}

const rankingRoute = "apps/web/src/app/ranking/[rankingKey]/page.tsx";

test("R2 依存 route は空配列を返す generateStaticParams を許可する (実行時 ISR に要る。CF-CPU-ISR-01)", () => {
  const source = "export async function generateStaticParams(): Promise<Array<{ rankingKey: string }>> {\n  return [];\n}\nexport const revalidate = 86400;";
  assert.equal(checkRoute(rankingRoute, source).exitCode, 0);
});

test("R2 依存 route の generateStaticParams がキー列を返したら拒否する (2026-06-22 の notFound 固着)", () => {
  const source = "export async function generateStaticParams() {\n  return KNOWN_RANKING_KEYS.map((rankingKey) => ({ rankingKey }));\n}\nexport const revalidate = 86400;";
  const result = checkRoute(rankingRoute, source);
  assert.equal(result.exitCode, 1);
  assert.match(result.errors, /ranking\/\[rankingKey\]/);
});
