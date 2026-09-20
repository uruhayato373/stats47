#!/usr/bin/env node
/**
 * 有料 note 記事の「無料部分」に着地要素 (対象読者 / わかること / サンプル画像 / 出典 / サイト導線) を足す。
 * 本文 HTML を組み直して公開 API の PUT に差し込むので、editor でのタイプや添付の再アップロードを伴わない
 * (添付 figure は公開版の有料本文ごと温存。note の添付 1 日 10 回制限に掛からない)。
 *
 * 契約: .claude/rules/sns-content-standards.md §2-7b。検査: audit-note-circulation.mjs の paid_*。
 *
 * 仕様 (spec) は記事ごとに .claude/scripts/note/catalog/data/paid-landing/<key>.json:
 *   {
 *     "key": "d-kakei-category-dataset",
 *     "audienceHeading": "こんな人のためのデータです", "audience": [{ "strong": "…", "text": "…" }, ...],
 *     "audienceNote": "…(任意の締め段落)",
 *     "learnHeading": "このデータでわかること", "learn": [{ "strong": "…", "text": "…" }, ...],
 *     "sampleHeading": "データのサンプル", "sampleLead": "…",
 *     "samples": [{ "file": "docs/31_note記事原稿/<slug>/images/x.png", "caption": "…", "uploadedUrl": null, "width": null, "height": null }],
 *     "sourceHeading": "データの出典", "source": "出典：総務省統計局「家計調査」（URL）を加工して作成。…",
 *     "siteLink": { "url": "https://stats47.jp/ranking/…", "lead": "…", "title": "…", "description": "…" }
 *   }
 *   samples[].uploadedUrl は初回アップロード後にこのファイルへ書き戻す (再実行で再アップロードしない)。
 *
 * 差し込み位置: 導入ブロック (対象読者 / わかること / サンプル) は無料部分の最初の <h2> の直前、
 * 出典ブロック (+ サイトカード) は無料部分の末尾。有料境界 (separator) は出典ブロックの最後の要素へ移す。
 *
 * 使い方:
 *   node .claude/scripts/note/patch-note-paid-landing.mjs --slug d-kakei-category-dataset            # dry-run (組み立て結果を表示)
 *   node .claude/scripts/note/patch-note-paid-landing.mjs --slug d-kakei-category-dataset --commit   # 更新 + live 検証
 *   node .claude/scripts/note/patch-note-paid-landing.mjs --all [--commit]                          # spec を持つ全記事
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { externalCard } from "./lib/navigation-footer.mjs";
import { assertAccount, launchContext, UA } from "./lib/note-session.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const SPEC_DIR = join(ROOT, ".claude/scripts/note/catalog/data/paid-landing");
const IMAGE_WIDTH = 620;

function parseArgs(argv) {
  const slugIndex = argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? argv[slugIndex + 1] : null,
    all: argv.includes("--all"),
    commit: argv.includes("--commit"),
  };
}

function catalog() {
  const raw = execFileSync("npx", ["tsx", join(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts")], {
    cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(raw);
}

export function noteKeyFromUrl(url) {
  const key = new URL(url).pathname.match(/\/n\/(n[0-9a-f]+)$/i)?.[1];
  if (!key) throw new Error(`note key を抽出できません: ${url}`);
  return key;
}

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const attrs = (id) => `name="${id}" id="${id}"`;

/** PNG の IHDR から幅・高さを読む (sharp を要求しない)。 */
export function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") throw new Error("PNG ではありません");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** 公開版 body を separator 要素の終端で無料 / 有料に割る。 */
export function splitPublishedBody(body, separator) {
  const idx = body.indexOf(`id="${separator}"`);
  if (idx < 0) throw new Error(`separator 要素が本文に無い: ${separator}`);
  const tagStart = body.lastIndexOf("<", idx);
  const tagName = body.slice(tagStart + 1).match(/^([a-z0-9]+)/i)?.[1];
  if (!tagName) throw new Error("separator 要素のタグ名を取れない");
  const close = `</${tagName}>`;
  const end = body.indexOf(close, idx);
  if (end < 0) throw new Error("separator 要素の終端が無い");
  const cut = end + close.length;
  return { free: body.slice(0, cut), pay: body.slice(cut) };
}

