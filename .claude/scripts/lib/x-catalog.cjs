/**
 * x-catalog.cjs — X 投稿カタログの機械参照口 (正本: 台帳 sns.x-catalog)
 *
 * X の投稿上限 (quota)・キャプションの型 (templates)・カテゴリと切り口の相性 (affinity)・
 * 添付できる画像種 (imageKinds) を、台帳 sns.x-catalog (置き場はカタログ config/datasets.mjs が決める) から読む。
 * 値を変えるときは台帳を編集する。`.claude/rules/sns-content-standards.md` は項目の意味と改訂の手順だけを持ち、
 * このモジュールは rule の Markdown を読まない (2026-11-14 X-CATALOG-RULES-PARSE-01。以前は rule の表をパースしていた)。
 *
 * 読むたびに台帳の形の契約 (JSON Schema) で検証し、合わなければ throw する (サイレント既定値を返さない)。
 *
 * API:
 *   getQuota()       → { dailyMax, weeklyTargetMin, weeklyTargetMax }
 *   getTemplates()   → [{ template, structure, imageKind, charMax, bestTime, use }]
 *   getAffinity()    → { <category>: { 結論, 理由, 体験, 反論, 数字, ハウツー } }
 *   getImageKinds()  → [{ imageKind, size, generator, outPath, note }]  (画像なしの種類は size・generator・outPath が null)
 *   getTemplate(id)  → 1件 (無ければ null)
 *   getImageKind(id) → 1件 (無ければ null)
 *   createCatalog(filePath) → 上と同じ関数を、別の置き場の台帳に対して返す (テスト用)
 *
 * CLI:
 *   node .claude/scripts/lib/x-catalog.cjs --check   # 自己検証 (exit 0/1)
 *   node .claude/scripts/lib/x-catalog.cjs --json     # 全カタログを JSON で出力
 */

const fs = require("node:fs");
const path = require("node:path");

const { datasetPath } = require("../../../config/datasets.mjs");
const { assertDatasetShape } = require("./dataset-shape.mjs");

const DATASET_ID = "sns.x-catalog";
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const CATALOG_PATH = path.join(PROJECT_ROOT, datasetPath(DATASET_ID));

/**
 * @typedef {{ dailyMax: number, weeklyTargetMin: number, weeklyTargetMax: number }} XQuota
 * @typedef {{ template: string, structure: string, imageKind: string, charMax: number, bestTime: string, use: string }} XTemplate
 * @typedef {{ imageKind: string, size: string | null, generator: string | null, outPath: string | null, note: string }} XImageKind
 */

/** @param {string} filePath 台帳 sns.x-catalog と同じ形の JSON */
function createCatalog(filePath) {
  /** 台帳を読み、形の契約で検証して返す。合わなければ throw */
  function load() {
    const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assertDatasetShape(DATASET_ID, doc);
    return doc;
  }

  /** @returns {XQuota} */
  function getQuota() {
    return load().quota;
  }

  /** @returns {XTemplate[]} */
  function getTemplates() {
    return load().templates.map(({ id, ...rest }) => ({ template: id, ...rest }));
  }

  /** @returns {Record<string, Record<string, string>>} */
  function getAffinity() {
    return load().affinity;
  }

  /** @returns {XImageKind[]} */
  function getImageKinds() {
    return load().imageKinds.map(({ id, ...rest }) => ({ imageKind: id, ...rest }));
  }

  /** @param {string} id */
  function getTemplate(id) {
    return getTemplates().find((t) => t.template === id) ?? null;
  }

  /** @param {string} id */
  function getImageKind(id) {
    return getImageKinds().find((k) => k.imageKind === id) ?? null;
  }

  /**
   * 自己検証: 形の契約では表せない整合 (上限の大小・テンプレが指す画像種の実在) を確かめる。
   * lint フェーズ冒頭で必ず呼ぶ。成功で { ok: true, ... } を返し、失敗は throw。
   */
  function selfCheck() {
    const quota = getQuota();
    if (quota.weeklyTargetMax < quota.weeklyTargetMin) {
      throw new Error(
        `[x-catalog] weeklyTargetMax(${quota.weeklyTargetMax}) < min(${quota.weeklyTargetMin})`,
      );
    }
    const templates = getTemplates();
    const imageKinds = getImageKinds();
    const kindIds = new Set(imageKinds.map((k) => k.imageKind));
    for (const t of templates) {
      if (!kindIds.has(t.imageKind)) {
        throw new Error(
          `[x-catalog] template '${t.template}' の imageKind '${t.imageKind}' が imageKinds に無い`,
        );
      }
    }
    return {
      ok: true,
      quota,
      templateCount: templates.length,
      imageKindCount: imageKinds.length,
      affinityCategoryCount: Object.keys(getAffinity()).length,
    };
  }

  return { getQuota, getTemplates, getAffinity, getImageKinds, getTemplate, getImageKind, selfCheck };
}

module.exports = {
  CATALOG_PATH,
  createCatalog,
  ...createCatalog(CATALOG_PATH),
};

// ---------- CLI ----------
if (require.main === module) {
  const catalog = module.exports;
  const arg = process.argv[2];
  try {
    if (arg === "--check") {
      const r = catalog.selfCheck();
      console.log(
        `[x-catalog] OK — templates=${r.templateCount} imageKinds=${r.imageKindCount} ` +
          `affinity=${r.affinityCategoryCount} quota=${JSON.stringify(r.quota)}`,
      );
      process.exit(0);
    } else if (arg === "--json") {
      console.log(
        JSON.stringify(
          {
            quota: catalog.getQuota(),
            templates: catalog.getTemplates(),
            affinity: catalog.getAffinity(),
            imageKinds: catalog.getImageKinds(),
          },
          null,
          2,
        ),
      );
      process.exit(0);
    } else {
      console.error("usage: x-catalog.cjs --check | --json");
      process.exit(1);
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
