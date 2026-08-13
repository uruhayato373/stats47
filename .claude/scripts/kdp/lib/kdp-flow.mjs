/**
 * kdp-flow.mjs — KDP 出品の**書籍単位フロー** (verify / ensure / publish)。
 *
 * kdp-publish.mjs (単発) と kdp-batch.mjs (全冊) の両方がここを呼ぶ。
 * フローを 2 箇所に持つとドリフトするので、判断はすべてこのファイルに置く。
 *
 * 設計原則 (2026-08-12〜13 の実測から):
 *   1. **判定は read-back** — 「押せた / setInputFiles できた」を成功にしない。
 *      画面の実状態 (aria-checked / input value / 文言の有無) で確定する。
 *   2. **冪等** — ensureDraft は verify で欠けた項目だけを埋める。既存の下書きを
 *      details から埋め直すと確定済みカテゴリが壊れるので、全部やり直さない。
 *   3. **公開の成功判定は本棚** — 公開ボタン後に本棚を開き直し、その本の status が
 *      「下書き」でなくなったことを確認して初めて公開成功とする。文言 grep
 *      (「出版」を含む等) はどのページでも真になるので使わない。
 */
import {
  goToNextKdpStep,
  fillKdpDetails,
  uploadKdpContent,
  setKdpPricing,
  saveDraft,
} from "./kdp-form.mjs";
import { writeBackDraftId, writeBackListing, shotPath, sleep } from "./kdp-session.mjs";

const BASE = "https://kdp.amazon.co.jp/ja_JP";