function paragraph(text, idFactory) {
  return `<p ${attrs(idFactory())}>${text}</p>`;
}
function heading(text, idFactory) {
  return `<h2 ${attrs(idFactory())}>${escapeHtml(text)}</h2>`;
}
function bulletList(items, idFactory) {
  const lis = items.map((item) => {
    const strong = item.strong ? `<strong>${escapeHtml(item.strong)}</strong>` : "";
    const sep = item.strong && item.text ? " — " : "";
    return `<li><p ${attrs(idFactory())}>${strong}${sep}${escapeHtml(item.text || "")}</p></li>`;
  }).join("");
  return `<ul ${attrs(idFactory())}>${lis}</ul>`;
}
function imageFigure(sample, idFactory) {
  const height = Math.round(IMAGE_WIDTH * sample.height / sample.width);
  return `<figure ${attrs(idFactory())}><img src="${escapeHtml(sample.uploadedUrl)}" alt="${escapeHtml(sample.alt || "")}" width="${IMAGE_WIDTH}" height="${height}"><figcaption>${escapeHtml(sample.caption || "")}</figcaption></figure>`;
}

/** 無料部分 HTML に導入 / 出典ブロックを差し込む。冪等: 見出し文言が既にあれば触らない。 */
export function composeFreeBody(free, spec, { idFactory = randomUUID } = {}) {
  let output = free;
  const changes = [];
  const hasIntro = spec.audienceHeading && output.includes(`>${escapeHtml(spec.audienceHeading)}</h2>`);
  if (!hasIntro && (spec.audience?.length || spec.learn?.length || spec.samples?.length)) {
    const parts = [];
    if (spec.audience?.length) {
      parts.push(heading(spec.audienceHeading, idFactory), bulletList(spec.audience, idFactory));
      if (spec.audienceNote) parts.push(paragraph(escapeHtml(spec.audienceNote), idFactory));
    }
    if (spec.learn?.length) parts.push(heading(spec.learnHeading, idFactory), bulletList(spec.learn, idFactory));
    if (spec.samples?.length) {
      parts.push(heading(spec.sampleHeading || "データのサンプル", idFactory));
      if (spec.sampleLead) parts.push(paragraph(escapeHtml(spec.sampleLead), idFactory));
      for (const sample of spec.samples) {
        if (!sample.uploadedUrl || !sample.width || !sample.height) throw new Error(`sample が未アップロード: ${sample.file}`);
        parts.push(imageFigure(sample, idFactory));
        if (sample.caption) parts.push(paragraph(escapeHtml(sample.caption), idFactory));
      }
    }
    const block = parts.join("");
    const firstH2 = output.search(/<h2\b/);
    output = firstH2 >= 0 ? output.slice(0, firstH2) + block + output.slice(firstH2) : output + block;
    changes.push("intro");
  }
  const hasSource = spec.source && output.includes(escapeHtml(spec.source).slice(0, 40));
  let separatorId = null;
  if (!hasSource && spec.source) {
    const parts = [];
    if (spec.sourceHeading) parts.push(heading(spec.sourceHeading, idFactory));
    const sourceId = idFactory();
    parts.push(`<p ${attrs(sourceId)}>${escapeHtml(spec.source)}</p>`);
    separatorId = sourceId;
    if (spec.siteLink?.url) {
      const leadId = idFactory();
      parts.push(`<p ${attrs(leadId)}>${escapeHtml(spec.siteLink.lead || "")}</p>`);
      parts.push(externalCard(spec.siteLink.url, spec.siteLink.title, spec.siteLink.description, idFactory));
      // カードの直後に有料ラインを置くため、末尾は空でない段落にする (figure を separator にしない)
      const tailId = idFactory();
      parts.push(`<p ${attrs(tailId)}>${escapeHtml(spec.siteLinkTail || "ここから先は有料部分です。")}</p>`);
      separatorId = tailId;
    }
    output += parts.join("");
    changes.push("source");
  }
  return { html: output, changes, separatorId };
}

