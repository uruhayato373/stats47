/**
 * 直接配置 (direct-attribute) アフィリエイトの決定的 compliance 検証コア。
 *
 * 純粋関数のみ (I/O なし)。CLI (.claude/scripts/ads/audit-affiliate-compliance.ts) が
 * SSOT (apps/web/scripts/affiliate-direct-placements-data.ts) と記事本文 (R2) を渡す。
 * テスト: .claude/scripts/ads/__tests__/affiliate-compliance-core.test.mjs (node --test)。
 *
 * 検証対象 (docs/02_実装計画/25_アフィリエイト運用SSOT移行仕様.md §6.1):
 *   - 構造: ID 重複 / URL scheme / 画像サイズ / placements 形式 / addedAt 形式
 *   - 本文: 配置先 slug の存在 / 本文内タグとの双方向一致 / PR 表記 (景表法)
 */

export const VALID_ASPS = ["a8", "moshimo", "rakuten", "valuecommerce"];
export const VALID_CHANNELS = ["blog", "note"];

/**
 * PR 表記 (景表法 2023-10) の判定パターン。正典: .claude/rules/affiliate-ads-standards.md。
 * blog: 記事冒頭の PR 宣言 + リンク直前の「※PR」の両方を要求。
 * note: いずれか 1 つ (ハッシュタグ #PR/#広告 or 本文表記) を要求。
 */
