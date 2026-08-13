/**
 * kdp-form.mjs — KDP 出品フォーム (3ステップ: Details → Content → Pricing) のベストエフォート充填。
 *
 * ★KDP は React SPA で DOM が変わりやすい。ここのセレクタは label/role ベースで堅牢化しているが、
 *   初回は kdp-publish.mjs --probe で構造を確認し、必要ならここを調整すること (coconala-form の discover 相当)。
 * ★各フィールドは try/catch で、見つからなければ warnings に積んで継続する (偽成功を防ぐ)。
 *   warnings が残るときは kdp-publish.mjs が公開を止める。
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * ★実測した id / name で入れる (2026-08-12 の --probe で確定)。
 *
 * 日本語版 KDP の入稿フォームは `<label>` が空で、`id="data-title"` /
 * `name="data[title]"` で要素を識別する。ラベル文字列で探す実装は**1 つも一致しない**。
 * ここを第一手段にし、`fillByLabel` は DOM が変わったときの保険として後ろに置く。
 */
async function fillById(page, id, value) {
  if (value === undefined || value === null || value === "") return true; // 空は入れない (成功扱い)
  for (const sel of [`#${id}`, `[name="${idToName(id)}"]`]) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded().catch(() => {});
        await loc.fill(String(value), { timeout: 8000 });
        return true;
      }
    } catch {}
  }
  return false;
}

/** `data-title-pronunciation` → `data[title_pronunciation]` (KDP の name 規約)。 */
function idToName(id) {
  const rest = id.replace(/^data-/, "").replace(/-/g, "_");
  // 著者は入れ子: data[primary_author][first_name]
  const m = /^primary_author_(.+)$/.exec(rest);
  return m ? `data[primary_author][${m[1]}]` : `data[${rest}]`;
}

/** label テキストで input/textarea を探して値を入れる。見つからなければ false。 */
async function fillByLabel(page, labelRe, value) {
  try {
    const loc = page.getByLabel(labelRe).first();
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await loc.fill(String(value), { timeout: 8000 });
      return true;
    }
  } catch {}
  // フォールバック: placeholder / 近傍 label のテキスト一致
  try {
    const ph = page.getByPlaceholder(labelRe).first();
    if (await ph.count()) { await ph.fill(String(value), { timeout: 8000 }); return true; }
  } catch {}
  return false;
}

async function clickByText(page, textRe) {
  for (const role of ["button", "link", "tab"]) {
    try {
      const loc = page.getByRole(role, { name: textRe }).first();
      if (await loc.count()) { await loc.click({ timeout: 8000 }); return true; }
    } catch {}
  }
  try {
    const loc = page.getByText(textRe, { exact: false }).first();
    if (await loc.count()) { await loc.click({ timeout: 8000 }); return true; }
  } catch {}
  return false;
}


/**
 * カテゴリ掲載場所を選ぶ (最大 3 枠)。
 *
 * ★階層は「3 段の select で絞り込み → 掲載場所のチェックボックス」 (2026-08-12 実測)
 *   select を 3 段選んだだけでは「0 個のカテゴリーを選択済み」のままで 1 枠も入らない。
 *   **チェックを入れて初めて 1 枠**になる。ここを取り違えると、ログ上は選べたように見えて
 *   何も保存されず、次に開いたときボタンが「カテゴリーを選択」のまま戻っている。
 *
 * ★`select.value = …` + `dispatchEvent(change)` では効かない
 *   このモーダルは React 制御 (`name="react-aui-N"`)。素の代入は React の value tracker を
 *   すり抜けるので state が変わらず、次段の select も出ない。Playwright の `selectOption`
 *   (実ユーザーと同じ経路) を使う。
 *
 * ★選べたことを read-back で確かめる
 *   「クリックした」ではなく「選択済み件数が増えた」を成功条件にする。
 *   前の実装はクリックの成否だけを見ていたため、1 枠も入っていないのに ✓ を出していた。
 */
