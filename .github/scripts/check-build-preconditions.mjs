#!/usr/bin/env node
/**
 * 本番デプロイで指標スナップショットを R2 へ反映する前に、アプリの Build が
 * 「スナップショットの中身と関係なく」落ちる条件を検査する — DEPLOY-R2-AHEAD-OF-APP-01。
 *
 * deploy-workers.yml は R2 反映を Build より前に置く。Build が新しいスナップショットを読むためで
 * (prebuild の検索 index が app/ranking-items/all.json を読み、generateStaticParams・sitemap も R2 を読む)、
 * 反映を Build の後へは移せない。そのため反映の後で Build が落ちると、旧版のアプリが新しいスナップショットを読む。
 *
 * 2026-10-21 (run 39589689158) は、反映の後の Build が OpenNext の Next.js サポート期限の判定だけで落ちた。
 * この判定は Next.js の版と今日の日付だけで決まり、Build を始める前に分かる。ここで先に同じ判定を行い、
 * 落ちるなら R2 へ何も送らずにデプロイを止める。
 *
 * 判定は写さず、Build が使う関数そのものを呼ぶ (apps/web の @opennextjs/cloudflare が読む
 * @opennextjs/aws の build/helper.js)。OpenNext が判定を変えたら、この検査も同じ結果になる。
 *
 * 使い方:
 *   node .github/scripts/check-build-preconditions.mjs
 *   node .github/scripts/check-build-preconditions.mjs --next-version 14.2.35   # 落ちる条件の再現 (テスト用)
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APP_DIR = path.join(ROOT, "apps/web");

const appRequire = createRequire(path.join(APP_DIR, "package.json"));
const adapterEntry = appRequire.resolve("@opennextjs/cloudflare");
const helperPath = createRequire(adapterEntry).resolve("@opennextjs/aws/build/helper.js");
const helper = await import(pathToFileURL(helperPath).href);

if (typeof helper.isNextVersionSupported !== "function" || typeof helper.getNextVersion !== "function") {
  console.error(
    `❌ ${path.relative(ROOT, helperPath)} に Next.js のサポート期限の判定が見つかりません。` +
      "OpenNext の版が変わっています。Build が今どの条件で落ちるかを確かめ、この検査を合わせてください。" +
      "判定できないので、R2 への反映より前で止めます。",
  );
  process.exit(1);
}

const overrideAt = process.argv.indexOf("--next-version");
const nextVersion = overrideAt >= 0 ? process.argv[overrideAt + 1] : helper.getNextVersion(APP_DIR);

if (!nextVersion || !helper.isNextVersionSupported(nextVersion)) {
  console.error(
    `❌ Next.js ${nextVersion} は OpenNext のサポート期限の判定を通りません。この後の Build は必ず落ちます。` +
      "R2 への反映より前で止めたので、本番のスナップショットは変わっていません。" +
      "Next.js を上げてからデプロイし直してください。",
  );
  process.exit(1);
}

console.log(`✅ Next.js ${nextVersion} は OpenNext のサポート期限の判定を通ります`);
