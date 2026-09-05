/**
 * internal-link-lint — 記事内部リンクの「リンク先が実在するか」を決定的に検査する
 *
 * 背景 (2026-07-24 実測): ブログ 424 記事が参照する `/ranking/<key>` 579 件のうち 37 件が
 * 到達不能だった。内訳は **soft 404 が 29 件 (HTTP 200 + タイトル「ランキングが見つかりません」)** と
 * 410 Gone が 8 件。soft 404 は HTTP ステータスを見る検査を素通りするため、
 * `nextjs-ssg-preservation.md` の smoke-test と同じく **status ではなく実在集合 / タイトル**で判定する。
 *
 * 二層構成:
 *   ① 本ファイル (オフライン・ネットワーク不要) … repo 内の key 集合と突合。pre-commit / 公開 CI 用。
 *      判定できる型に限定し、確実に壊れているものだけ blocker にする (誤検知ゼロを優先)。
 *   ② audit-internal-links.mjs (ネットワーク) … 全リンクを live で GET しタイトル判定。週次の全量監査。
 *
 * オフラインで判定する型と根拠:
 *   /ranking/<key> … GONE_RANKING_KEYS にあれば 410 / KNOWN_RANKING_KEYS にも metric config にも
 *                    無ければ soft 404 (38 件の live 実測に対し 38/38 一致・誤検知 0)
 *   /blog/<slug>   … GONE_BLOG_SLUGS にあれば 410
 *   /category/<key>… CATEGORY_KEYS (17 軸) 外なら 404
 *   /areas/<code>  … 01000-47000 以外なら 410
 *   /themes/<slug> … THEME_SETS (all-themes.ts) 由来の 22 slug 外なら 410 (22/22 live 一致で検証済)
 * **blog 記事の実在** と tag / survey は ② に委ねる (公開 slug 集合が repo に無く R2 参照が要るため)。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * リポジトリルートを上方向に探索して決める。
 * 相対段数 ("../../..") 固定や cwd 依存にすると、vitest / pre-commit / CI で
 * 解決に失敗しても **例外にならず空集合になり、lint が黙って全通しする** (fail-open)。
 * それが一番危険なので、マーカーで確実に特定し、見つからなければ即座に落とす。
 */
function findRepoRoot() {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, ".claude")) &&
      fs.existsSync(path.join(dir, "packages"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("internal-link-lint: リポジトリルートを特定できませんでした");
}

const ROOT = findRepoRoot();

const SOURCES = {
  knownRankingKeys: "packages/ranking/src/config/known-ranking-keys.ts",
  // KNOWN と対で packages/ranking 側が実体 (apps/web の同名ファイルは re-export の殻)。
  // 殻を指すと readQuotedSet が 0 件を返し、lint が「退役キーへのリンク」を全部見逃す。
  goneRankingKeys: "packages/ranking/src/config/gone-ranking-keys.ts",
  goneBlogSlugs: "apps/web/src/config/gone-blog-slugs.ts",
  blogRedirects: "apps/web/src/config/blog-redirects.ts",
  categoryKeys: "packages/data-configs/src/types.ts",
  metricsDir: "packages/data-configs/src/metrics",
  themeSets: "apps/web/src/features/theme-dashboard/config/all-themes.ts",
  geoAnalyses: "packages/data-configs/src/business-plan/m1.ts",
};

/**
 * 二重引用符で囲まれた kebab-case 文字列を集合として取り出す。
 * ファイルが無いときは黙って空集合を返さず落とす (空集合 = lint が全リンクを正常と誤認する)。
 */
function readQuotedSet(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`internal-link-lint: 参照元が見つかりません: ${relPath}`);
  }
  const src = fs.readFileSync(abs, "utf8");
  return new Set([...src.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)].map((m) => m[1]));
}

/** 必須ファイルを読む (無ければ落とす) */
function readRequired(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`internal-link-lint: 参照元が見つかりません: ${relPath}`);
  }
  return fs.readFileSync(abs, "utf8");
}

