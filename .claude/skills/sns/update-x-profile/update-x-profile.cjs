/**
 * /update-x-profile — X (@stats47jp373) の bio + 固定ポスト + リプライツリー一括更新
 *
 * 詳細: .claude/skills/sns/update-x-profile/SKILL.md
 *
 * 使い方:
 *   node .claude/skills/sns/update-x-profile/update-x-profile.cjs all \
 *     --magazine-url "https://note.com/stats47/m/mXXXX" \
 *     --bio-variant A --pin-variant 2 \
 *     [--dry-run] [--skip-bio] [--skip-pin] [--skip-replies] \
 *     [--media /path/to/video.mp4]
 *
 *   node .claude/skills/sns/update-x-profile/update-x-profile.cjs review
 */
const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = "/Users/minamidaisuke/stats47";
const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-x-profile");
const DEBUG_DIR = path.join(PROJECT_ROOT, ".local/playwright-x-profile-debug");
const SKILL_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/sns/update-x-profile"
);
const STATE_PATH = path.join(SKILL_DIR, "state.json");
const DOC_PATH = path.join(
  PROJECT_ROOT,
  "docs/10_SNS戦略/05_SNSプロフィール.md"
);

const playwright = require(path.join(PROJECT_ROOT, "node_modules/playwright"));

// ─── 引数 ─────────────────────────────────────
const args = process.argv.slice(2);
const MODE = (args[0] && !args[0].startsWith("--") ? args[0] : "all").toLowerCase();
function flag(name) {
  return args.includes(`--${name}`);
}
function val(name, fallback = null) {
  const i = args.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return fallback;
}
const DRY_RUN = flag("dry-run");
const SKIP_BIO = flag("skip-bio") || MODE === "pin" || MODE === "replies";
const SKIP_PIN = flag("skip-pin") || MODE === "bio" || MODE === "replies";
const SKIP_REPLIES = flag("skip-replies") || MODE === "bio" || MODE === "pin";
const MAGAZINE_URL = val("magazine-url");
const BIO_VARIANT = (val("bio-variant", "A") || "A").toUpperCase();
const PIN_VARIANT = String(val("pin-variant", "2") || "2");
const MEDIA_PATH = val("media");

console.log(`🔧 mode=${MODE} dry=${DRY_RUN} bio=${BIO_VARIANT} pin=${PIN_VARIANT}`);

// ─── 文案抽出 (docs/10_SNS戦略/05_SNSプロフィール.md) ───────
function extractVariant(label) {
  const doc = fs.readFileSync(DOC_PATH, "utf-8");
  // section heading e.g. "#### 案 A —" or "#### 案 ① —" + fenced block
  const re = new RegExp(
    `####\\s*案\\s*${label}\\s*[—\\-][^\\n]*\\n+(?:[^\\n]*\\n)*?\`\`\`\\n([\\s\\S]*?)\\n\`\`\``,
    "m"
  );
  const m = doc.match(re);
  if (!m) throw new Error(`docs から 案 ${label} を抽出失敗: ${DOC_PATH}`);
  return m[1].trim();
}
function extractReplyTemplate(label) {
  const doc = fs.readFileSync(DOC_PATH, "utf-8");
  const re = new RegExp(
    `####\\s*${label}\\s+[—\\-][^\\n]*\\n+(?:[^\\n]*\\n)*?\`\`\`\\n([\\s\\S]*?)\\n\`\`\``,
    "m"
  );
  const m = doc.match(re);
  if (!m) throw new Error(`docs から ${label} 抽出失敗`);
  return m[1].trim();
}

// ─── UTM 付与 ─────────────────────────────────
function addUtm(url, content) {
  const u = new URL(url);
  u.searchParams.set("utm_source", "x");
  u.searchParams.set("utm_medium", content.startsWith("L") ? "pinned_reply" : "pinned");
  u.searchParams.set("utm_campaign", "profile_2026q2");
  u.searchParams.set("utm_content", content);
  return u.toString();
}

// ─── state.json ───────────────────────────────
function loadState() {
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
}
function saveState(s) {
  const bak = STATE_PATH + "." + Date.now() + ".bak";
  fs.copyFileSync(STATE_PATH, bak);
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
  console.log(`💾 state.json updated (backup: ${path.basename(bak)})`);
}

// ─── cleanup trap ─────────────────────────────
let ctxRef = null;
async function cleanup() {
  try {
    if (ctxRef) await ctxRef.close();
  } catch {}
}
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(130);
});
process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(143);
});