export const DISCLOSURE_RULES = {
  blog: {
    headDeclaration: /PR（アフィリエイト|PR\(アフィリエイト|記事には\s*PR/,
    inlinePrefix: /※PR/,
  },
  note: {
    any: [/#PR\b/, /#広告/, /※PR/, /PR（アフィリエイト/],
  },
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpsUrl(value) {
  return typeof value === "string" && /^https:\/\/\S+$/.test(value);
}

/**
 * 直接配置 SSOT の構造検証 (ネットワーク不要・決定的)。
 * @param {Array<object>} placements AffiliateDirectPlacement[]
 * @returns {Array<{severity:"error"|"warn", code:string, id:string, message:string}>}
 */
export function validateDirectPlacementsStructure(placements) {
  const issues = [];
  const push = (severity, code, id, message) => issues.push({ severity, code, id, message });

  if (!Array.isArray(placements)) {
    return [{ severity: "error", code: "not-array", id: "(root)", message: "placements 配列ではない" }];
  }

  const seenIds = new Set();
  for (const p of placements) {
    const id = typeof p?.id === "string" && p.id ? p.id : "(no-id)";
    if (id === "(no-id)") push("error", "id-missing", id, "id が空");
    if (seenIds.has(id)) push("error", "id-duplicate", id, "id が重複");
    seenIds.add(id);

    if (!VALID_ASPS.includes(p?.asp)) push("error", "asp-invalid", id, `asp が不正: ${p?.asp}`);
    if (!p?.title) push("error", "title-missing", id, "title が空");
    if (!isHttpsUrl(p?.href)) push("error", "href-scheme", id, `href が https:// でない: ${p?.href}`);
    if (!isHttpsUrl(p?.imageUrl)) push("error", "image-scheme", id, `imageUrl が https:// でない: ${p?.imageUrl}`);
    if (p?.trackingPixelUrl !== null && !isHttpsUrl(p?.trackingPixelUrl)) {
      push("error", "pixel-scheme", id, `trackingPixelUrl は https:// または null: ${p?.trackingPixelUrl}`);
    }
    if (!Number.isInteger(p?.width) || p.width <= 0 || !Number.isInteger(p?.height) || p.height <= 0) {
      push("error", "size-invalid", id, `width/height が正の整数でない: ${p?.width}x${p?.height}`);
    }
    if (typeof p?.addedAt !== "string" || !ISO_DATE.test(p.addedAt)) {
      push("error", "added-at-format", id, `addedAt が YYYY-MM-DD でない: ${p?.addedAt}`);
    }
    if (typeof p?.isActive !== "boolean") push("error", "is-active-type", id, "isActive が boolean でない");

    if (!Array.isArray(p?.placements) || p.placements.length === 0) {
      push("error", "placements-empty", id, "placements が空 (配置先のない台帳エントリは作らない)");
      continue;
    }
    const seenTargets = new Set();
    for (const t of p.placements) {
      if (!VALID_CHANNELS.includes(t?.channel)) {
        push("error", "channel-invalid", id, `channel が不正: ${t?.channel}`);
      }
      if (!t?.slug) push("error", "slug-missing", id, "placement.slug が空");
      if (!t?.position) push("error", "position-missing", id, `placement.position が空 (${t?.slug})`);
      const key = `${t?.channel}:${t?.slug}`;
      if (seenTargets.has(key)) push("error", "placement-duplicate", id, `配置先が重複: ${key}`);
      seenTargets.add(key);
    }
  }
  return issues;
}

/**
 * 本文との突合 (台帳 → 記事方向)。呼び元が取得した本文 Map を渡す (I/O は CLI 側)。
 * @param {Array<object>} placements AffiliateDirectPlacement[] (isActive のみ渡すのが通常)
 * @param {Map<string, {found: boolean, body?: string}>} contents key = `${channel}:${slug}`
 * @returns {{ total:number, orphaned:Array<object>, missingDisclosure:Array<object> }}
 */
export function auditPlacementsAgainstContent(placements, contents) {
  const orphaned = [];
  const missingDisclosure = [];

  for (const p of placements) {
    for (const t of p.placements ?? []) {
      const key = `${t.channel}:${t.slug}`;
      const content = contents.get(key);
      if (!content || !content.found) {
        orphaned.push({ id: p.id, target: key, reason: "article-not-found" });
        continue;
      }
      const body = content.body ?? "";
      if (!body.includes(p.href)) {
        orphaned.push({ id: p.id, target: key, reason: "tag-not-found-in-body" });
        continue;
      }
      const missing = missingDisclosureReasons(t.channel, body);
      if (missing.length > 0) {
        missingDisclosure.push({ id: p.id, target: key, missing });
      }
    }
  }
  return { total: placements.length, orphaned, missingDisclosure };
}

/** channel 別の PR 表記漏れ理由 (空配列 = OK)。 */
export function missingDisclosureReasons(channel, body) {
  if (channel === "blog") {
    const missing = [];
    if (!DISCLOSURE_RULES.blog.headDeclaration.test(body)) missing.push("head-pr-declaration");
    if (!DISCLOSURE_RULES.blog.inlinePrefix.test(body)) missing.push("inline-pr-prefix");
    return missing;
  }
  if (channel === "note") {
    return DISCLOSURE_RULES.note.any.some((re) => re.test(body)) ? [] : ["note-pr-hashtag-or-prefix"];
  }
  return [`unknown-channel:${channel}`];
}

/**
 * canonical banner サイズ (affiliate-ads-standards.md §3)。直接配置は記事文脈依存の
 * 一点物 (500×500 等) が既存に存在するため error でなく warn (段階移行の可視化のみ)。
 */
export const CANONICAL_SIZES = new Set(["300x250", "250x250", "320x100"]);

/** 直接配置の非 canonical サイズを warn として列挙する (決定的・error にしない)。 */
export function lintDirectPlacementSizes(placements) {
  const warns = [];
  for (const p of placements ?? []) {
    const size = `${p.width}x${p.height}`;
    if (!CANONICAL_SIZES.has(size)) warns.push({ id: p.id, size });
  }
  return warns;
}

// ★ `<affiliate-text>` も対象にする (2026-07-28)。本文インラインのテキストリンク広告タグで、
//   href 直書きなら直接配置扱い = 台帳登録が要る。タグ名をここに足さないと**監査を素通り**する。
//   なお index 属性だけの自動解決型 (`<affiliate-text index="0">`) は href を持たないため
//   下の findUnregisteredAffiliateTags が自然に無視する (直接配置ではないので登録不要)。
const AFFILIATE_BANNER_TAG = /<(?:affiliate-banner|affiliate-text)\b[^>]*>/g;
const HREF_ATTR = /href="([^"]+)"/;

/**
 * 記事 → 台帳方向: 本文内の <affiliate-banner> タグのうち、その slug の台帳に
 * 登録されていない href を返す (未登録の直接配置 = 台帳漏れ検出)。
 * @param {string} body 記事本文
 * @param {Set<string>} registeredHrefs その (channel, slug) に登録済みの href 集合
 * @returns {string[]} 未登録 href
 */
export function findUnregisteredAffiliateTags(body, registeredHrefs) {
  const unregistered = [];
  for (const tag of body.match(AFFILIATE_BANNER_TAG) ?? []) {
    const href = tag.match(HREF_ATTR)?.[1];
    if (href && !registeredHrefs.has(href)) unregistered.push(href);
  }
  return unregistered;
}