/**
 * spec の箇条書きに出る数値 (年・倍率・%・人数など) が記事本文 (無料+有料) に実在することを確かめる。
 * LLM が書いた導入が本文に無い数字を持ち込むのを止めるための決定的ゲート (evidence-based-judgment)。
 */
export function findUnsupportedNumbers(spec, bodyText) {
  const haystack = String(bodyText).replace(/[,，]/g, "");
  const texts = [
    ...(spec.audience || []).flatMap((item) => [item.strong, item.text]),
    ...(spec.learn || []).flatMap((item) => [item.strong, item.text]),
    spec.audienceNote,
  ].filter(Boolean);
  const missing = new Set();
  for (const text of texts) {
    for (const token of String(text).replace(/[,，]/g, "").match(/\d+(?:\.\d+)?/g) || []) {
      if (!haystack.includes(token)) missing.add(token);
    }
  }
  return [...missing];
}

async function uploadImage(ctx, filePath) {
  const buffer = readFileSync(filePath);
  const { width, height } = pngSize(buffer);
  const name = basename(filePath);
  const presign = await ctx.request.post("https://note.com/api/v3/images/upload/presigned_post", {
    headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest" },
    multipart: { filename: name },
  });
  if (presign.status() !== 200) throw new Error(`presigned_post ${presign.status()}: ${(await presign.text()).slice(0, 200)}`);
  const data = (await presign.json())?.data;
  if (!data?.url || !data?.action || !data?.post) throw new Error("presigned_post の応答に url/action/post が無い");
  const fields = { ...data.post, file: { name, mimeType: "image/png", buffer } };
  const s3 = await ctx.request.post(data.action, { multipart: fields });
  if (s3.status() < 200 || s3.status() >= 300) throw new Error(`S3 upload ${s3.status()}: ${(await s3.text()).slice(0, 200)}`);
  const head = await ctx.request.get(data.url, { headers: { "User-Agent": UA } });
  if (head.status() !== 200) throw new Error(`uploaded image not reachable: ${data.url} (${head.status()})`);
  return { uploadedUrl: data.url, width, height };
}

async function fetchOwnerNote(ctx, noteKey, query = "") {
  const r = await ctx.request.get(`https://note.com/api/v3/notes/${noteKey}?${query}ts=${Date.now()}`, { headers: { "User-Agent": UA } });
  if (r.status() !== 200) throw new Error(`note API ${r.status()}`);
  const data = (await r.json())?.data;
  if (!data) throw new Error("note API data なし");
  return data;
}

async function fetchPublicNote(noteKey) {
  const r = await fetch(`https://note.com/api/v3/notes/${noteKey}?ts=${Date.now()}`, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`public note API ${r.status}`);
  return (await r.json()).data;
}

function loadSpec(key) {
  const path = join(SPEC_DIR, `${key}.json`);
  if (!existsSync(path)) throw new Error(`spec が無い: ${path}`);
  return { path, spec: JSON.parse(readFileSync(path, "utf8")) };
}
function saveSpec(path, spec) {
  writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
}

