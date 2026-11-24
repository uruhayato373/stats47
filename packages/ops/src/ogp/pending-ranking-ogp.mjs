/**
 * デプロイ待ちの既知ランキングキーのうち、OGP 画像がまだ R2 に無いものを選ぶ (R2-WRITE-PENDING-DISPLACE-01)。
 *
 * なぜ要るか: ranking-ogp-new-keys.yml は R2 へ書く workflow 共通の concurrency (r2-write) に入る。この group は
 * 待機を 1 本しか持てず、後から入った run が待機中の run を黙って cancelled にする。旧版は「この push で足されたキー」
 * だけを作っていたので、取り消された push のキーは次の push では対象にならず、デプロイ後スモークの 404 まで気づけなかった。
 *
 * ここでは対象を「develop にあって main に無いキー (= まだ本番へ出ていないキー)」に広げ、そのうち og:image が
 * 公開 R2 に無いものだけを返す。取り消された run のキーは、次の push か定期実行で必ずもう一度拾われる。
 * 画像が揃っていれば空を返すので、呼び元は r2-write の待ち枠に入らない (待ち枠を奪う側にもならない)。
 *
 * CI は依存を入れずに読むので、R2 のキーは鏡 (r2-keys.mjs) を相対パスで読む。
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { R2_PUBLIC_ORIGIN, rankingR2Key } from "../../../r2-storage/mirror/r2-keys.mjs";

/** 1 回に作る上限。generate-ogp-images.ts の --max-generate と同じ */
export const MAX_KEYS_PER_RUN = 50;

/** デプロイ後スモーク (smoke-test-routes.sh) と同じ規則で、known-ranking-keys.ts の行からキーを抜く */
const KEY_LINE = /^\s*"([a-z0-9-]+)",?\s*$/;

/** @param {string} text known-ranking-keys.ts の中身 */
export function parseKnownKeys(text) {
  const keys = new Set();
  for (const line of text.split("\n")) {
    const match = KEY_LINE.exec(line);
    if (match) keys.add(match[1]);
  }
  return keys;
}

/**
 * develop にあって main に無いキー (並びは安定させるため昇順)
 * @param {string} developText
 * @param {string} mainText
 */
export function pendingKeys(developText, mainText) {
  const deployed = parseKnownKeys(mainText);
  return [...parseKnownKeys(developText)].filter((key) => !deployed.has(key)).sort();
}

/**
 * og:image が公開 R2 に無いキーを返す。HEAD が 404 のものだけを「無い」とし、ほかの応答や通信の失敗は
 * 判断できないので「無い」側に倒す (作り直しは exact publish plan が新しさを見て省くので、余分に選んでも害は小さい)。
 * @param {string[]} keys
 * @param {{ base?: string, fetchImpl?: typeof fetch }} [options]
 */
export async function keysMissingOgp(keys, { base = R2_PUBLIC_ORIGIN, fetchImpl = fetch } = {}) {
  const origin = base.replace(/\/+$/, "");
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const response = await fetchImpl(`${origin}/${rankingR2Key(key, "ogp-image")}`, { method: "HEAD" });
        return response.ok ? null : key;
      } catch {
        return key;
      }
    }),
  );
  return results.filter((key) => key !== null);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [developFile, mainFile] = process.argv.slice(2);
  if (!developFile || !mainFile) {
    console.error("使い方: node pending-ranking-ogp.mjs <develop の known-ranking-keys.ts> <main の known-ranking-keys.ts>");
    process.exit(2);
  }
  const pending = pendingKeys(readFileSync(developFile, "utf8"), readFileSync(mainFile, "utf8"));
  const missing = await keysMissingOgp(pending, { base: process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_ORIGIN });
  const selected = missing.slice(0, MAX_KEYS_PER_RUN);
  console.error(`デプロイ待ちのキー ${pending.length} 件 / og:image が無いもの ${missing.length} 件 / 今回作る ${selected.length} 件`);
  if (missing.length > MAX_KEYS_PER_RUN) {
    console.error(`::warning::og:image の無いキーが ${missing.length} 件で上限 ${MAX_KEYS_PER_RUN} 件を超える。残りは次の実行で作る`);
  }
  process.stdout.write(`pending=${pending.length}\nmissing=${missing.length}\nkeys=${selected.join(",")}\n`);
}
