/**
 * coconala-session.mjs — ココナラ Playwright 自動操作の共有セッション基盤 (stats47)
 * ---------------------------------------------------------------------------
 * doboku-note の同名基盤を stats47 へ移植。永続プロファイル + ログイン gate +
 * account assert 方式。ココナラ専用の永続プロファイル
 * (.local/playwright-coconala-profile) を使い、ログイン状態を跨いで保持する。
 *
 * ★アカウント分離 (最重要): doboku-note とは別アカウント。プロファイルディレクトリも
 *   coconala-account.json も stats47 専用で、dobokunote のものを流用しない。
 *   sellerName は coconala-account.json に stats47 の出品者名を入れると厳格 assert に
 *   なる (未設定の間は「ログイン済み」のみ確認 = 誤アカウント防止が弱いので早期設定を推奨)。
 *
 * SSOT の違い (doboku との差):
 *   - doboku: カタログ src/lib/coconala-services.ts + listings JSON の二層。
 *   - stats47: 商品設計 SSOT は packages/product-factory (ProductDefinition・serviceUrl
 *     フィールドを持たない)。ここでは coconala 出品用の内容 (title/price/category/body 等) と
 *     公開状態 (status/serviceUrl/listedAt) を .claude/config/coconala-listings.json に
 *     一元化する。product-factory の型は歪めない (出品状態を product TS に書き戻さない)。
 *
 * 安全弁 (収益アカウントのため note/doboku と同思想):
 *   - launchContext: 永続プロファイル。初回だけ headed でユーザーが手動ログイン。
 *   - waitForLogin: ログイン済み状態を polling で確認 (未ログインなら手動ログインを待つ)。
 *   - assertAccount: 期待 sellerName と一致を assert。不一致は呼び出し側で即中断。
 *       sellerName 未設定時は「ログイン済み」のみ確認する。
 *
 * log/エラーは呼び出し側のスクリプトが握る。ここは部品のみ。
 * ---------------------------------------------------------------------------
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// このファイル: .claude/scripts/coconala/lib/coconala-session.mjs → repo root は 4 つ上。
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

// ★プロファイルは本体チェックアウト固定 (worktree 分裂で「毎回ログイン」になるのを防ぐ)。
//   worktree から実行してもここを共有する。config/state/debug は ROOT (実行元) 相対のまま。
const PROFILE_ROOT = '/Users/minamidaisuke/stats47';
export const PROFILE = join(PROFILE_ROOT, '.local/playwright-coconala-profile');

export const ACCOUNT_PATH = join(ROOT, '.claude/config/coconala-account.json');
export const LISTINGS_PATH = join(ROOT, '.claude/config/coconala-listings.json');
export const ASSETS_DIR = join(ROOT, '.claude/config/coconala/assets');
export const DEBUG_DIR = join(ROOT, '.local/coconala-debug');
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** coconala-account.json を読む (無ければ空オブジェクト) */
export function readAccount() {
  try {
    return JSON.parse(readFileSync(ACCOUNT_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * --image の値を絶対パスへ解決する。bare 名 (スラッシュ無し) は商品画像の既定ディレクトリ
 * `.claude/config/coconala/assets/` に解決する (cwd 相対で ENOENT → 下書き作成後にクラッシュ →
 * orphan draft が残る事故を防ぐため。ブラウザ操作より前に呼ぶ)。
 * @returns {{ok:boolean, abs?:string, reason?:string}}
 */
export function resolveImagePath(image) {
  if (!image) return { ok: true, abs: null };
  let abs;
  if (image.startsWith('/')) abs = image;
  else if (image.includes('/')) abs = join(ROOT, image); // repo 相対
  else abs = join(ASSETS_DIR, image); // bare 名 → assets 既定
  if (!existsSync(abs)) return { ok: false, reason: `画像が見つからない: ${abs}` };
  return { ok: true, abs };
}

/**
 * coconala-listings.json を読む (stats47 の coconala 出品 SoT)。
 * 各 product エントリは title/priceYen/status/serviceUrl/listedAt (= カタログ相当) と
 * catchphrase/category/genreFacets/provisionFormat/body/purchaseNote/deliveryDays/faq/options
 * (= listings 相当) を併せ持つ。
 * @returns {{listings: Record<string, object>}}
 */
function readListingsFile() {
  try {
    const j = JSON.parse(readFileSync(LISTINGS_PATH, 'utf8'));
    return { listings: j.listings || {} };
  } catch {
    return { listings: {} };
  }
}

/**
 * カタログ相当のサブセットを返す (id/status/serviceUrl/priceYen/title/listedAt)。
 * doboku の readCatalog と同じ戻り値形なので publish/edit/delete-draft はそのまま使える。
 * @returns {Record<string, {id,status,serviceUrl,priceYen,title,listedAt}>}
 */
export function readCatalog() {
  const { listings } = readListingsFile();
  const out = {};
  for (const [id, e] of Object.entries(listings)) {
    out[id] = {
      id,
      status: e.status || 'draft',
      serviceUrl: e.serviceUrl || '',
      priceYen: typeof e.priceYen === 'number' ? e.priceYen : null,
      title: e.title || '',
      listedAt: e.listedAt || null,
    };
  }
  return out;
}

/** listings 相当 (内容フィールド一式) を返す。 */
export function readListings() {
  const { listings } = readListingsFile();
  const out = {};
  for (const [id, e] of Object.entries(listings)) {
    out[id] = {
      catchphrase: e.catchphrase,
      category: e.category,
      genreFacets: e.genreFacets || [],
      provisionFormat: e.provisionFormat || '1',
      body: e.body,
      purchaseNote: e.purchaseNote,
      deliveryDays: e.deliveryDays,
      faq: e.faq || [],
      options: e.options || [],
    };
  }
  return out;
}

/**
 * coconala-listings.json の該当 product を status:'listed' + serviceUrl + listedAt に書き戻す。
 * product-factory の TS は触らない (出品状態はこの JSON が持つ)。
 * @returns {boolean} 成否
 */
export function writeBackCatalog(id, url, today) {
  try {
    const j = JSON.parse(readFileSync(LISTINGS_PATH, 'utf8'));
    if (!j.listings || !j.listings[id]) return false;
    const day = today || new Date().toISOString().slice(0, 10);
    j.listings[id].status = 'listed';
    j.listings[id].serviceUrl = url;
    j.listings[id].listedAt = day;
    writeFileSync(LISTINGS_PATH, JSON.stringify(j, null, 2) + '\n');
    return true;
  } catch {
    return false;
  }
}

/**
 * 永続プロファイルで Chrome を起動。channel:chrome + proxy + ignoreHTTPSErrors。
 * headless は既定 false (ログイン状態の目視・初回ログインのため)。
 */
export async function launchContext({ headless = false } = {}) {
  mkdirSync(PROFILE, { recursive: true });
  return chromium.launchPersistentContext(PROFILE, {
    headless,
    channel: 'chrome',
    proxy: PROXY ? { server: PROXY } : undefined,
    ignoreHTTPSErrors: true,
    viewport: { width: 1366, height: 1000 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
}

// ログイン確認は /mypage/dashboard を使う (/mypage は描画が重く domcontentloaded でも
// 60s タイムアウトすることがある。dashboard は安定して返る)。
const LOGIN_CHECK_URL = 'https://coconala.com/mypage/dashboard';

/** goto を軽リトライで堅牢化 (重いページの単発タイムアウトを吸収) */
async function gotoResilient(page, url, { tries = 2, timeout = 45000 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      return true;
    } catch {
      if (i === tries - 1) return false;
      await sleep(1500);
    }
  }
  return false;
}

/**
 * ログイン済み状態を待つ。coconala.com/mypage/dashboard を開き、ログインフォームでなく
 * マイページ内容が描画されるまで polling する。初回は headed 画面でユーザーが
 * 手動ログインするのを待つ (最大 waitMinutes 分)。
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
export async function waitForLogin(page, { waitMinutes = 6, tag = '[login]' } = {}) {
  await gotoResilient(page, LOGIN_CHECK_URL);
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {}
  const deadline = Date.now() + waitMinutes * 60_000;
  let warned = false;
  let lastNudge = Date.now();
  /**
   * 現在の画面状態を読む。
   *
   * ★遷移中に落ちてはならない (2026-08-12 に KDP 側で実測)。ログイン中は人がボタンを押すたびに
   *   ページが遷移し、その最中に page.evaluate を呼ぶと実行コンテキストが壊れて例外になる。
   *   捕まえていないと**人がログインを始めた瞬間にスクリプトが落ちる**。
   *   遷移は待機中のあたりまえの状態なので、読めなければ「まだ待つ」として次の周回に回す。
   */
  const readState = async () => {
    try {
      return await page.evaluate(() => {
        const url = location.href;
        const bodyText = document.body?.innerText || '';
        const onLogin = /\/login|\/signup/.test(url) || /ログイン|会員登録/.test(document.title || '');
        const signedIn =
          /マイページ|出品管理|取引管理|お知らせ|ログアウト/.test(bodyText) ||
          !!document.querySelector('[href*="/mypage"], [href*="/logout"], [data-testid*="user"], img[alt*="プロフィール"]');
        return { url, onLogin, signedIn };
      });
    } catch {
      return null;
    }
  };

  while (Date.now() < deadline) {
    const state = await readState();
    // 遷移中で読めなかった = まだ待つ。ここで落とさない。
    if (state && !state.onLogin && state.signedIn) return { ok: true };
    if (!warned) {
      console.log(`${tag} 未ログイン。開いた Chrome で stats47 のココナラアカウントにログインしてください (最大 ${waitMinutes} 分待機)…`);
      warned = true;
    }
    await sleep(3000);
    // ★ログイン画面にいる間は絶対に遷移させない (2026-08-12 に KDP 側で実測して発覚)。
    //   もとは 3 秒ごとにログイン確認 URL へ goto しており、**人がメールアドレスを打っている
    //   最中にページごと飛ばしていた**。人のログインを待つのが目的なのだから、
    //   待っている画面を奪ってはならない。関係ない場所に落ちたときだけ 30 秒に 1 回戻す。
    // ★ここで遷移してよいのは「ページが無い」ときだけ。ログインのどの段階にいるかを
    //   URL から当てにいくと必ず取りこぼす (実測: amazon.co.jp のトップに一時的に
    //   落ちる場面があり、そこで遷移すると認証フローが切れる)。
    //   **画面を持っているのは人**なので、白紙とエラーページ以外は触らない。
    const url = page.url();
    const blank = !url || url === "about:blank" || /^chrome-error:/.test(url);
    if (blank && Date.now() - lastNudge > 30_000) {
      lastNudge = Date.now();
      await gotoResilient(page, LOGIN_CHECK_URL, { tries: 1 });
    }
  }
  return { ok: false, reason: `ログイン待機がタイムアウト (${waitMinutes}分)` };
}

/**
 * ログイン中のアカウントが期待アカウントと一致するか assert。
 * 照合は 2 段:
 *   1) userId (coconala-account.json の userId or profileUrl の users/NNNN) —★推奨・堅牢。
 *      マイページはログイン中アカウント自身のプロフィールリンク (a[href*="/users/NNNN"]) を
 *      常に露出するため、新規セラー (出品0件で表示名が本文に出ない) でも確実に判定でき、
 *      別アカウント (dobokunote 等) は id 不一致で確実に弾ける。
 *   2) sellerName のテキスト照合 (userId 未設定時のフォールバック) — /mypage/services_lists 本文。
 * どちらも未設定なら「ログイン済み」だけを確認して pass する。
 * @returns {Promise<{ok:boolean, seller?:string, userId?:string, reason?:string}>}
 */
export async function assertAccount(page, { tag = '[account]' } = {}) {
  const acct = readAccount();
  const expectedName = (acct.sellerName || '').trim();
  const expectedId = String(acct.userId || (acct.profileUrl || '').match(/\/users\/(\d+)/)?.[1] || '').trim();

  if (!expectedName && !expectedId) {
    console.log(`${tag} sellerName/userId 未設定のため「ログイン済み」のみ確認 (coconala-account.json に userId を入れると厳格 assert = 誤アカウント操作を確実に防げる)`);
    return { ok: true, seller: '' };
  }

  // 1) userId 照合 (堅牢): ログイン中セッション自身のプロフィール user id を拾う
  if (expectedId) {
    let foundId = '';
    for (const url of ['https://coconala.com/mypage/dashboard', 'https://coconala.com/mypage']) {
      await gotoResilient(page, url);
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch {}
      for (let i = 0; i < 4 && !foundId; i++) {
        foundId = await page.evaluate(() => {
          const hrefs = Array.from(document.querySelectorAll('a[href*="/users/"]')).map((a) => a.getAttribute('href') || '');
          const m = hrefs.map((h) => h.match(/\/users\/(\d+)/)).find(Boolean);
          return m ? m[1] : '';
        });
        if (!foundId) await sleep(1500);
      }
      if (foundId) break;
    }
    if (foundId && foundId === expectedId) {
      console.log(`${tag} OK: ログイン中アカウント users/${foundId} が期待 userId と一致`);
      return { ok: true, seller: expectedName, userId: foundId };
    }
    if (foundId && foundId !== expectedId) {
      return { ok: false, reason: `別アカウントでログイン中 (期待 users/${expectedId} / 実 users/${foundId} = dobokunote 等との取り違えの疑い)` };
    }
    // foundId 空 = id を取得できず照合不能。sellerName があればフォールバック、無ければ中断。
    if (!expectedName) {
      return { ok: false, reason: `ログイン中の userId を取得できず照合不能 (期待 users/${expectedId})` };
    }
    console.log(`${tag} userId を取得できず sellerName テキスト照合にフォールバック`);
  }

  // 2) sellerName テキスト照合 (フォールバック)
  await gotoResilient(page, 'https://coconala.com/mypage/services_lists');
  try {
    await page.waitForLoadState('networkidle', { timeout: 12000 });
  } catch {}
  let contains = false;
  for (let i = 0; i < 6; i++) {
    contains = await page.evaluate((exp) => (document.body?.innerText || '').includes(exp), expectedName);
    if (contains) break;
    await sleep(1500);
  }
  if (contains) {
    console.log(`${tag} OK: マイページに期待アカウント "${expectedName}" を確認`);
    return { ok: true, seller: expectedName };
  }
  return { ok: false, seller: '', reason: `マイページに期待 sellerName "${expectedName}" が見つからない (別アカウントでログイン中の疑い)` };
}

/** .local/coconala-debug/ 配下のスクショパスを返す */
export function shotPath(name) {
  mkdirSync(DEBUG_DIR, { recursive: true });
  return join(DEBUG_DIR, name);
}