// ─── Playwright 操作 ──────────────────────────
async function screenshot(page, label) {
  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const p = path.join(DEBUG_DIR, `${ts}_${label}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

async function ensureLogin(page) {
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (/\/(login|i\/flow\/login)/.test(page.url())) {
    throw new Error("X 未ログイン。publish-x で先にログインしてください");
  }
}

// bio を更新
async function updateBio(page, bioText) {
  console.log("\n━━━ bio 更新 ━━━");
  console.log(bioText);
  await page.goto("https://x.com/settings/profile", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3500);
  await screenshot(page, "bio-before");

  // 「自己紹介」/ "Bio" textarea
  const bioBox = page
    .locator(
      'textarea[name="description"], textarea[aria-label*="自己紹介"], textarea[aria-label*="Bio"]'
    )
    .first();
  await bioBox.waitFor({ state: "visible", timeout: 15000 });
  // 既存内容を全消去
  await bioBox.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+A" : "Control+A"
  );
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);
  await bioBox.type(bioText, { delay: 20 });
  await page.waitForTimeout(800);
  await screenshot(page, "bio-typed");

  if (DRY_RUN) {
    console.log("🧪 DRY RUN: bio save 直前で停止");
    return false;
  }

  // 「保存」/ "Save" ボタン
  const saveBtn = page
    .locator(
      '[data-testid="Profile_Save_Button"], button:has-text("保存"), button:has-text("Save")'
    )
    .first();
  await saveBtn.click();
  await page.waitForTimeout(4000);
  await screenshot(page, "bio-saved");
  return true;
}

// 旧 pinned を解除
async function unpinOld(page, handle) {
  console.log("\n━━━ 旧 pinned 解除 ━━━");
  await page.goto(`https://x.com/${handle}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);

  // pinned post 探索
  const articles = page.locator('article[data-testid="tweet"]');
  const count = await articles.count();
  let pinnedHandle = null;
  for (let i = 0; i < Math.min(count, 5); i++) {
    const art = articles.nth(i);
    const ctx = await art
      .locator('[data-testid="socialContext"]')
      .first()
      .textContent()
      .catch(() => "");
    if (ctx && /Pinned|固定/.test(ctx)) {
      pinnedHandle = art;
      break;
    }
  }
  if (!pinnedHandle) {
    console.log("ℹ️  既存 pinned なし、スキップ");
    return;
  }
  if (DRY_RUN) {
    console.log("🧪 DRY RUN: pin 解除はスキップ");
    return;
  }
  // "..." メニュー
  const menuBtn = pinnedHandle.locator('[data-testid="caret"]').first();
  await menuBtn.click();
  await page.waitForTimeout(1500);
  // "プロフィールから固定を外す" / "Unpin from profile"
  const unpinItem = page
    .locator(
      'div[role="menuitem"]:has-text("固定を外す"), div[role="menuitem"]:has-text("Unpin from profile")'
    )
    .first();
  await unpinItem.click();
  await page.waitForTimeout(1500);
  // 確認ダイアログ
  const confirmBtn = page
    .locator(
      '[data-testid="confirmationSheetConfirm"], button:has-text("固定を外す"), button:has-text("Unpin")'
    )
    .first();
  await confirmBtn.click();
  await page.waitForTimeout(2500);
  console.log("✅ 旧 pinned 解除完了");
}

// 新規ポストを compose 経由で作成し tweet_id を返す
async function composePost({ page, text, media, replyToUrl = null }) {
  if (replyToUrl) {
    await page.goto(replyToUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    // reply ボタン
    const replyBtn = page.locator('[data-testid="reply"]').first();
    await replyBtn.click();
    await page.waitForTimeout(2000);
  } else {
    await page.goto("https://x.com/compose/post", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);
  }

  const textbox = page.getByRole("textbox").first();
  await textbox.waitFor({ state: "visible", timeout: 15000 });

  if (media && fs.existsSync(media)) {
    const fileInput = page.locator('input[data-testid="fileInput"]').first();
    await fileInput.setInputFiles([media]);
    console.log(`📷 媒体添付: ${path.basename(media)}`);
    await page.waitForTimeout(media.toLowerCase().endsWith(".mp4") ? 25000 : 6000);
  }

  await textbox.click();
  await textbox.type(text, { delay: 12 });
  await page.waitForTimeout(1500);

  if (DRY_RUN) {
    await screenshot(page, "compose-dry");
    console.log("🧪 DRY RUN: 投稿直前で Escape して中止");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    await page.keyboard.press("Escape");
    return null;
  }

  // tweetButton (新規) or tweetButtonInline (返信)
  const sendBtn = page
    .locator(
      '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
    )
    .first();
  await sendBtn.click();

  // 投稿後 URL を待つ: compose の場合 /home or /<handle> に遷移、reply は元 URL 維持
  await page.waitForTimeout(5500);

  // 直近自分のポストの tweet_id を取得するためプロフィール TL を覗く
  // (compose は遷移が一定でないため確実な方法として TL から)
  const handle = STATE.handle;
  await page.goto(`https://x.com/${handle}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const tweetId = await page.evaluate(() => {
    const a = document.querySelector('article[data-testid="tweet"] a[href*="/status/"]');
    if (!a) return null;
    const m = a.getAttribute("href").match(/\/status\/(\d+)/);
    return m ? m[1] : null;
  });
  if (!tweetId) console.warn("⚠️  tweet_id 取得失敗 (要手動確認)");
  return tweetId;
}

// ピン留め
async function pinToProfile(page, tweetUrl) {
  console.log(`\n━━━ pin to profile: ${tweetUrl} ━━━`);
  if (DRY_RUN) {
    console.log("🧪 DRY RUN: pin はスキップ");
    return;
  }
  await page.goto(tweetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const menuBtn = page.locator('[data-testid="caret"]').first();
  await menuBtn.click();
  await page.waitForTimeout(1500);
  const pinItem = page
    .locator(
      'div[role="menuitem"]:has-text("プロフィールに固定"), div[role="menuitem"]:has-text("Pin to your profile"), div[role="menuitem"]:has-text("プロフィールへの固定")'
    )
    .first();
  await pinItem.click();
  await page.waitForTimeout(1500);
  const confirmBtn = page
    .locator('[data-testid="confirmationSheetConfirm"], button:has-text("固定"), button:has-text("Pin")')
    .first();
  await confirmBtn.click();
  await page.waitForTimeout(2500);
  console.log("✅ pin 完了");
}

// ─── L3 TOP3 取得 (state.json から or プレースホルダー) ──────
async function resolveTopArticles() {
  // 簡易: state.json.replies.L3_top_articles.top_articles に手動入力されていれば使う
  const s = loadState();
  const existing = s.replies?.L3_top_articles?.top_articles || [];
  if (existing.length >= 3) return existing.slice(0, 3);
  // 未設定 → ユーザに渡す用のテンプレ
  console.warn(
    "⚠️  state.json に top_articles 未設定。--top-articles JSON で渡すか、L3 スキップ"
  );
  return null;
}

// ─── メイン ───────────────────────────────────
const STATE = loadState();

(async () => {
  // 文案組み立て
  const bioText = !SKIP_BIO ? extractVariant(BIO_VARIANT) : null;
  const pinLabel = { 1: "①", 2: "②", 3: "③" }[PIN_VARIANT] || PIN_VARIANT;
  const pinText = !SKIP_PIN ? extractVariant(pinLabel) : null;

  let l1Text = null,
    l2Text = null,
    l3Text = null;
  let l1Url = null,
    l2Url = MAGAZINE_URL,
    l3Articles = null;
  if (!SKIP_REPLIES) {
    l1Url = addUtm("https://note.com/stats47", "note_home_l1");
    l1Text = extractReplyTemplate("L1").replace(
      "note.com/stats47",
      l1Url.replace(/^https?:\/\//, "")
    );

    if (MAGAZINE_URL) {
      const utmMag = addUtm(MAGAZINE_URL, "magazine_koumuin");
      l2Text = extractReplyTemplate("L2").replace("{{MAGAZINE_URL}}", utmMag);
      l2Url = utmMag;
    } else {
      console.warn("⚠️  --magazine-url 未指定: L2 をスキップ");
    }

    l3Articles = await resolveTopArticles();
    if (l3Articles) {
      l3Text = extractReplyTemplate("L3");
      l3Articles.forEach((a, i) => {
        const n = i + 1;
        const url = addUtm(a.url, `top_${a.slug || n}`);
        l3Text = l3Text
          .replace(`{{TOP${n}_TITLE}}`, a.title)
          .replace(`{{TOP${n}_URL}}`, url);
      });
    } else {
      console.warn("⚠️  L3 (TOP3 記事) スキップ");
    }
  }

  // プレビュー
  console.log("\n━━━ プレビュー ━━━");
  if (bioText) console.log("[bio]\n" + bioText + `\n(${bioText.length} chars)\n`);
  if (pinText) console.log("[pinned]\n" + pinText + `\n(${pinText.length} chars)\n`);
  if (l1Text) console.log("[L1]\n" + l1Text + `\n(${l1Text.length} chars)\n`);
  if (l2Text) console.log("[L2]\n" + l2Text + `\n(${l2Text.length} chars)\n`);
  if (l3Text) console.log("[L3]\n" + l3Text + `\n(${l3Text.length} chars)\n`);

  if (MODE === "preview") {
    console.log("preview only — exit");
    process.exit(0);
  }

  // Playwright 起動
  const ctx = await playwright.chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  ctxRef = ctx;
  const page = ctx.pages()[0] || (await ctx.newPage());

  const results = {};
  try {
    await ensureLogin(page);

    if (!SKIP_BIO && bioText) {
      const ok = await updateBio(page, bioText);
      results.bio = ok;
    }

    let newTweetId = null;
    if (!SKIP_PIN && pinText) {
      await unpinOld(page, STATE.handle);
      newTweetId = await composePost({
        page,
        text: pinText,
        media: MEDIA_PATH,
      });
      results.pin_tweet_id = newTweetId;
      if (newTweetId) {
        const url = `https://x.com/${STATE.handle}/status/${newTweetId}`;
        await pinToProfile(page, url);
        results.pin = true;
      }
    }

    if (!SKIP_REPLIES) {
      // pin tweet_id を解決 (今 pin したものか既存 state)
      const targetTweetId = newTweetId || STATE.pinned?.tweet_id;
      if (!targetTweetId) {
        console.warn("⚠️  pin tweet_id 不明、リプライ追加スキップ");
      } else {
        const targetUrl = `https://x.com/${STATE.handle}/status/${targetTweetId}`;
        let lastReplyUrl = targetUrl;
        if (l1Text) {
          const id = await composePost({
            page,
            text: l1Text,
            media: null,
            replyToUrl: lastReplyUrl,
          });
          results.L1_tweet_id = id;
          if (id) lastReplyUrl = `https://x.com/${STATE.handle}/status/${id}`;
          await page.waitForTimeout(6000);
        }
        if (l2Text) {
          const id = await composePost({
            page,
            text: l2Text,
            media: null,
            replyToUrl: lastReplyUrl,
          });
          results.L2_tweet_id = id;
          if (id) lastReplyUrl = `https://x.com/${STATE.handle}/status/${id}`;
          await page.waitForTimeout(6000);
        }
        if (l3Text) {
          const id = await composePost({
            page,
            text: l3Text,
            media: null,
            replyToUrl: lastReplyUrl,
          });
          results.L3_tweet_id = id;
          await page.waitForTimeout(6000);
        }
      }
    }

    // state.json 更新
    if (!DRY_RUN) {
      const now = new Date().toISOString();
      const s = loadState();
      s.last_updated = now;
      if (results.bio && bioText) {
        s.bio = { variant: BIO_VARIANT, live_text: bioText, set_at: now };
      }
      if (results.pin_tweet_id && pinText) {
        s.pinned = {
          variant: PIN_VARIANT,
          tweet_id: results.pin_tweet_id,
          live_text: pinText,
          media_path: MEDIA_PATH || null,
          set_at: now,
        };
      }
      if (results.L1_tweet_id) {
        s.replies.L1_note_home = {
          tweet_id: results.L1_tweet_id,
          live_text: l1Text,
          url_with_utm: l1Url,
          set_at: now,
        };
      }
      if (results.L2_tweet_id) {
        s.replies.L2_magazine = {
          tweet_id: results.L2_tweet_id,
          live_text: l2Text,
          magazine_url: MAGAZINE_URL,
          url_with_utm: l2Url,
          set_at: now,
        };
      }
      if (results.L3_tweet_id && l3Articles) {
        s.replies.L3_top_articles = {
          tweet_id: results.L3_tweet_id,
          live_text: l3Text,
          source: "manual",
          top_articles: l3Articles,
          set_at: now,
        };
      }
      // 次回レビュー目安 (4 週間後)
      const next = new Date(Date.now() + 28 * 86400000)
        .toISOString()
        .slice(0, 10);
      s.next_review_recommended = next;
      saveState(s);
    }

    console.log("\n━━━ 結果 ━━━");
    console.log(JSON.stringify(results, null, 2));
    if (!DRY_RUN) {
      console.log(
        `\n次回レビュー目安: ${new Date(Date.now() + 28 * 86400000)
          .toISOString()
          .slice(0, 10)}`
      );
      console.log("→ /update-x-profile review で月次メトリクス取得");
    }
  } catch (e) {
    console.error("❌ error:", e.stack || e.message);
    await screenshot(page, "error");
  } finally {
    await page.waitForTimeout(3000);
    await cleanup();
  }
})().catch(async (e) => {
  console.error(e);
  await cleanup();
  process.exit(1);
});
