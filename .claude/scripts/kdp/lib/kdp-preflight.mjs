/** KDP preflight: deterministic metadata checks plus a fresh bookshelf capacity snapshot. */
import { normalizeKdpStatus } from "./kdp-status.mjs";
import { sleep } from "./kdp-session.mjs";

const BOOKSHELF = "https://kdp.amazon.co.jp/ja_JP/bookshelf";
export const KDP_ACTIVE_TITLE_LIMIT = 10;
const ASIN = /^B0[A-Z0-9]{8}$/;
const KATAKANA = /^[ァ-ヴー\s]+$/;
const ROMAJI = /^[A-Za-z0-9 -]+$/;

export function validateKdpListingMetadata(id, listing) {
  const errors = [];
  const warnings = [];
  const need = (condition, message) => {
    if (!condition) errors.push(message);
  };
  need(listing?.id === id, `id 不一致 (${listing?.id ?? "なし"})`);
  need(Boolean(listing?.title?.trim()), "タイトルが空");
  need(Boolean(listing?.titleKana?.trim()) && KATAKANA.test(listing.titleKana), "タイトルのフリガナが空または全角カタカナ以外");
  need(Boolean(listing?.titleRomaji?.trim()) && ROMAJI.test(listing.titleRomaji), "タイトルのローマ字が空または許可文字以外");
  if (listing?.subtitle) {
    need(Boolean(listing.subtitleKana?.trim()) && KATAKANA.test(listing.subtitleKana), "サブタイトルのフリガナが不正");
    need(Boolean(listing.subtitleRomaji?.trim()) && ROMAJI.test(listing.subtitleRomaji), "サブタイトルのローマ字が不正");
  } else {
    need(!listing?.subtitleKana && !listing?.subtitleRomaji, "サブタイトルなしなのに読みが残っている");
  }
  if (listing?.readingSourceTitle) {
    need(listing.readingSourceTitle === listing.title, `読みの対応タイトルが古い ("${listing.readingSourceTitle}" -> "${listing.title}")`);
    need((listing.readingSourceSubtitle ?? null) === (listing.subtitle ?? null), "読みの対応サブタイトルが古い");
  } else {
    warnings.push("readingSourceTitle がない旧台帳。次回の改訂提案生成で付与する");
  }
  need(Array.isArray(listing?.keywords) && listing.keywords.length >= 1 && listing.keywords.length <= 7, "キーワードは1〜7件");
  need(Array.isArray(listing?.categoryPaths) && listing.categoryPaths.length >= 1 && listing.categoryPaths.length <= 3, "カテゴリは1〜3枠");
  need(Number.isInteger(listing?.priceYen) && listing.priceYen > 0, "価格が正の整数でない");
  need(listing?.royaltyPlan === 35 || listing?.royaltyPlan === 70, "ロイヤリティは35または70");
  if (listing?.royaltyPlan === 70) need(listing.priceYen >= 250 && listing.priceYen <= 1250, "70%ロイヤリティの価格帯外");

  const previous = Array.isArray(listing?.previousEditions) ? listing.previousEditions : [];
  if (listing?.editionNumber != null || listing?.replacesAsin || previous.length) {
    need(Number.isInteger(listing?.editionNumber) && listing.editionNumber >= 2, "新版は版番号2以上が必須");
    need(ASIN.test(listing?.replacesAsin ?? ""), "新版の replacesAsin が不正");
    const predecessor = previous.find((edition) => edition?.asin === listing?.replacesAsin);
    need(Boolean(predecessor), "replacesAsin と previousEditions が対応しない");
    if (predecessor) {
      const disclaimer = `Previously published as ${predecessor.title} by ${predecessor.author}.`;
      need(String(listing?.description ?? "").startsWith(disclaimer), "旧版刊行情報の免責文が説明冒頭にない");
      warnings.push(
        predecessor.title === listing.title
          ? `旧版と同題 (版番号で区別): ${listing.title}`
          : `改題: ${predecessor.title} -> ${listing.title}`,
      );
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function evaluateKdpCreationCapacity(rows, listings, targetIds, maxActive = KDP_ACTIVE_TITLE_LIMIT) {
  const unknown = rows.filter((row) => row.kdpStatus === "unknown");
  const remoteActive = rows.filter((row) => row.kdpStatus === "draft" || row.kdpStatus === "in_review").length;
  const remotelyObservedIds = new Set(rows.map((row) => row.draftId).filter(Boolean));
  const trackedActiveListings = Object.values(listings).filter(
    (listing) =>
      listing?.draftId &&
      listing?.status !== "withdrawn" &&
      !String(listing?.status ?? "").startsWith("blocked-") &&
      (listing?.kdpStatus === "draft" || listing?.kdpStatus === "in_review"),
  );
  const trackedActive = trackedActiveListings.length;
  const unobservedTrackedActive = trackedActiveListings.filter((listing) => !remotelyObservedIds.has(listing.draftId)).length;
  const newTargets = targetIds.filter((id) => !listings[id]?.draftId).length;
  // 本棚に見えた行は最新statusを優先する。台帳がin_reviewでも本棚がliveなら二重加算しない。
  // 一方、本棚に行自体が見えない既知の未公開はページング漏れの可能性があるため保守的に加算する。
  const observedActive = remoteActive + unobservedTrackedActive;
  const projectedActive = observedActive + newTargets;
  const errors = [];
  if (!rows.length) errors.push("本棚の行を1件も読めず、作成枠を確認できない");
  if (unknown.length) errors.push(`状態不明の本棚行 ${unknown.length} 件`);
  if (unobservedTrackedActive) {
    errors.push(`台帳で未公開の ${unobservedTrackedActive} 件が本棚snapshotに見つからない。ページングまたは同期状態を確認する`);
  }
  if (projectedActive > maxActive) {
    errors.push(`未公開タイトル見込み ${projectedActive} 件が安全上限 ${maxActive} 件を超える`);
  }
  return { ok: errors.length === 0, errors, remoteActive, trackedActive, unobservedTrackedActive, newTargets, projectedActive, maxActive };
}

export async function readBookshelfInventory(page) {
  await page.goto(BOOKSHELF, { waitUntil: "domcontentloaded", timeout: 60000 });
  try { await page.waitForLoadState("networkidle", { timeout: 20000 }); } catch {}
  await sleep(8000);
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await sleep(1000);
  }
  const rows = await page.evaluate(() => {
    const STATUS = /変更内容をレビュー中|変更のレビュー中|出版準備中|公開準備中|レビュー中|審査中|処理中|販売中|出版済み|ライブ|下書き/;
    const byId = new Map();
    for (const link of document.querySelectorAll('a[href*="/title-setup/kindle/"]')) {
      const match = /\/title-setup\/kindle\/([A-Z0-9]{8,})\//.exec(link.getAttribute("href") || "");
      if (!match || byId.has(match[1])) continue;
      let row = link;
      for (let depth = 0; depth < 14 && row?.parentElement; depth++) {
        if (STATUS.test(row.innerText || "")) break;
        row = row.parentElement;
      }
      const text = (row?.innerText || "").trim();
      const statusLabel = (text.match(STATUS) || [])[0] || "不明";
      byId.set(match[1], {
        draftId: match[1],
        statusLabel,
        asin: (text.match(/\bB0[A-Z0-9]{8}\b/) || [])[0] || "",
        title: text.split("\n").find((line) => line.trim())?.trim().slice(0, 100) || "",
      });
    }
    return [...byId.values()];
  });
  return rows.map((row) => ({ ...row, kdpStatus: normalizeKdpStatus(row.statusLabel) }));
}

export async function runKdpPreflight(page, listings, targetIds, { tag = "[preflight]", maxActive = KDP_ACTIVE_TITLE_LIMIT } = {}) {
  const metadataErrors = [];
  for (const id of targetIds) {
    const result = validateKdpListingMetadata(id, listings[id]);
    result.warnings.forEach((warning) => console.log(`${tag} ${id}: ${warning}`));
    result.errors.forEach((error) => metadataErrors.push(`${id}: ${error}`));
  }
  if (metadataErrors.length) return { ok: false, errors: metadataErrors };
  const rows = await readBookshelfInventory(page);
  const capacity = evaluateKdpCreationCapacity(rows, listings, targetIds, maxActive);
  console.log(
    `${tag} 本棚実測 未公開=${capacity.remoteActive} / 台帳=${capacity.trackedActive} / 新規=${capacity.newTargets} / 見込み=${capacity.projectedActive}/${capacity.maxActive}`,
  );
  return { ...capacity, rows };
}
