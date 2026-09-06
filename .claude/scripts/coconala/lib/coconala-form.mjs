/**
 * coconala-form.mjs — サービス内容編集フォーム（/mypage/services/{id}）の充填ロジック
 * ---------------------------------------------------------------------------
 * publish（新規）/ edit（既存）の両方が使う。フォームは server-rendered（CakePHP 型
 * name=data[Service][...]・id=#Service*）で selector が安定。2026-07-18 実機確定。
 *
 * フィールド対応（実機ディスカバリ）:
 *   #ServiceOverview          サービスタイトル（text・max255）        ← catalog.title
 *   #ServiceCatchphrase       キャッチコピー（text・max255）          ← listings.catchphrase
 *   #ServiceCategory          大カテゴリ（select・value）             ← listings.category.master
 *   #ServiceSubCategory       サブカテゴリ（select・value・cascading） ← listings.category.sub
 *   #ServiceMasterCategoryTypeId カテゴリタイプ（select・任意）        ← listings.category.type
 *   provision_format radio    提供形式（1=テキスト完結/2=制作物/3=PDF）← listings.provisionFormat
 *   #ServiceHead              サービス内容 本文（textarea・max1000）   ← listings.body
 *   #ServiceBody              購入にあたってのお願い（textarea・max500）← listings.purchaseNote
 *   #ServicePrice             価格（select・option text "N,NNN円"）    ← catalog.priceYen
 *   #ServiceDeliveryTime      お届け日数（text・max2）                ← listings.deliveryDays
 * 送信ボタン: 「下書きで保存」/「公開する」（ともに button.submitButton[type=submit]）
 * ---------------------------------------------------------------------------
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 促進モーダル（c-serviceDialog / tw-z-modal）が被さっていたら閉じる */
export async function dismissModal(page) {
  for (let i = 0; i < 3; i++) {
    const hasModal = await page.evaluate(() => !!document.querySelector('[class*="serviceDialog"], .tw-z-modal'));
    if (!hasModal) return;
    const close = page.getByRole('button', { name: '閉じる' });
    if (await close.count()) { try { await close.first().click({ timeout: 4000 }); } catch {} }
    await sleep(500);
    await page.keyboard.press('Escape'); await sleep(500);
  }
}

// ココナラの検証は jQuery で keyup/change/blur を監視する。Playwright の fill() は input しか
// 発火せず chkrequired の内部状態が更新されない（＝値は見えるのに「記入エラー」で保存拒否）。
// fill 後に keyup/change/blur を明示 dispatch して検証状態を確定させる。
async function fireValidation(page, sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return;
    el.focus();
    for (const t of ['input', 'keyup', 'change', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
  }, sel);
}

async function fillIfPresent(page, sel, value, { tag, label }) {
  if (value == null || value === '') return `${label}: (空・skip)`;
  const el = page.locator(sel).first();
  if (!(await el.count())) return `${label}: selector 不在(${sel})`;
  await el.click();
  await el.fill(String(value));
  await fireValidation(page, sel);
  return `${label}: set (${String(value).length}字)`;
}

/**
 * フォームを充填する。fields のうち渡されたものだけ埋める（edit の部分更新に対応）。
 * @returns {Promise<{log:string[], warnings:string[]}>}
 */