async function selectKdpCategories(page, paths, tag, log, warnings) {
  if (!paths.length) return false;
  // ★可視の select だけを指す。枠を足すと前の枠の select は残ったまま非表示になるので、
  //   位置指定 (nth) を素の全件に対して行うと 2 枠目以降が必ずズレる。
  const SELECTS = '[role="dialog"] select:visible, .a-popover-modal select:visible';

  /** モーダル内で「N 個のカテゴリーを選択済み」の N を読む。 */
  const selectedCount = () =>
    page.evaluate(() => {
      const dlg = [...document.querySelectorAll('[role="dialog"], .a-popover-modal')].find((d) => d.offsetParent !== null);
      const m = /(\d+)\s*個のカテゴリーを選択済み/.exec(dlg?.innerText || "");
      return m ? Number(m[1]) : -1;
    });

  /**
   * モーダル内のボタンをテキストで押す。
   *
   * ★`evaluate` 内の `.click()` では効かない。KDP のモーダルは Amazon AUI のボタンで、
   *   実際に反応するのは内側の span へのユーザー操作なので Playwright のクリックを使う
   *   (evaluate で押していた間、保存もカテゴリ追加も静かに無反応だった)。
   */
  const clickInDialog = async (text) => {
    try {
      await page
        .locator('[role="dialog"], .a-popover-modal')
        .locator(`text=${text}`)
        .first()
        .click({ timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  };

  try {
    const btn = page.locator("#categories-modal-button").first();
    if (!(await btn.count()) || (await btn.isDisabled().catch(() => true))) return false;
    await btn.click({ timeout: 15000 });
    await sleep(8000);

    // ★既に選択済みの枠を読む (部分保存の補修用)。モーダル下部に
    //   「Kindle 本 › … › <場所>」として並ぶ。既存分はスキップし、期待件数は相対で数える。
    const listSelected = () =>
      page.evaluate(() => {
        const dlg = [...document.querySelectorAll('[role="dialog"], .a-popover-modal')].find((d) => d.offsetParent !== null);
        return ((dlg?.innerText || "").match(/Kindle 本 › [^\n|]+/g) || []).map((t) => t.trim());
      });
    let done = await selectedCount();
    if (done < 0) done = 0;
    const already = await listSelected();
    for (const path of paths.slice(0, 3)) {
      if (already.some((t) => t.includes(`› ${path.sub} › ${path.place}`))) {
        log.push(`${tag} ✓ カテゴリ (既存): ${path.top} > ${path.sub} > ${path.place}`);
        continue;
      }
      // ★「リセット」も「別のカテゴリーを追加」も使わない (2026-08-12 実測)。
      //   リセットは**チェック済みの枠まで消す**ので、押すたびに 1 枠目を上書きしていた。
      //   追加ボタンは select を増やさない。select を選び直すだけでチェックは累積する。
      try {
        // 最初の絞り込みか (select がまだ操作可能か) は select 群の disabled で判定する。
        const firstSelectDisabled = await page
          .locator(SELECTS)
          .first()
          .isDisabled()
          .catch(() => false);
        if (firstSelectDisabled) {
          // ★2 枠目以降は「別のカテゴリーを追加」を**実クリック**して新しい select 群を出す。
          //   チェックを入れると直前の枠の select は disabled になるので、押さないと次を選べない。
          //   evaluate() 内の .click() では反応しない (AUI ボタン) ので Playwright のクリックを使う。
          await page
            .locator('[role="dialog"], .a-popover-modal')
            .locator("text=別のカテゴリーを追加")
            .first()
            .click({ timeout: 15000 });
          await sleep(6000);
        }
        await page.locator(SELECTS).nth(0).selectOption({ label: "Kindle本" }, { timeout: 15000 }).catch(() => {});
        await sleep(3500);
        await page.locator(SELECTS).nth(1).selectOption({ label: path.top }, { timeout: 15000 });
        await sleep(3500);
        await page.locator(SELECTS).nth(2).selectOption({ label: path.sub }, { timeout: 15000 });
        await sleep(4000);
      } catch {
        warnings.push(`カテゴリ「${path.top} > ${path.sub}」の絞り込みに失敗 (KDP の分類が変わった可能性)`);
        continue;
      }
      const before = await selectedCount();
      // 掲載場所のチェックボックスをラベル一致で入れる。
      const checked = await page.evaluate((place) => {
        const dlg = [...document.querySelectorAll('[role="dialog"], .a-popover-modal')].find((d) => d.offsetParent !== null);
        // ★同名の掲載場所が別系統にある (「参考図書・白書」は社会学にも教育学にもある)。
        //   前の枠でチェック済みの同名 checkbox が DOM に残るため、単純な先頭一致だと
        //   **それを外してしまう** (K-S1-05 で実測: 選択済み 2→1)。未チェックに限定する。
        const box = [...(dlg?.querySelectorAll('input[type="checkbox"]') || [])].find((e) => {
          if (e.checked) return false;
          const t = (e.closest("label")?.innerText || e.parentElement?.innerText || "").trim();
          return t === place;
        });
        if (!box) return false;
        box.scrollIntoView({ block: "center" });
        box.click();
        return true;
      }, path.place);
      await sleep(3000);
      const after = await selectedCount();
      // ★「押せた」ではなく「累積の選択済み件数が期待どおり増えた」を成功条件にする。
      //   増分だけを見ると、前の枠を消して入れ替えても成功に見える (実際にそれで 1 枠しか
      //   入っていないのに 3 枠 ✓ と報告していた)。
      if (!checked || after !== done + 1) {
        warnings.push(`カテゴリ「${path.top} > ${path.sub} > ${path.place}」を選択できず (選択済み ${before}→${after}、期待 ${done + 1})`);
        continue;
      }
      done += 1;
      log.push(`${tag} ✓ カテゴリ${done}: ${path.top} > ${path.sub} > ${path.place}`);
    }

    if (done === 0) return false;
    if (!(await clickInDialog("カテゴリーを保存"))) return false;
    await sleep(6000);
    // 保存後に本文側の表示が「カテゴリーを選択」のままなら保存できていない。
    const persisted = await page.evaluate(() => {
      const b = document.querySelector("#categories-modal-button");
      return !!b && !/^カテゴリーを選択$/.test((b.innerText || "").trim());
    });
    if (!persisted) warnings.push("カテゴリを保存したがページ側に反映されていない (KDP の保存が失敗した可能性)");
    return persisted;
  } catch {
    return false;
  }
}

/** Details ステップ: 言語・タイトル・サブタイトル・著者・内容紹介・キーワード。 */
export async function fillKdpDetails(page, lst, { tag = "[kdp]" } = {}) {
  const log = [];
  const warnings = [];
  const need = (ok, what) => { if (ok) log.push(`${tag} ✓ ${what}`); else warnings.push(`${what} を充填できず (DOM 変更の可能性・--probe で確認)`); };

  // ★日本語フォームはフリガナ・ローマ字も必須。SSOT は packages/product-factory の kdp-reading.ts。
  need((await fillById(page, "data-title", lst.title)) || (await fillByLabel(page, /Book Title|タイトル|Title/i, lst.title)), "タイトル");
  need(await fillById(page, "data-title-pronunciation", lst.titleKana), "タイトルのフリガナ");
  need(await fillById(page, "data-title-romanized", lst.titleRomaji), "タイトルのローマ字");
  if (lst.subtitle) {
    need((await fillById(page, "data-subtitle", lst.subtitle)) || (await fillByLabel(page, /Subtitle|サブタイトル/i, lst.subtitle)), "サブタイトル");
    need(await fillById(page, "data-subtitle-pronunciation", lst.subtitleKana), "サブタイトルのフリガナ");
    need(await fillById(page, "data-subtitle-romanized", lst.subtitleRomaji), "サブタイトルのローマ字");
  }
  // 著者は姓・名が別欄 (屋号なので姓に入れて名は空)。
  need(await fillById(page, "data-primary-author-last-name", lst.authorLastName ?? lst.author), "著者の姓");
  need(await fillById(page, "data-primary-author-first-name", lst.authorFirstName ?? ""), "著者の名");
  need(await fillById(page, "data-primary-author-pronunciation", lst.authorKana), "著者のフリガナ");
  need(await fillById(page, "data-primary-author-name-romanized", lst.authorRomaji), "著者のローマ字");
  // 内容紹介 (Description)
  // ★KDP は CKEditor (iframe.cke_wysiwyg_frame) を使う (2026-08-12 実測)。
  //   hidden の data[description] に直接書くと React/CKEditor の状態と同期せず保存されないので、
  //   **iframe の本文へ実際に打ち込む**。
  // ★キーボードで打ち込むと KDP に弾かれる (2026-08-12 実測)
  //   段落の区切り (空行) が CKEditor で `<p>&nbsp;</p>` になり、
  //   「内容紹介 にスペースやタブなど不可視文字を含めることはできません」で保存できない。
  //   段落を `<p>` に組んで CKEditor の setData で入れる (空段落を作らない)。
  let descOk = false;
  try {
    descOk = await page.evaluate((text) => {
      const CK = window.CKEDITOR;
      if (!CK || !CK.instances) return false;
      const inst = Object.values(CK.instances)[0];
      if (!inst) return false;
      const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = text
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para) => `<p>${esc(para).replace(/\n/g, "<br>")}</p>`)
        .join("");
      inst.setData(html);
      inst.updateElement();
      return true;
    }, lst.description);
    await sleep(2000);
  } catch {}
  if (!descOk) {
    try {
      const fr = page.frameLocator("iframe.cke_wysiwyg_frame").first();
      const body = fr.locator("body").first();
      if (await body.count()) {
        await body.click({ timeout: 8000 });
        await page.keyboard.press("Control+A").catch(() => {});
        await page.keyboard.press("Meta+A").catch(() => {});
        await body.type(lst.description.replace(/\n{2,}/g, "\n"), { delay: 0, timeout: 60000 });
        descOk = true;
      }
    } catch {}
  }
  if (!descOk) descOk = await fillByLabel(page, /Description|内容紹介|説明/i, lst.description);
  need(descOk, "内容紹介");

  // キーワード — 実測で data-keywords-0 … data-keywords-6 の 7 欄が並ぶ。
  let kwFilled = 0;
  for (let i = 0; i < lst.keywords.length && i < 7; i++) {
    if (await fillById(page, `data-keywords-${i}`, lst.keywords[i])) kwFilled++;
  }
  if (kwFilled >= Math.min(3, lst.keywords.length)) log.push(`${tag} ✓ キーワード ${kwFilled}/${lst.keywords.length}`);
  else warnings.push(`キーワード欄を特定できず (${kwFilled} 件のみ・--probe で確認)`);
  // ★成人向けコンテンツのラジオを先に選ぶ。**これを選ぶまでカテゴリボタンが disabled** で、
  //   カテゴリは必須なのでウィザードが 1 歩も進まない (2026-08-12 実測)。統計データブックなので「いいえ」。
  const adultOk = await page.evaluate(() => {
    const no = [...document.querySelectorAll('input[type="radio"][name="data[is_adult_content]-radio"]')]
      .find((e) => e.value === "false");
    if (!no) return false;
    no.scrollIntoView({ block: "center" });
    no.click();
    return no.checked;
  });
  need(adultOk, "成人向けコンテンツ = いいえ");
  await sleep(2500);

  // ★出版に関する権利も必須。自作なので「著作権を所有し、必要な権利を保有」= is_public_domain:false。
  //   選ばないと「保存して続行」が止まる (カテゴリと同じく人手に切り分けられない)。
  const rightsOk = await page.evaluate(() => {
    // ★name の書式が成人向けラジオと違う (`data-is-public-domain`。`data[...]-radio` ではない)。
    //   命名が揃っている前提で書くと、静かに 1 つも見つからない。
    const radios = [...document.querySelectorAll('input[type="radio"][name="data-is-public-domain"]')];
    const own = radios.find((e) => e.value === "false");
    if (!own) return false;
    own.scrollIntoView({ block: "center" });
    own.click();
    return own.checked;
  });
  need(rightsOk, "出版に関する権利 = 著作権を所有");
  await sleep(2000);

  // カテゴリ (最大 3 枠)。段階式ドロップダウンを SSOT の値で選ぶ。
  need(await selectKdpCategories(page, lst.categoryPaths ?? [], tag, log, warnings), "カテゴリ");
  return { log, warnings };
}

/** Content ステップ: 原稿 (EPUB) とカバーのアップロード。 */
/**
 * 次のステップへ進む (「保存して続行」)。
 *
 * ★KDP のウィザードは必須項目が埋まるまで進まない。押しただけでは成功と言えないので、
 *   **URL が次ステップに変わったか**を read-back する (details → content → pricing)。
 *   進めなかった場合は画面のエラー文言を拾って返す (何が足りないかを黙って落とさない)。
 */
export async function goToNextKdpStep(page, expectStep, { tag = "[kdp]" } = {}) {
  const before = page.url();
  const ok = await (async () => {
    try {
      await page.locator("text=保存して続行").first().click({ timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  })();
  if (!ok) return { ok: false, reason: "「保存して続行」を押せない", url: before };
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    if (new RegExp(`/${expectStep}(\\?|$|/)`).test(page.url())) return { ok: true, url: page.url() };
  }
  // ★KDP の作成数制限 (2026-08-13 実測)。未公開タイトルが一定数を超えると
  //   「本の作成数制限を超えました」モーダルが出て新規下書きを保存できない。
  //   これはコードの欠陥ではなく口座の状態 — 既存の下書きを公開して枠を空けるまで
  //   何度やり直しても失敗するので、専用の理由で返して呼び出し元に中断させる。
  const limitHit = await page
    .evaluate(() => /本の作成数制限を超えました/.test(document.body?.innerText || ""))
    .catch(() => false);
  if (limitHit) {
    return {
      ok: false,
      reason: "KDP の本の作成数制限 (未公開タイトルが上限) — 既存下書きを公開して枠を空けてから再実行",
      limitHit: true,
      url: page.url(),
    };
  }
  // 進めなかった理由を画面から拾う (可視のアラートだけ。KDP は非表示のテンプレを大量に持つ)。
  const errs = await page
    .evaluate(() =>
      [...document.querySelectorAll(".a-alert-content")]
        .filter((e) => e.offsetParent !== null)
        .map((e) => (e.innerText || "").trim())
        .filter((t) => t && t.length < 160),
    )
    .catch(() => []);
  return { ok: false, reason: `${expectStep} へ進めず`, errors: [...new Set(errs)].slice(0, 5), url: page.url() };
}

export async function uploadKdpContent(page, { epubAbs, coverAbs, applyDrm = true, ai = null, tag = "[kdp]" } = {}) {
  const log = [];
  const warnings = [];
  await sleep(2500);
  // 原稿 (EPUB) アップロード
  // ★file input を「最初に見つかったもの」で決めない。content ステップには
  //   原稿 / 表紙 / 日本版表紙 の 3 つが並んでおり、順番に依存すると取り違える。id で名指しする。
  const setFile = async (id, abs) => {
    try {
      const loc = page.locator(`#${id}`);
      if (!(await loc.count())) return false;
      await loc.setInputFiles(abs, { timeout: 20000 });
      return true;
    } catch {
      return false;
    }
  };
  const epubOk = await setFile("data-assets-interior-file-upload-AjaxInput", epubAbs);
  if (epubOk) {
    log.push(`${tag} ✓ 原稿 (EPUB) アップロード開始`);
    await sleep(12000);
  } else warnings.push("原稿 (EPUB) の file input を特定できず (--probe で確認)");

  // ── DRM と 生成 AI の開示 (どちらも必須。埋めないと pricing へ進めない) ──
  //   ★これは入力ではなく **Amazon への申告**。フォームを通すために事実と違う答えを選ばない。
  //     内容の SSOT は packages/product-factory の kdp-publishing-policy.ts。
  const drmOk = await page.evaluate((apply) => {
    const r = [...document.querySelectorAll('input[type="radio"][name="data[is_drm]-radio"]')]
      .find((e) => e.value === String(apply));
    if (!r) return false;
    r.scrollIntoView({ block: "center" });
    r.click();
    return r.checked;
  }, applyDrm);
  if (drmOk) log.push(`${tag} ✓ DRM = ${applyDrm ? "適用する" : "適用しない"}`);
  else warnings.push("DRM の選択を特定できず");
  await sleep(2500);

  if (ai) {
    // 「はい / いいえ」はラジオではなくアコーディオン行 (a.a-accordion-row)。実クリックで開く。
    let aiOk = false;
    try {
      // ★既に展開済みなら押さない。アコーディオンは押すと**閉じる**ので、
      //   やり直し実行では「はい」を押した瞬間に質問票が消え、入力できなくなる。
      const alreadyOpen = await page
        .locator("#generative-ai-questionnaire-text")
        .isVisible()
        .catch(() => false);
      if (!alreadyOpen) {
        await page.locator("a.a-accordion-row", { hasText: ai.used ? "はい" : "いいえ" }).first().click({ timeout: 15000 });
        await sleep(4000);
      }
      if (ai.used) {
        for (const [id, label] of [
          ["generative-ai-questionnaire-text", ai.text],
          ["generative-ai-questionnaire-images", ai.images],
          ["generative-ai-questionnaire-translations", ai.translations],
        ]) {
          await page.locator(`#${id}`).selectOption({ label }, { timeout: 15000 });
          await sleep(2500);
        }
        // ★「なし」以外を選ぶと**使ったツール名**の記入欄が現れる (1 欄 1 ツール・各 3 欄)。
        //   ここを空にしたままだと「使用した AI ツールを指定します」で先へ進めない。
        //   欄は id も name も持たないので、placeholder 例示 (ChatGPT / DALL-E) を起点に
        //   DOM 順で 3 欄ずつ拾う。
        const filledTools = await page.evaluate(
          ({ textTools, imageTools }) => {
            const boxes = [...document.querySelectorAll('input[type="text"]')].filter((e) => e.offsetParent !== null);
            const setVal = (el, v) => {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              setter.call(el, v);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            };
            const fillFrom = (anchorRe, tools) => {
              const at = boxes.findIndex((e) => anchorRe.test(e.placeholder || ""));
              if (at < 0) return 0;
              let n = 0;
              tools.slice(0, 3).forEach((t, i) => {
                const el = boxes[at + i];
                if (el) { setVal(el, t); n += 1; }
              });
              return n;
            };
            return {
              text: fillFrom(/ChatGPT/, textTools || []),
              images: fillFrom(/DALL-E/, imageTools || []),
            };
          },
          { textTools: ai.textTools, imageTools: ai.imageTools },
        );
        await sleep(2500);
        if (!filledTools.text || !filledTools.images) {
          warnings.push(`AI ツール名の記入欄を埋められず (text ${filledTools.text} / image ${filledTools.images})`);
        }
      }
      // 「自分の回答が正しいことを確認する」チェック。
      // ★素の checkbox ではなく **`div[role="checkbox"]` + `aria-checked`** (React 独自要素)。
      //   `input[type=checkbox]` を探しても 1 つも無いので、状態が読めず永久に入らない扱いになる。
      //   `aria-checked` を read-back して、入るまで押す。
      aiOk = true;
    } catch {}
    if (aiOk) {
      log.push(
        ai.used
          ? `${tag} ✓ AI 使用の申告 (テキスト: ${ai.text} / 画像: ${ai.images} / 翻訳: ${ai.translations})`
          : `${tag} ✓ AI 使用の申告 = 使用していない`,
      );
    } else {
      warnings.push("生成 AI の使用開示を入力できず (申告事項なので既定値で埋めない)");
    }
  }

  if (coverAbs) {
    // ★KDP の表紙は **JPEG / TIFF しか受け付けない** (accept=".tiff,.tif,.jpeg,.jpg")。
    //   PNG を渡すと file input が黙って拒否し、「表紙がアップロードされていません」のまま
    //   下書きだけが残る (2026-08-12 に 9 件そうなった)。SSOT の coverPath は cover.jpg を指す。
    //   日本の KDP は表紙欄を 2 つ持つ (共通 / 日本版) ので両方に入れる。
    // ★まず**原稿の処理完了**を待つ。アップロード直後は「原稿をチェックしています…」で、
    //   表紙のセクションがまだ描画されない。新規作成の 1 回目だけここで空振りし、
    //   下書きを開き直した 2 回目は通るので、原因が見えにくい。
    await page
      .locator("text=/原稿チェックが完了しました|ファイルの処理が完了しました/")
      .first()
      .waitFor({ state: "visible", timeout: 180000 })
      .catch(() => {});
    await sleep(4000);

    // ★まず**原稿の処理完了**を待つ。アップロード直後は「原稿をチェックしています…」で、
    //   表紙のセクションがまだ描画されない。新規作成の 1 回目だけここで空振りし、
    //   下書きを開き直した 2 回目は通るので原因が見えにくい (K-S1-02/03 で実測)。
    await page
      .locator("text=/原稿チェックが完了しました|ファイルの処理が完了しました/")
      .first()
      .waitFor({ state: "visible", timeout: 240000 })
      .catch(() => {});
    await sleep(4000);

    // ★表紙のセクションは**原稿の処理が終わってから**描画される。
    //   新規作成の 1 回目はここが間に合わず、アップロードが静かに空振りしていた
    //   (既存下書きを開き直した 2 回目だけ成功していた)。出るまで待つ。
    await page
      .locator("text=作成済みの表紙をアップロード")
      .first()
      .waitFor({ state: "visible", timeout: 90000 })
      .catch(() => {});

    // ★file input を有効にするには先に「作成済みの表紙をアップロード」を選ぶ。
    //   既定は「表紙作成ツールで作成」で、選ばないまま setInputFiles しても何も起きない
    //   (エラーも出ないので成功に見える)。
    const modeOk = await page
      .locator("text=作成済みの表紙をアップロード")
      .first()
      .click({ timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    // ★ここでは警告を出さない。既に「作成済みの表紙」が選ばれていればクリック対象が無く、
    //   それは失敗ではない。可否は最後の read-back (画面から未アップロード表示が消えたか) で決める。
    await sleep(4000);
    const c1 = await setFile("data-assets-cover-file-upload-AjaxInput", coverAbs);
    const c2 = await setFile("data-assets-cover-jp-file-upload-AjaxInput", coverAbs);
    if (c1 || c2) await sleep(15000);
    // ★read-back: 「表紙がアップロードされていません」が消えたことを確かめる。
    //   「setInputFiles できた」だけでは、拒否されても成功に見える。
    const stillEmpty = await page
      .evaluate(() => /表紙がアップロードされていません/.test(document.body?.innerText || ""))
      .catch(() => true);
    if ((c1 || c2) && !stillEmpty) log.push(`${tag} ✓ カバー アップロード完了`);
    else
      warnings.push(
        `カバーをアップロードできず (方式選択 ${modeOk ? "済" : "不要/失敗"}、input ${c1 ? "共通" : "-"}/${c2 ? "日本版" : "-"}、画面はまだ未アップロード表示)`,
      );

    // ★確認チェックは**カバーを入れたあと**に押す。
    //   「新しい原稿または表紙画像をアップロードされたようです」の確認欄は
    //   アップロードのたびに未チェックへ戻るので、先に押しても無効化される
    //   (AI の申告と同じ文言なので、片方だけ見て通したつもりになりやすい)。
    try {
      // ★確認欄は **2 つある** (原稿/表紙の再アップロード用と AI 開示用。文言は同じ)。
      //   1 つだけ入れても「ボックスにチェックを入れます」で止まる。可視のものを全部入れる。
      const boxes = page.locator('div[role="checkbox"][aria-labelledby*="mdn-checkbox-label"]');
      const n = await boxes.count();
      for (let i = 0; i < n; i++) {
        const b = boxes.nth(i);
        for (let k = 0; k < 3; k++) {
          if ((await b.getAttribute("aria-checked").catch(() => null)) === "true") break;
          await b.click({ timeout: 15000 }).catch(() => {});
          await sleep(2000);
        }
      }
      const unchecked = [];
      for (let i = 0; i < n; i++) {
        if ((await boxes.nth(i).getAttribute("aria-checked").catch(() => null)) !== "true") unchecked.push(i);
      }
      if (n === 0 || unchecked.length) throw new Error(`確認チェックが入らない (${n} 個中 ${unchecked.length} 個が未チェック)`);
      log.push(`${tag} ✓ 確認チェック`);
    } catch (e) {
      warnings.push(`確認チェックを入れられず: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { log, warnings };
}

/** Pricing ステップ: KU・地域・ロイヤリティ・価格。 */
export async function setKdpPricing(page, lst, { tag = "[kdp]" } = {}) {
  const log = [];
  const warnings = [];
  await sleep(2500);
  // KU (KDP Select) — kuEnrolled=false のときは登録しない (既定で未チェックが多い)。
  log.push(`${tag} KU 登録: ${lst.kuEnrolled ? "有効化 (人手確認推奨)" : "登録しない (既定)"}`);
  // ロイヤリティプラン (70% / 35%)
  const royOk = await clickByText(page, lst.royaltyPlan === 70 ? /70\s*%/ : /35\s*%/);
  if (royOk) log.push(`${tag} ✓ ロイヤリティ ${lst.royaltyPlan}%`); else warnings.push("ロイヤリティ選択を特定できず");
  // 価格 (JPY)
  // ★価格欄は 12 のマーケットプレイスぶん並ぶ (JP/US/UK/DE/…)。ラベルで探すと最初の 1 つに
  //   当たるだけで、どの国の欄かを保証できない。**国コードを含む name で JP を名指しする**。
  //   他国は KDP が JP を基準に自動換算する。
  let priceOk = false;
  try {
    const jp = page.locator('input[name="data[digital][channels][amazon][JP][price_vat_inclusive]"]').first();
    if (await jp.count()) {
      await jp.scrollIntoViewIfNeeded().catch(() => {});
      await jp.fill(String(lst.priceYen), { timeout: 15000 });
      await sleep(2500);
      // read-back (React が値を戻すことがあるので入ったことを確かめる)
      const v = (await jp.inputValue().catch(() => "")).replace(/[^0-9]/g, "");
      priceOk = v === String(lst.priceYen);
      if (!priceOk) warnings.push(`価格を入れたが反映されず (入力 ${lst.priceYen} / 実際 "${v}")`);
    }
  } catch {}
  if (priceOk) log.push(`${tag} ✓ 価格 ¥${lst.priceYen} (JP)`);
  else if (!warnings.some((w) => w.startsWith("価格"))) warnings.push("価格欄 (JP) を特定できず (--probe で確認)");
  return { log, warnings };
}

/** 下書き保存。 */
export async function saveDraft(page, { tag = "[kdp]" } = {}) {
  const ok = await clickByText(page, /Save as Draft|下書きとして保存|下書き保存|Save Draft/i);
  await sleep(3000);
  return { ok };
}

// publishBook は廃止 (2026-08-13)。成功判定が文言 grep (「出版」等はどのページにもある) で
// 偽成功を出すため、本棚 read-back で確定する lib/kdp-flow.mjs の publishDraft に置き換えた。