async function gotoStep(page, draftId, step) {
  await page.goto(`${BASE}/title-setup/kindle/${draftId}/${step}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 20000 });
  } catch {}
  await sleep(6000);
}

/**
 * 下書きの実状態を read-back する (書き込みなし)。
 *
 * 返り値の各フラグは「KDP の画面がそう言っている」ことだけを意味する。
 * ここが公開前の機械ゲート — 全フラグ true でなければ公開しない。
 */
export async function verifyDraft(page, lst, { tag = "[verify]" } = {}) {
  const r = {
    title: false,
    categories: false,
    manuscript: false,
    cover: false,
    drm: false,
    ai: false,
    price: false,
    royalty: false,
    problems: [],
  };
  if (!lst.draftId) {
    r.problems.push("draftId なし (下書き未作成)");
    return r;
  }

  // ── details ──
  await gotoStep(page, lst.draftId, "details");
  const d = await page.evaluate(() => {
    const title = document.querySelector("#data-title")?.value || "";
    const catBtn = (document.querySelector("#categories-modal-button")?.innerText || "").trim();
    // 保存済みの掲載場所は details ページに「Kindle 本 › … › <場所>」のパンくずで並ぶ。
    const crumbs = (document.body?.innerText || "").match(/Kindle 本 › [^\n]+/g) || [];
    return { title, catBtn, crumbs: crumbs.length };
  });
  r.title = d.title.trim() === lst.title.trim();
  if (!r.title) r.problems.push(`タイトル不一致 (画面 "${d.title.slice(0, 30)}…")`);
  // ★「保存されている」だけでは足りない。K-S1-05 は同名衝突で 3 枠中 2 枠しか入らないまま
  //   ボタン表示だけ変わり、旧判定 (ボタン文言) を素通りした。**枠数まで一致**を要求する。
  const expected = (lst.categoryPaths ?? []).length || 1;
  r.categories = d.crumbs >= expected;
  if (!r.categories)
    r.problems.push(`カテゴリ枠不足 (画面 ${d.crumbs} / 期待 ${expected}${d.catBtn === "カテゴリーを選択" ? "・未保存" : ""})`);

  // ── content ──
  await gotoStep(page, lst.draftId, "content");
  // 原稿の処理が走っている間は判定できないので完了を待つ。
  await page
    .locator("text=/原稿チェックが完了しました|ファイルの処理が完了しました/")
    .first()
    .waitFor({ state: "visible", timeout: 240000 })
    .catch(() => {});
  await sleep(3000);
  const c = await page.evaluate(() => {
    const body = document.body?.innerText || "";
    const drm = [...document.querySelectorAll('input[type="radio"][name="data[is_drm]-radio"]')].find((e) => e.checked)?.value;
    const aiSel = (id) => {
      const e = document.getElementById(id);
      return e ? (e.options[e.selectedIndex]?.text || "").trim() : null;
    };
    return {
      manuscriptDone: /原稿チェックが完了しました|ファイルの処理が完了しました/.test(body),
      coverEmpty: /表紙がアップロードされていません/.test(body),
      drm,
      aiText: aiSel("generative-ai-questionnaire-text"),
      aiImages: aiSel("generative-ai-questionnaire-images"),
      aiTranslations: aiSel("generative-ai-questionnaire-translations"),
    };
  });
  r.manuscript = c.manuscriptDone;
  if (!r.manuscript) r.problems.push("原稿 (EPUB) 未処理");
  r.cover = !c.coverEmpty;
  if (!r.cover) r.problems.push("表紙 未アップロード");
  r.drm = c.drm === String(lst.applyDrm !== false);
  if (!r.drm) r.problems.push(`DRM 不一致 (画面 ${c.drm ?? "未選択"})`);
  // ★AI 開示も verify する (2026-08-13 の盲点から)。K-S1-05 は AI 開示だけ未保存のまま
  //   原稿/表紙/DRM が揃っていたため補修パスが content を素通りし、公開時に
  //   「AI ツールを使用したかどうかを指定します」で止まった。申告の 3 select の
  //   保存値を SSOT と突き合わせる (未使用申告の本は「なし」相当の非表示が正)。
  if (lst.aiDisclosure?.used) {
    r.ai =
      c.aiText === lst.aiDisclosure.text &&
      c.aiImages === lst.aiDisclosure.images &&
      c.aiTranslations === lst.aiDisclosure.translations;
    if (!r.ai)
      r.problems.push(
        `AI 開示不一致 (画面 text="${c.aiText ?? "未設定"}" images="${c.aiImages ?? "未設定"}")`,
      );
  } else {
    r.ai = true; // AI 不使用の申告は「はい」側の質問票が出ないのが正
  }

  // ── pricing ──
  await gotoStep(page, lst.draftId, "pricing");
  const p = await page.evaluate(() => {
    const jp = document.querySelector('input[name="data[digital][channels][amazon][JP][price_vat_inclusive]"]');
    const roy = [...document.querySelectorAll('input[type="radio"][name="data[digital][royalty_rate]-radio"]')].find((e) => e.checked)?.value;
    return { price: (jp?.value || "").replace(/[^0-9]/g, ""), roy };
  });
  r.price = p.price === String(lst.priceYen);
  if (!r.price) r.problems.push(`価格不一致 (画面 "${p.price}" / 期待 ${lst.priceYen})`);
  r.royalty = p.roy === (lst.royaltyPlan === 70 ? "70_PERCENT" : "35_PERCENT");
  if (!r.royalty) r.problems.push(`ロイヤリティ不一致 (画面 ${p.roy ?? "未選択"})`);

  r.ok = r.title && r.categories && r.manuscript && r.cover && r.drm && r.ai && r.price && r.royalty;
  return r;
}

/**
 * 下書きを完成させる (冪等)。
 *
 * - draftId 無し → new/details からフル充填。
 * - draftId あり → verify して**欠けたステップだけ**やり直す。
 */
export async function ensureDraft(page, id, lst, { epubAbs, coverAbs, tag = "[kdp]", log = console.log } = {}) {
  const warnings = [];

  const runDetails = async () => {
    const f = await fillKdpDetails(page, lst, { tag });
    f.log.forEach((l) => log("   ", l));
    warnings.push(...f.warnings);
    const step = await goToNextKdpStep(page, "content", { tag });
    if (!step.ok) {
      warnings.push(`content へ進めず: ${(step.errors || []).join(" / ") || step.reason}`);
      return false;
    }
    return true;
  };

  const runContent = async () => {
    const u = await uploadKdpContent(page, {
      epubAbs,
      coverAbs,
      applyDrm: lst.applyDrm !== false,
      ai: lst.aiDisclosure ?? null,
      tag,
    });
    u.log.forEach((l) => log("   ", l));
    warnings.push(...u.warnings);
    const step = await goToNextKdpStep(page, "pricing", { tag });
    if (!step.ok) {
      warnings.push(`pricing へ進めず: ${(step.errors || []).join(" / ") || step.reason}`);
      return false;
    }
    return true;
  };

  const runPricing = async () => {
    const pr = await setKdpPricing(page, lst, { tag });
    pr.log.forEach((l) => log("   ", l));
    warnings.push(...pr.warnings);
    await saveDraft(page, { tag });
    return true;
  };

  if (!lst.draftId) {
    // 新規: details → content → pricing を通しで。
    await page.goto(`${BASE}/title-setup/kindle/new/details`, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 20000 });
    } catch {}
    await sleep(4000);
    if (await runDetails()) {
      await runContent();
      await runPricing();
    }
    // どこまで進んでも下書き ID は控える (次回この下書きを開くため)。
    const m = /\/title-setup\/kindle\/([A-Z0-9]{8,})\//.exec(page.url());
    if (m) {
      lst.draftId = m[1];
      writeBackDraftId(id, m[1]);
      log(`${tag} 下書き ID を記録: ${m[1]}`);
    } else {
      warnings.push("下書き ID を取得できず (URL が new のまま)");
    }
  } else {
    // 既存: verify → 欠けたステップだけ。
    const v = await verifyDraft(page, lst, { tag });
    if (v.ok) return { ok: true, warnings: [], already: true };
    log(`${tag} 既存下書きの欠け: ${v.problems.join(" / ")}`);
    if (!v.title || !v.categories) {
      await gotoStep(page, lst.draftId, "details");
      await runDetails();
    }
    if (!v.manuscript || !v.cover || !v.drm || !v.ai) {
      await gotoStep(page, lst.draftId, "content");
      await runContent();
    }
    if (!v.price || !v.royalty) {
      await gotoStep(page, lst.draftId, "pricing");
      await runPricing();
    }
  }

  // 最終判定は verify (read-back)。ensure 内の ✓ ログは参考でしかない。
  const final = await verifyDraft(page, lst, { tag });
  if (!final.ok) {
    // ★失敗の瞬間の画面を残す (バッチは警告を最後まで印字しないので、これが唯一の一次証拠)。
    await page.screenshot({ path: shotPath(`fail-${id}.png`), fullPage: true }).catch(() => {});
  }
  return { ok: final.ok, warnings: [...warnings, ...final.problems] };
}

/** 本棚からその本の行を読む (status 文言 + ASIN)。 */
export async function readBookshelfState(page, draftId) {
  await page.goto(`${BASE}/bookshelf`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 20000 });
  } catch {}
  await sleep(8000);
  return page.evaluate((id) => {
    const STATUS = /下書き|出版準備中|レビュー中|審査中|処理中|販売中|出版済み/;
    const link = document.querySelector(`a[href*="/title-setup/kindle/${id}/"]`);
    if (!link) return { found: false };
    // ★行コンテナは「status 文言が現れるまで」遡って決める (2026-08-13 の偽成功から)。
    //   リンク数で判定していた旧実装は status を含まない子要素で止まり、
    //   rowText が「¥800 JPY」だけになって isDraft=false → **下書きのままの本を
    //   「公開確定」と誤報した** (K-S1-05)。status が読めない行は不明として扱い、
    //   呼び出し側 (publishDraft) は成功と言わない。
    let row = link;
    for (let i = 0; i < 14 && row?.parentElement; i++) {
      if (STATUS.test(row.innerText || "")) break;
      row = row.parentElement;
    }
    const text = (row?.innerText || "").trim();
    const status = (text.match(STATUS) || [])[0] || "不明";
    return {
      found: true,
      statusKnown: status !== "不明",
      isDraft: status === "下書き",
      status,
      asin: (text.match(/\bB0[A-Z0-9]{8}\b/) || [])[0] || "",
      rowText: text.slice(0, 200),
    };
  }, draftId);
}

/**
 * 公開する (★outward-facing。呼び出し元がオーナー承認を確認してから呼ぶ)。
 *
 * 成功条件は「公開ボタンを押せた」ではなく **本棚でその本が下書きでなくなった**こと。
 */
export async function publishDraft(page, id, lst, { tag = "[publish]", log = console.log } = {}) {
  if (!lst.draftId) return { ok: false, reason: "draftId なし" };

  await gotoStep(page, lst.draftId, "pricing");
  // pricing に必須エラーが出ていないか先に見る (出ていれば押しても無駄)。
  const preErr = await page
    .evaluate(() =>
      [...document.querySelectorAll(".a-alert-error")]
        .filter((e) => e.offsetParent !== null)
        .map((e) => (e.innerText || "").trim())
        .filter(Boolean)
        .slice(0, 3),
    )
    .catch(() => []);
  if (preErr.length) return { ok: false, reason: `pricing にエラー: ${preErr.join(" / ")}` };

  const clicked = await page
    .locator("text=Kindle 本を出版")
    .first()
    .click({ timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!clicked) return { ok: false, reason: "「Kindle 本を出版」を押せず" };
  await sleep(8000);

  // 確認モーダルが出る場合は「出版」で確定 (実クリック。AUI は evaluate では効かない)。
  await page
    .locator('[role="dialog"]:visible, .a-popover-modal:visible')
    .locator("text=/^出版$|^公開$|^OK$/")
    .first()
    .click({ timeout : 10000 })
    .catch(() => {});
  await sleep(10000);
  await page.screenshot({ path: shotPath(`publish-${id}.png`), fullPage: true }).catch(() => {});

  // read-back: 本棚でその本が「下書き」でなくなったことを確認する。
  const shelf = await readBookshelfState(page, lst.draftId);
  if (!shelf.found) {
    // 公開処理で ID が変わる場合があるため、見つからない = 失敗とは断定できない。
    return { ok: false, reason: "本棚に draftId の行が見つからず (手動確認要)", shelf };
  }
  if (shelf.isDraft) {
    return { ok: false, reason: `本棚の status がまだ「下書き」(${shelf.status})`, shelf };
  }
  if (!shelf.statusKnown) {
    // ★status が読めない = 公開されたと言えない。「下書きではない」だけで成功にすると
    //   偽成功になる (K-S1-05 で実際に起きた)。
    return { ok: false, reason: "本棚の status を読めず (公開確定と言えない・手動確認要)", shelf };
  }
  // 公開が確定してから listings を listed に更新。ASIN は割当まで空のことがある。
  writeBackListing(id, shelf.asin || null);
  log(`${tag} ✅ 公開確定 (本棚 status=${shelf.status}${shelf.asin ? ` / asin=${shelf.asin}` : " / ASIN 割当待ち"})`);
  return { ok: true, status: shelf.status, asin: shelf.asin };
}