export async function fillServiceForm(page, fields, { tag = '[form]' } = {}) {
  const log = [];
  const warn = [];
  await dismissModal(page);

  // タイトル: ココナラのサービスタイトル欄は末尾「ます」が固定サフィックスで自動付与される
  // （「※『ます』は必須のため削除できません」）。カタログの「〜します」をそのまま入れると
  // 公開表示が「〜しますます」と二重になるため、末尾の「ます」を1つ剥がして入れる。
  if (fields.title !== undefined) {
    const titleForForm = String(fields.title).replace(/ます$/, '');
    // ★タイトルは表示 25 字以内 (末尾自動付与の「ます」2 字を含む)。超過は記入エラーで保存拒否。
    const displayedLen = [...titleForForm].length + 2;
    if (displayedLen > 25) warn.push(`title が25字超（表示${displayedLen}字）＝記入エラーで保存拒否。25字以内(末尾「ます」込)に短縮を`);
    log.push(await fillIfPresent(page, '#ServiceOverview', titleForForm, { tag, label: 'title(末尾ます剥がし)' }));
  }
  if (fields.catchphrase !== undefined) {
    const clen = [...String(fields.catchphrase || '')].length;
    if (fields.catchphrase && (clen < 15 || clen > 30)) warn.push(`catchphrase が15〜30字の範囲外（${clen}字）＝公開時に記入エラーになる`);
    log.push(await fillIfPresent(page, '#ServiceCatchphrase', fields.catchphrase, { tag, label: 'catchphrase' }));
  }

  // カテゴリ（cascading）: master → sub → type
  if (fields.category) {
    const { master, sub, type } = fields.category;
    try {
      if (master) { await page.selectOption('#ServiceCategory', String(master)); await fireValidation(page, '#ServiceCategory'); await sleep(2500); log.push(`category.master=${master}`); }
      if (sub) { await page.selectOption('#ServiceSubCategory', String(sub)); await fireValidation(page, '#ServiceSubCategory'); await sleep(2000); log.push(`category.sub=${sub}`); }
      if (type) {
        const hasType = await page.evaluate(() => {
          const el = document.querySelector('#ServiceMasterCategoryTypeId');
          return el ? Array.from(el.options).some((o) => o.value) : false;
        });
        if (hasType) { await page.selectOption('#ServiceMasterCategoryTypeId', String(type)); await fireValidation(page, '#ServiceMasterCategoryTypeId'); await sleep(1200); log.push(`category.type=${type}`); }
        else warn.push('category.type の選択肢が populate されていない（sub 選択後の AJAX 待ち不足？）');
      }
    } catch (e) { warn.push(`category select 失敗: ${e.message.split('\n')[0]}`); }
  }

  // ジャンル（facet チェックボックス・※必須）: data[facets][NN][] の value を1つ以上チェック
  if (fields.genreFacets && fields.genreFacets.length) {
    const checked = await page.evaluate((vals) => {
      const boxes = Array.from(document.querySelectorAll('input[type=checkbox][name^="data[facets]"]'));
      let n = 0;
      for (const b of boxes) {
        if (vals.map(String).includes(String(b.value))) {
          if (!b.checked) {
            const lbl = b.closest('label') || document.querySelector(`label[for="${b.id}"]`);
            (lbl || b).click();
            if (!b.checked) { b.checked = true; }
          }
          for (const t of ['input', 'change', 'blur']) b.dispatchEvent(new Event(t, { bubbles: true }));
          n++;
        }
      }
      return n;
    }, fields.genreFacets);
    log.push(`genreFacets: ${checked}/${fields.genreFacets.length} チェック`);
    if (!checked) warn.push('ジャンル facet の該当 value が見つからない（categoryType 依存で option が変わる）');
    await sleep(500);
  }

  // カテゴリによって提供形式のsection自体が非表示。隠れたradioを書き換えて成功扱いしない。
  if (fields.provisionFormat) {
    const v = String(fields.provisionFormat);
    const label = page.locator(`label[for="ServiceProvisionFormat${v}"]`);
    const visible = await label.isVisible();
    if (!(await label.count())) {
      warn.push('provision_format selector 不在（UI変更を確認する）');
    } else if (!visible) {
      log.push('provisionFormat: category-inactive (非表示のため変更しない)');
    } else {
      let checked = false;
      for (let attempt = 0; attempt < 3 && !checked; attempt++) {
        await label.click();
        await sleep(900);
        for (const name of ['変更する', 'はい', 'OK', '変更', '続ける']) {
          const b = page.getByRole('button', { name, exact: true });
          if (await b.count()) { try { await b.first().click({ timeout: 3000 }); } catch {} await sleep(700); break; }
        }
        checked = await page.evaluate((val) => {
          const r = document.querySelector(`input[name="data[Service][provision_format]"][value="${val}"]`);
          return !!(r && r.checked);
        }, v);
      }
      log.push(checked ? `provisionFormat=${v} (checked 保持確認)` : `provisionFormat=${v} 未確定`);
      if (!checked) warn.push('provision_format が保持されない（確認モーダル/カテゴリ依存の可能性）');
      await sleep(500);
    }
  }

  if (fields.body !== undefined) {
    if (fields.body && [...String(fields.body)].length > 1000) warn.push(`body が1000字超（${[...String(fields.body)].length}）→ 末尾が切れる可能性`);
    log.push(await fillIfPresent(page, '#ServiceHead', fields.body, { tag, label: 'body(内容)' }));
  }
  if (fields.purchaseNote !== undefined) {
    if (fields.purchaseNote && [...String(fields.purchaseNote)].length > 500) warn.push(`purchaseNote が500字超（${[...String(fields.purchaseNote)].length}）`);
    log.push(await fillIfPresent(page, '#ServiceBody', fields.purchaseNote, { tag, label: 'お願い' }));
  }

  // 価格 select: ★ココナラは option の value が手数料込み (表示×1.1) で表示テキストとズレる
  //   (例: 表示 "3,000円" ⇔ value "3300")。よって value 一致・Playwright の label 一致では
  //   選べない (label 一致は実機で 30s タイムアウトした)。表示テキスト一致で in-page 選択する。
  if (fields.priceYen) {
    const priceText = `${Number(fields.priceYen).toLocaleString('en-US')}円`;
    const r = await page.evaluate((txt) => {
      const el = document.querySelector('#ServicePrice');
      if (!el || !el.options) return { ok: false, reason: 'no #ServicePrice' };
      const opt = Array.from(el.options).find((o) => (o.textContent || '').trim() === txt);
      if (!opt) return { ok: false, options: Array.from(el.options).map((o) => (o.textContent || '').trim()).filter(Boolean).slice(0, 40) };
      el.value = opt.value;
      for (const t of ['input', 'change', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
      return { ok: true, value: opt.value, text: (opt.textContent || '').trim() };
    }, priceText);
    if (r.ok) log.push(`price: "${priceText}" → value ${r.value}`);
    else warn.push(`価格 option 不一致（"${priceText}" が選択肢に無い${r.options ? ': ' + r.options.join(' / ') : ` (${r.reason})`}）`);
  }

  // 無料修正回数 (fix_limit) ※2026-10/11 刷新で公開時に必須化。select[name="data[Service][fix_limit]"]。
  //   値: -1=無料修正なし / 1=1回 / 2=2回 …。ready-made ファイル商品は既定 -1 (無料修正なし)。
  if (fields.fixLimit !== undefined && fields.fixLimit !== null && fields.fixLimit !== '') {
    const r = await page.evaluate((val) => {
      const el = document.querySelector('select[name="data[Service][fix_limit]"]');
      if (!el) return { ok: false, reason: 'no fix_limit select' };
      const opt = Array.from(el.options).find((o) => String(o.value) === String(val));
      if (!opt) return { ok: false, options: Array.from(el.options).map((o) => `${o.value}:${(o.textContent || '').trim()}`) };
      el.value = opt.value;
      for (const t of ['input', 'change', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
      return { ok: true, value: opt.value, text: (opt.textContent || '').trim() };
    }, fields.fixLimit);
    log.push(r.ok ? `fixLimit=${fields.fixLimit} (${r.text})` : `fixLimit 設定失敗: ${r.reason || (r.options || []).join(' / ')}`);
    if (!r.ok) warn.push('無料修正回数(fix_limit) 設定失敗');
  }

  if (fields.deliveryDays !== undefined) log.push(await fillIfPresent(page, '#ServiceDeliveryTime', fields.deliveryDays, { tag, label: '納期(日)' }));

  return { log, warnings: warn };
}

/**
 * 既存の商品画像をすべて削除する（差し替え用）。削除× を順にクリックし、確認ダイアログ/モーダルを承認。
 * @returns {Promise<number>} 削除後の残枚数
 */
export async function deleteExistingImages(page, { tag = '[img]' } = {}) {
  await dismissModal(page);
  const count = () => page.evaluate(() => document.querySelectorAll('a.js_delete-button, .delete-button').length);
  let remaining = await count();
  for (let i = 0; i < remaining + 3; i++) {
    const clicked = await page.evaluate(() => {
      const b = document.querySelector('a.js_delete-button, .delete-button');
      if (!b) return false;
      b.click();
      return true;
    });
    if (!clicked) break;
    await sleep(800);
    for (const name of ['削除する', '削除', 'はい', 'OK']) {
      const btn = page.getByRole('button', { name, exact: true });
      if (await btn.count()) { try { await btn.first().click({ timeout: 2500 }); } catch {} await sleep(500); break; }
    }
    const now = await count();
    if (now >= remaining) break; // 減らない=これ以上消せない
    remaining = now;
  }
  return remaining;
}

/**
 * 商品画像をアップロードする（トリミングモーダルなし＝直接スロットに入る・2026-07-18 実機確定）。
 * 「画像を追加」リンク（javascript:;）をクリックすると隠し file input が出現するので setInputFiles。
 * @param {object} opts.force 既に画像がある場合も追加する（既定は skip）
 * @param {object} opts.replace 既存画像を全削除してから新規アップロード（差し替え）
 * @returns {Promise<{ok:boolean, added:boolean, before:number, after:number, reason?:string}>}
 */
export async function uploadImage(page, imgPath, { tag = '[img]', force = false, replace = false } = {}) {
  await dismissModal(page);
  // アップロード済み画像枚数。プレビューは <img> でなく、populated スロットに
  // 削除× `a.js_delete-button`（.delete-button）が付く（2026-07-18 実機確定）。これを数える。
  const countImgs = () => page.evaluate(() => document.querySelectorAll('a.js_delete-button, .delete-button').length);
  let before = await countImgs();
  if (replace && before > 0) {
    const left = await deleteExistingImages(page, { tag });
    // 差し替えなのに旧画像が消えなければ、新規は追加せず失敗を返す（第2画像化を防ぐ）
    if (left > 0) return { ok: false, added: false, before, after: left, reason: `既存画像 ${left} 枚を削除できず（差し替え中断）` };
    before = await countImgs();
  }
  if (before > 0 && !force && !replace) {
    return { ok: true, added: false, before, after: before, reason: `既に画像 ${before} 枚あり（追加は --force-image / 差し替えは --replace-image）` };
  }
  const addLink = page.getByText('画像を追加', { exact: false });
  if (!(await addLink.count())) return { ok: false, added: false, before, after: before, reason: '「画像を追加」未検出' };
  await addLink.first().click().catch(() => {});
  await sleep(1200);
  const input = page.locator('input[type=file][accept*="image"]').first();
  if (!(await input.count())) return { ok: false, added: false, before, after: before, reason: 'file input が出現しない' };
  await input.setInputFiles(imgPath);
  // アップロード（AJAX）完了待ち: 画像枚数が増えるまで poll
  let after = before;
  for (let i = 0; i < 12; i++) { await sleep(1500); after = await countImgs(); if (after > before) break; }
  return { ok: after > before, added: after > before, before, after, reason: after > before ? undefined : 'アップロード後も画像枚数が増えない' };
}

/**
 * 送信。commit=false → 「下書きで保存」、commit=true → 「公開する」。
 * ボタンはともに button.submitButton[type=submit]。テキストで判別する。
 * @returns {Promise<{ok:boolean, action:string, url:string, reason?:string}>}
 */
export async function submitForm(page, { commit = false, tag = '[form]' } = {}) {
  // 新規下書き→公開は「公開する」、既に公開中サービスの更新は「更新する/サービスを更新」。
  const candidates = commit ? ['公開する', '更新する', 'サービスを更新', '変更を保存'] : ['下書きで保存'];
  let name = null, btn = null;
  for (const c of candidates) {
    const b = page.getByRole('button', { name: c, exact: true });
    if (await b.count()) { name = c; btn = b; break; }
  }
  if (!btn) {
    return { ok: false, action: candidates[0], url: page.url(), reason: `送信ボタン未検出（候補: ${candidates.join('/')}）` };
  }
  await btn.first().click();
  await sleep(4000);
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch {}
  await sleep(1500);
  // バリデーションエラーの検出（chkrequired 未入力等）。どの項目でエラーかを field ヒント付きで返す。
  const err = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.error, .errPos, [class*="errorText"], [class*="c-error"], .is-error, [class*="errorMessage"], [class*="ErrorText"]'));
    const seen = new Set();
    const out = [];
    for (const n of nodes) {
      const msg = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (!msg || seen.has(msg)) continue;
      seen.add(msg);
      // 近傍のフィールドヒント: 祖先を辿って label / 入力 id / セクション見出しを拾う
      let hint = '';
      let el = n;
      for (let i = 0; i < 6 && el; i++) {
        const lbl = el.querySelector?.('label') || (el.previousElementSibling?.tagName === 'LABEL' ? el.previousElementSibling : null);
        const fld = el.querySelector?.('input,select,textarea');
        const head = el.querySelector?.('h2,h3,legend,[class*="ttl"],[class*="Title"],[class*="label"]');
        if (lbl?.textContent?.trim()) { hint = lbl.textContent.trim().slice(0, 24); break; }
        if (head?.textContent?.trim()) { hint = head.textContent.trim().slice(0, 24); break; }
        if (fld?.id || fld?.name) { hint = fld.id || fld.name; break; }
        el = el.parentElement;
      }
      out.push(hint ? `[${hint}] ${msg}` : msg);
    }
    return out.slice(0, 12);
  });
  // 併せて、赤枠/エラー属性の付いた入力欄の id/name も列挙 (どの欄が未充足か)
  const badFields = await page.evaluate(() => {
    const bad = Array.from(document.querySelectorAll('.error input, .error select, .error textarea, input.error, select.error, textarea.error, [aria-invalid="true"], .is-error input, .is-error select, .is-error textarea'));
    return [...new Set(bad.map((f) => f.id || f.name || f.tagName).filter(Boolean))].slice(0, 12);
  });
  return { ok: err.length === 0, action: name, url: page.url(), errors: err, badFields };
}
