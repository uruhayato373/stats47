/**
 * affiliate-status-core.mjs — 提携状態照合の**判定ロジック** (純関数)。
 * ---------------------------------------------------------------------------
 * ブラウザ I/O は affiliate-status.mjs / asp-browser.mjs が持ち、ここは
 * 「取れた文字列・配列からどう判定するか」だけを持つ (テスト可能にするため)。
 * 既存パターン: asp-browser-base.mjs の純関数層 / a8-scout-core.mjs と同型。
 *
 * 2026-08-04 の実機診断で見つかった 2 つの事故を、ここでコードとして固定する:
 *   1. **超集合**: もしもの一覧で ID をページ全体から拾い、一覧行の外にある
 *      ページ共通リンク (promotion_id=7630 / 7556 / 170) が混ざった。提携中 32 行に
 *      対し ID 35 件となり、うち 2 件を「台帳に無い実機の提携」と誤検出した。
 *   2. **名前欠落**: afb の 4 行ブロック (【PID:N】カテゴリ / 企業名 / プロモ名 / 報酬) の
 *      1 行目しか見ておらず、カタログの name が「【PID:N】カテゴリ名」になっていた。
 *      その結果 vertical を判定できないエントリが 12 件残った。
 *
 * 正典: .claude/rules/affiliate-ads-standards.md §11
 */

import { validateAffiliateEligibilitySchema } from "./affiliate-eligibility-core.mjs";

/** 広告意図軸 (affiliate-category.ts の AffiliateVertical と一致させる)。 */
export const AFFILIATE_VERTICALS = [
  "labor",
  "housing",
  "population",
  "economy",
  "health",
  "energy",
  "travel",
  "furusato",
  "education",
  "mobility",
];

/**
 * ID 抽出に使う selector を優先順で返す。
 *
 * ★ ページ全体 (`a[href]`) は **最後の手段**。一覧行の外にあるリンクを拾って超集合になる。
 *   config に listScopeSelector があればそれを最優先で使う (もしも = "table a[href]" が
 *   一覧行と完全一致することを実機で確認済み: 提携中 32 行 = ID 32 件)。
 */
export function buildIdScopes(asp) {
  return [
    ...(asp?.listScopeSelector ? [asp.listScopeSelector] : []),
    ...(asp?.rowSelector ? [`tr:has(${asp.rowSelector}) a[href]`] : []),
    "a[href]",
  ];
}

/** href 配列から ID を抽出する (出現順・重複排除)。 */
export function pickIds(hrefs, pattern) {
  const re = new RegExp(pattern, "g");
  const out = [];
  const seen = new Set();
  for (const h of hrefs ?? []) {
    for (const m of String(h ?? "").matchAll(re)) {
      if (m[1] && !seen.has(m[1])) {
        seen.add(m[1]);
        out.push(m[1]);
      }
    }
  }
  return out;
}

/**
 * 提携中と申請中の**両方**に現れる ID を返す。
 *
 * 1 つの案件が同時に「提携中」かつ「申請中」であることは論理的にありえないので、
 * 両方に出る ID は一覧項目ではなくページ共通リンク (バナー・おすすめ枠等) = 幻。
 * これが超集合の実体で、2026-08-04 に 7630 / 7556 / 170 の 3 件が該当した。
 */
export function detectPhantomIds(partneredIds, applyingIds) {
  const b = new Set(applyingIds ?? []);
  const out = [];
  for (const id of partneredIds ?? []) if (b.has(id)) out.push(id);
  return out;
}

/**
 * 一覧の実行数と抽出 ID 数が一致するかを検査する。
 *
 * 一致しなければスコープが一覧行に限定できていない (超集合) か、逆に取りこぼしている。
 * rowCount が取れない ASP (afb は rowSelector 未特定) は判定不能として null を返す。
 */
export function checkIdRowParity(rowCount, idCount) {
  if (rowCount === null || rowCount === undefined) return null;
  return { ok: rowCount === idCount, rowCount, idCount, diff: idCount - rowCount };
}

/**
 * 一覧の「名前セル」と「ID」を DOM 出現順の index で対応付ける。
 *
 * もしもの一覧は名前セルと促進リンクが**同じ <tr> に無い**ため行単位で組めない。
 * 件数が一致することと、カタログに既知の名前があるエントリで照合が通ることを
 * 確認できたときだけ対応表を返す (通らなければ null = 捏造しない)。
 *
 * 照合は緩い一致で判定する。実機の表示名には宣伝文が挿入され、台帳名が連続部分文字列に
 * ならないことがあるため (例 1223: 台帳「【スタディング STUDYing】オンライン資格講座」/
 * 実機「【スタディング STUDYing】累計合格者多数！スマホで学べる人気のオンライン資格講座」)。
 *
 * @param names 名前セルのテキスト (DOM 順)
 * @param ids   promotion_id (DOM 順・重複排除済み)
 * @param knownNames { [id]: 台帳の name } 検証用。空なら検証をスキップして対応表を返す
 */
export function zipNamesWithIds(names, ids, knownNames = {}) {
  if (!Array.isArray(names) || !Array.isArray(ids)) return null;
  if (names.length === 0 || names.length !== ids.length) return null;

  const map = {};
  for (let i = 0; i < ids.length; i++) map[ids[i]] = names[i];

  let checked = 0;
  let ok = 0;
  for (const [id, known] of Object.entries(knownNames)) {
    const got = map[id];
    if (!got || !known) continue;
    checked++;
    if (namesLikelySame(known, got)) ok++;
  }
  // 検証できた分が 1 件でも食い違えば index 対応は信用できない
  if (checked > 0 && ok !== checked) return null;
  return map;
}