async function processArticle(ctx, article, options) {
  const noteKey = noteKeyFromUrl(article.noteUrl);
  const { path: specPath, spec } = loadSpec(article.key);
  if (spec.key !== article.key) throw new Error(`${article.key}: spec.key 不一致 (${spec.key})`);

  // 公開版 (所有者 API) を基準にする。下書きが残っていても影響しない (下書きは今回の PUT で上書きされる)。
  const published = await fetchOwnerNote(ctx, noteKey);
  if (published.user?.urlname !== "stats47" || published.status !== "published") throw new Error(`${article.key}: 帰属または公開状態が不正`);
  if (Number(published.price || 0) !== Number(article.priceJpy || 0)) throw new Error(`${article.key}: 価格が catalog と不一致 (${published.price})`);
  const { free, pay } = splitPublishedBody(String(published.body || ""), published.separator);
  const publicBefore = await fetchPublicNote(noteKey);
  if (String(publicBefore.body || "") !== free) throw new Error(`${article.key}: 所有者 API の無料部分と公開 API の本文が一致しない (分割位置を再確認)`);
  const attachmentsBefore = (pay.match(/embedded-service="attachment"/g) || []).length;
  const unsupported = findUnsupportedNumbers(spec, `${published.name || ""} ${String(published.body || "").replace(/<[^>]+>/g, " ")}`);
  if (unsupported.length) throw new Error(`${article.key}: spec の数値が本文に無い: ${unsupported.join(", ")}`);
  const paidProbe = pay.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);

  // サンプル画像: 未アップロードのものだけ presigned S3 post で上げ、spec へ書き戻す
  for (const sample of spec.samples || []) {
    if (sample.uploadedUrl && sample.width && sample.height) continue;
    if (!options.commit) { console.log(`  [dry-run] upload pending: ${sample.file}`); continue; }
    const filePath = resolve(ROOT, sample.file);
    if (!existsSync(filePath)) throw new Error(`sample file が無い: ${sample.file}`);
    Object.assign(sample, await uploadImage(ctx, filePath));
    saveSpec(specPath, spec);
    console.log(`  uploaded ${basename(filePath)} → ${sample.uploadedUrl} (${sample.width}×${sample.height})`);
  }

  let composed;
  try {
    composed = composeFreeBody(free, spec);
  } catch (error) {
    if (!options.commit && /未アップロード/.test(error.message)) {
      console.log(`  [dry-run] ${article.key}: 画像アップロード後に本文を組み立てる (${error.message})`);
      return { status: "dry-run", key: article.key };
    }
    throw error;
  }
  if (composed.changes.length === 0) {
    console.log(`  ${article.key}: already compliant (intro/source ともに本文にある)`);
    return { status: "already_compliant", key: article.key };
  }
  const newSeparator = composed.separatorId || published.separator;
  const newBody = composed.html + pay;
  console.log(`  ${article.key}: changes=${composed.changes.join("+")} free ${free.length}→${composed.html.length} chars, pay ${pay.length} (attachments ${attachmentsBefore}), separator ${published.separator}→${newSeparator}`);
  if (!options.commit) return { status: "dry-run", key: article.key, changes: composed.changes };

  // editor を開いて「公開に進む」→ 更新する。PUT を横取りして本文 / separator だけ差し替える。
  const page = await ctx.newPage();
  const state = { status: null };
  try {
    await page.route("**/api/v1/text_notes/**", async (route) => {
      const request = route.request();
      if (request.method() !== "PUT") { await route.continue(); return; }
      try {
        const payload = request.postDataJSON();
        if (Number(payload.price || 0) !== Number(published.price || 0)) throw new Error("price changed before update");
        if (!Array.isArray(payload.hashtags) || payload.hashtags.length !== (published.hashtag_notes || []).length) {
          throw new Error(`hashtags changed before update (${payload.hashtags?.length})`);
        }
        payload.free_body = composed.html;
        payload.pay_body = pay;
        payload.separator = newSeparator;
        state.sent = { freeLength: composed.html.length, payLength: pay.length, separator: newSeparator, hashtags: payload.hashtags.length };
        await route.continue({ postData: JSON.stringify(payload), headers: { ...request.headers(), "content-type": "application/json" } });
      } catch (error) {
        state.guardError = error.message;
        await route.fulfill({ status: 409, contentType: "application/json", body: '{"error":"blocked by landing guard"}' });
      }
    });
    page.on("response", (response) => {
      const request = response.request();
      if (request.method() === "PUT" && request.url().includes("/api/v1/text_notes/")) state.status = response.status();
    });
    await page.goto(`https://editor.note.com/notes/${noteKey}/edit?draft_reedit=true`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_800);
    if (await page.locator('[contenteditable="true"][role="textbox"]').count() !== 1) throw new Error("記事編集画面を確認できません");
    await page.getByRole("button", { name: "公開に進む" }).click();
    await page.locator('[placeholder="ハッシュタグを追加する"]').waitFor({ state: "visible", timeout: 15_000 });
    const areaButton = page.getByRole("button", { name: "有料エリア設定", exact: true });
    if (await areaButton.count() !== 1) throw new Error("有料エリア設定ボタンを確認できません (有料設定が外れている?)");
    // 下書きに有料ラインが無い (separator null) と「更新する」が出ない。UI 上はどこかにラインを置けばよく、
    // 実際の境界は PUT payload の separator / free_body / pay_body で決める (2026-09-20 実測: 中断 run の下書きで再現)。
    await areaButton.click();
    await page.waitForTimeout(1_500);
    const pressed = page.locator("#paywall-line[aria-pressed='true']");
    if (await pressed.count() === 0) {
      const lineButtons = page.getByRole("button", { name: "ラインをこの場所に変更", exact: true });
      if (await lineButtons.count() === 0) throw new Error("有料ラインの候補ボタンが見つかりません");
      await lineButtons.first().click();
      await page.waitForTimeout(1_000);
      if (await page.locator("#paywall-line[aria-pressed='true']").count() === 0) throw new Error("有料ラインを置けませんでした");
    }
    const updateButton = page.getByRole("button", { name: "更新する", exact: true });
    await updateButton.first().waitFor({ state: "visible", timeout: 15_000 });
    await updateButton.first().click();
    for (let attempt = 0; attempt < 20 && !Number.isInteger(state.status); attempt += 1) await page.waitForTimeout(500);
    if (!Number.isInteger(state.status)) throw new Error(`更新APIが発火しません: ${JSON.stringify(state)}`);
    if (state.status < 200 || state.status >= 300) throw new Error(state.guardError || `更新APIが失敗: ${JSON.stringify(state)}`);
  } finally {
    await page.close().catch(() => {});
  }

  // live 検証: 所有者 API (全文) と公開 API (無料部分) の両方
  let live; let publicAfter;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((r) => setTimeout(r, 1_500));
    live = await fetchOwnerNote(ctx, noteKey);
    publicAfter = await fetchPublicNote(noteKey);
    if (live.separator === newSeparator && String(publicAfter.body || "").includes(escapeHtml(spec.source).slice(0, 40))) break;
  }
  const liveBody = String(live.body || "");
  const publicBody = String(publicAfter.body || "");
  const checks = {
    status: live.status === "published" && live.user?.urlname === "stats47",
    price: Number(live.price || 0) === Number(published.price || 0),
    separator: live.separator === newSeparator,
    hashtags: (live.hashtag_notes || []).length === (published.hashtag_notes || []).length,
    freeMatches: publicBody === composed.html,
    payPreserved: liveBody.endsWith(pay),
    attachments: (liveBody.match(/embedded-service="attachment"/g) || []).length === attachmentsBefore,
    paidHidden: !publicBody.includes(paidProbe),
    images: (spec.samples || []).every((sample) => publicBody.includes(sample.uploadedUrl)),
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) throw new Error(`${article.key}: live 検証失敗 ${failed.join(",")} ${JSON.stringify({ sent: state.sent, liveSeparator: live.separator, publicLen: publicBody.length, liveLen: liveBody.length })}`);
  spec.appliedAt = new Date().toISOString();
  saveSpec(specPath, spec);
  console.log(`  ${article.key}: UPDATED ${article.noteUrl} checks=${Object.keys(checks).length} ok`);
  return { status: "updated", key: article.key, changes: composed.changes };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.slug && !options.all) throw new Error("--slug <key> または --all を指定");
  const source = catalog();
  const targets = source.articles.filter((article) => article.isPaid && article.noteUrl
    && (options.all ? existsSync(join(SPEC_DIR, `${article.key}.json`)) : article.key === options.slug));
  if (targets.length === 0) throw new Error("対象記事なし (isPaid かつ spec あり)");
  console.log(`=== paid landing patch ${options.commit ? "(★COMMIT)" : "(dry-run)"} : ${targets.length} 記事 ===`);
  const ctx = await launchContext({ headless: true });
  const results = [];
  try {
    console.log(`account gate: ${await assertAccount(ctx)}`);
    for (const article of targets) {
      try {
        results.push(await processArticle(ctx, article, options));
      } catch (error) {
        console.error(`  ${article.key}: FAIL ${error.message}`);
        results.push({ status: "failed", key: article.key, error: error.message });
      }
    }
  } finally {
    await ctx.close();
  }
  console.log(JSON.stringify({ results }, null, 0));
  if (results.some((result) => result.status === "failed")) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await main(); } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
}