let cache = null;
function loadKeySets() {
  if (cache) return cache;

  const known = readQuotedSet(SOURCES.knownRankingKeys);
  // KNOWN_RANKING_KEYS は R2 からの生成物で stale になりうるため metric config も実在扱いにする
  const metricsDir = path.join(ROOT, SOURCES.metricsDir);
  if (fs.existsSync(metricsDir)) {
    for (const f of fs.readdirSync(metricsDir)) {
      if (f.endsWith(".ts") && !f.startsWith("index")) known.add(f.replace(/\.ts$/, ""));
    }
  }

  const catBlock = readRequired(SOURCES.categoryKeys).match(
    /export const CATEGORY_KEYS = \[([\s\S]*?)\]/,
  );
  if (!catBlock) throw new Error("internal-link-lint: CATEGORY_KEYS を抽出できません");
  const categories = new Set([...catBlock[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]));

  const areaCodes = new Set(
    Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`),
  );

  // THEME_SETS の定数名 (POPULATION_DYNAMICS_SET) が slug (population-dynamics) に対応する。
  // この対応は宣言されていない「たまたまの一致」なので、正典 (KNOWN_THEME_SLUGS) との突合を
  // apps/web/src/config/__tests__/internal-link-lint-keysets.test.ts が CI で行う。
  const themeBlock = readRequired(SOURCES.themeSets).match(/const THEME_SETS = \[([\s\S]*?)\]/);
  if (!themeBlock) throw new Error("internal-link-lint: THEME_SETS を抽出できません");
  const themes = new Set(
    [...themeBlock[1].matchAll(/([A-Z0-9_]+)_SET/g)].map((m) =>
      m[1].toLowerCase().replace(/_/g, "-"),
    ),
  );

  const geoBlock = readRequired(SOURCES.geoAnalyses).match(
    /export const BUSINESS_PLAN_M1_GEO_ANALYSES = \[([\s\S]*?)\] as const/,
  );
  if (!geoBlock) throw new Error('internal-link-lint: Geo analysis集合を抽出できません');
  const geoSlugs = new Set([...geoBlock[1].matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  if (!geoSlugs.size) throw new Error('internal-link-lint: Geo analysis集合が空です');
  cache = {
    geoSlugs,
    rankingKnown: known,
    rankingGone: readQuotedSet(SOURCES.goneRankingKeys),
    blogGone: readQuotedSet(SOURCES.goneBlogSlugs),
    // 旧 slug → 現行 slug の 301。live では 200 に着地するのでリンク切れではない
    blogRedirects: readQuotedSet(SOURCES.blogRedirects),
    categories,
    areaCodes,
    themes,
  };
  return cache;
}

/** テスト・再読込用 */
export function resetKeySetCache() {
  cache = null;
}

/**
 * 導出した key 集合を返す (drift 検出テスト専用)。
 * TS を実行せず正規表現で読んでいるため、正典のリネームで黙って別物を見る危険がある。
 * `apps/web/src/config/__tests__/internal-link-lint-keysets.test.ts` が正典と突合する。
 */
export function __loadKeySetsForTest() {
  resetKeySetCache();
  return loadKeySets();
}

const LINK_TYPES = ["ranking", "blog", "areas", "category", "themes", "survey", "tag", "geo"];
const TYPE_RE = LINK_TYPES.join("|");
/** 自サイトの絶対 URL も内部リンクとして扱う (記事によって相対 / 絶対が混在している) */
const SITE_ORIGIN_RE = /^(?:https?:)?\/\/(?:www\.)?stats47\.jp/i;
/** 相対 `/ranking/…` と絶対 `https://stats47.jp/ranking/…` の両方を拾う前置 */
const PREFIX_RE = `(?:(?:https?:)?//(?:www\\.)?stats47\\.jp)?`;

/**
 * 記事本文から内部リンクを抽出する (source-link カード + markdown リンク)
 * 相対パスと自サイト絶対 URL の両方を対象にする。
 * @returns {{href:string,absolute:boolean,type:string,segments:string[],kind:"card"|"text",label:string}[]}
 */
export function extractInternalLinks(content) {
  const links = [];
  const push = (raw, kind, label) => {
    const absolute = SITE_ORIGIN_RE.test(raw);
    const clean = raw.replace(SITE_ORIGIN_RE, "").split(/[?#]/)[0].replace(/\/+$/, "");
    const segments = clean.split("/").filter(Boolean);
    if (!segments.length || !LINK_TYPES.includes(segments[0])) return;
    links.push({
      href: clean,
      absolute,
      type: segments[0],
      segments,
      kind,
      label: (label || "").trim(),
    });
  };

  const cardRe = new RegExp(
    `<source-link\\s+href="(${PREFIX_RE}/(?:${TYPE_RE})[^"]*)"[^>]*>([\\s\\S]*?)</source-link>`,
    "gi",
  );
  for (const m of content.matchAll(cardRe)) push(m[1], "card", m[2]);

  const mdRe = new RegExp(
    `\\[([^\\]]*)\\]\\((${PREFIX_RE}/(?:${TYPE_RE})[^)\\s]*)\\)`,
    "g",
  );
  for (const m of content.matchAll(mdRe)) push(m[2], "text", m[1]);

  return links;
}

/**
 * オフラインで確定できる「リンク切れ」を検出する
 *
 * @param {string} content 記事本文
 * @param {{blogSlugs?: Set<string>}} [opts] blogSlugs を渡すと `/blog/<slug>` の実在も検査する
 *   (公開 slug 集合は R2 `app/blog/all.json` にしか無いので、それを持つ呼び元だけが渡す。
 *    published:false の記事は live で「記事が見つかりません」になるため集合に入れないこと)
 * @returns {{blockers:string[],warnings:string[],stats:object}}
 */
export function lintInternalLinks(content, opts = {}) {
  const sets = loadKeySets();
  const blogSlugs = opts.blogSlugs instanceof Set && opts.blogSlugs.size ? opts.blogSlugs : null;
  const links = extractInternalLinks(content);
  const blockers = [];
  const warnings = [];
  const seen = new Set();
  let checked = 0;
  let broken = 0;

  for (const link of links) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    const [type, key] = link.segments;
    const where = link.kind === "card" ? "カード" : "テキストリンク";

    if (type === 'geo') {
      checked++;
      const parts = link.segments.slice(1);
      const validPref = (pref) => /^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(pref ?? '');
      const valid = parts.length === 0 ||
        (parts.length === 1 && (['compare', 'method', 'data-catalog', '2050-population'].includes(key) || sets.geoSlugs.has(key))) ||
        (parts.length === 3 && key === 'data' && sets.geoSlugs.has(parts[1]) && validPref(parts[2])) ||
        (parts.length === 3 && sets.geoSlugs.has(key) && validPref(parts[1]) && ['population', 'overlap', 'audit'].includes(parts[2]));
      if (!valid) {
        broken++;
        blockers.push(`リンク切れ: ${link.href} — Geo公開ルート契約に存在しない (${where})`);
      }
    } else if (type === "ranking") {
      if (!key) continue;
      checked++;
      if (sets.rankingGone.has(key)) {
        broken++;
        blockers.push(`リンク切れ (410 Gone): ${link.href} — GONE_RANKING_KEYS 掲載 (${where})`);
      } else if (sets.rankingKnown.size && !sets.rankingKnown.has(key)) {
        broken++;
        blockers.push(
          `リンク切れ (soft 404): ${link.href} — 実在しない ranking key。HTTP 200 で「ランキングが見つかりません」が返る (${where})`,
        );
      }
    } else if (type === "blog") {
      if (!key) continue;
      checked++;
      if (sets.blogGone.has(key)) {
        broken++;
        blockers.push(`リンク切れ (410 Gone): ${link.href} — GONE_BLOG_SLUGS 掲載 (${where})`);
      } else if (blogSlugs && !blogSlugs.has(key) && !sets.blogRedirects.has(key)) {
        broken++;
        blockers.push(
          `リンク切れ: ${link.href} — 公開記事に存在しない (未公開 published:false / 削除済み)。HTTP 200 で「記事が見つかりません」が返る (${where})`,
        );
      }
    } else if (type === "category") {
      if (!key) continue;
      checked++;
      if (sets.categories.size && !sets.categories.has(key)) {
        broken++;
        blockers.push(`リンク切れ: ${link.href} — CATEGORY_KEYS 17 軸に存在しない (${where})`);
      }
    } else if (type === "areas") {
      if (!key) continue;
      checked++;
      if (!sets.areaCodes.has(key)) {
        broken++;
        blockers.push(`リンク切れ: ${link.href} — 都道府県コード (01000-47000) ではない (${where})`);
      }
    } else if (type === "themes") {
      if (!key) continue;
      checked++;
      if (sets.themes.size && !sets.themes.has(key)) {
        broken++;
        blockers.push(`リンク切れ (410 Gone): ${link.href} — 実在しないテーマ slug (${where})`);
      }
    }
    // blog 記事の実在 / tag / survey は audit-internal-links.mjs (ネットワーク) が担当
  }

  return {
    blockers,
    warnings,
    stats: {
      internalLinksTotal: links.length,
      internalLinksUnique: seen.size,
      internalLinksChecked: checked,
      internalLinksBroken: broken,
    },
  };
}