/** 2 つの表示名が同一案件を指すか (6 文字以上の共通部分文字列を共有するか)。 */
export function namesLikelySame(a, b, min = 6) {
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  for (let i = 0; i + min <= a.length; i++) {
    for (let len = a.length - i; len >= min; len--) {
      if (b.includes(a.slice(i, i + len))) return true;
    }
  }
  return false;
}

/**
 * afb の一覧を 【PID:N】ブロック単位で解析する。
 *
 * 一覧は「【PID:N】カテゴリ / 企業名 / プロモーション名 / 報酬」の 4 行ブロック。
 * 行 grep だと 1 行目しか取れず、**プロモーション名が落ちる** (これがカタログの name が
 * 「【PID:14065】 専門転職（その他）」になっていた原因)。
 * 由来: afb-scan.mjs の同名ローカル関数を共有化 (2026-08-04)。
 */
export function parseAfbBlocks(body, pattern) {
  const lines = String(body ?? "")
    .split("\n")
    .map((l) => l.trim());
  const re = new RegExp(pattern);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) continue;
    const blk = lines.slice(i, i + 7);
    out.push({
      pid: m[1],
      category: (m[2] || "").trim(),
      advertiser: blk[1] || "",
      name: blk[2] || "",
      reward: (blk.find((l) => /円（税込）|％（税込）/.test(l)) || "").replace(/\s+/g, " ").trim(),
    });
  }
  return out;
}

/**
 * もしものプロモーション詳細ページから現在状態を読む。
 *
 * ナビにも「申請中」「提携中」が常時表示されるため、本文の正確な見出し
 * `プロモーション詳細` より後にある単独行だけを判定材料にする。
 * 状態が無い／複数ある場合は推測せず fail-closed にする。
 */
export function parseMoshimoDetailStatus(body, anchor = "プロモーション詳細") {
  const lines = String(body ?? "")
    .split("\n")
    .map((line) => line.trim());
  const anchorIndex = lines.findIndex((line) => line === anchor);
  if (anchorIndex < 0) {
    return { ok: false, status: "unknown", rawStatus: null, reason: `本文見出し「${anchor}」が無い` };
  }

  const statusMap = {
    提携中: "approved",
    申請中: "applying",
    未申請: "none",
    否認中: "none",
    "このプロモーションは終了しました。": "unavailable",
  };
  const candidates = [
    ...new Set(lines.slice(anchorIndex + 1).filter((line) => Object.hasOwn(statusMap, line))),
  ];
  if (candidates.length !== 1) {
    return {
      ok: false,
      status: "unknown",
      rawStatus: candidates.length === 0 ? null : candidates.join(" / "),
      reason: `本文状態が${candidates.length === 0 ? "無い" : "複数ある"}`,
    };
  }
  const rawStatus = candidates[0];
  return { ok: true, status: statusMap[rawStatus], rawStatus, reason: null };
}

/** 一覧不在でも、詳細で確定済みの負状態は再び review に戻さない。 */
export function shouldReviewAbsentStatus(status) {
  return !["none", "unavailable"].includes(status);
}

/** カタログの name が実質未補完か (null / 空 / 【PID:N】カテゴリ 形式)。 */
export function isPlaceholderName(name) {
  if (!name) return true;
  return /^【PID:\d+】/.test(String(name).trim());
}

/**
 * カタログのスキーマを検証する。構造違反は error、運用上の未整備は warn。
 *
 * error にするのは「壊れている」もの (状態語彙外・10 軸外の vertical・ID 欠落)。
 * name 未補完や vertical:null は実機を見ないと直せないため warn に留める
 * (実機照合前に落とすと status の実行自体ができなくなる)。
 */
export function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];
  const vocab = new Set(Object.keys(catalog?._statusVocab ?? {}));
  const verticals = new Set(AFFILIATE_VERTICALS);
  const programs = catalog?.programs ?? {};

  if (!catalog || typeof programs !== "object") {
    return { errors: ["programs が存在しない"], warnings: [] };
  }

  for (const [key, p] of Object.entries(programs)) {
    if (p?.vertical != null && !verticals.has(p.vertical)) {
      errors.push(`${key}: vertical "${p.vertical}" は 10 軸外`);
    }
    if (p?.eligibility != null) {
      for (const reason of validateAffiliateEligibilitySchema(p.eligibility)) {
        errors.push(`${key}: eligibility 構造違反 (${reason})`);
      }
    }
    const asps = p?.asps ?? {};
    if (Object.keys(asps).length === 0) errors.push(`${key}: asps が空`);
    for (const [aspName, entry] of Object.entries(asps)) {
      if (vocab.size > 0 && !vocab.has(entry?.status)) {
        errors.push(`${key}/${aspName}: status "${entry?.status}" は語彙外`);
      }
      const id = entry?.programId ?? entry?.promotionId ?? entry?.pid ?? null;
      if (!id) errors.push(`${key}/${aspName}: 識別子が無い`);
      if (id && !key.endsWith(String(id))) {
        warnings.push(`${key}/${aspName}: キーと識別子 ${id} が不一致`);
      }
      if (entry?.status === "approved") {
        if (isPlaceholderName(p?.name)) warnings.push(`${key}: name 未補完 (${p?.name ?? "null"})`);
        if (p?.vertical == null) warnings.push(`${key}: vertical 未設定`);
      }
    }
  }
  return { errors, warnings };
}
