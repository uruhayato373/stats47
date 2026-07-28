# Playwright 認証プロファイル運用（stats47）

SNS 自動化（X / Instagram）の Playwright ログインを「毎回入れ直さない」ための、
永続プロファイルの仕組み・置き場所・再ログイン手順・注意点をまとめる。

## 方式：サービスごとの永続プロファイル

各スクリプトは `chromium.launchPersistentContext(PROFILE_DIR, …)` を使い、
Cookie・localStorage をディレクトリごと保持する。**一度ログインすれば以降は再ログイン不要**。
プロファイルはサービス単位で分離し、アカウント取り違え事故を防ぐ。

| プロファイル (`.local/` 配下) | サービス | 使用スクリプト | 状態 |
|---|---|---|---|
| `playwright-x-profile` | X (Twitter) | `.claude/skills/sns/publish-x/publish-x.ts`, `check-x-scheduled.ts`, `update-x-profile/update-x-profile.cjs` | ✅ ログイン済み・稼働中 |
| `playwright-ig-profile` | Instagram | `.claude/scripts/sns/delete-instagram-posts.ts` | ⚠️ **空（未ログイン）** |
| `playwright-meta-profile` | Meta / FB Business Suite | `.claude/skills/archive/sns/schedule-instagram-mbs/…`（archive） | ⚠️ **空（未ログイン）** |
| `playwright-a8-profile` | A8.net (アフィリエイト) | `.claude/skills/ads/scout-asp/scripts/{a8-browser.ts,login.mjs}`, `.claude/scripts/ads/affiliate-status.mjs` | ⚠️ **空（未ログイン）**。`login.mjs` で初回ログイン後に自動 scout (`/scout-asp`) と提携運用 (`/affiliate-operate`) が利用。**A8 は認証がセッション Cookie のため永続プロファイルに残らず、`.local/playwright-a8-state.json` (storageState) の再注入が認証再利用の実体** |
| `playwright-moshimo-profile` | もしもアフィリエイト (af.moshimo.com) — ★口座は **stats47 と doboku-note が同居**（対象は stats47 = `shop_site_id 638943`） | `.claude/scripts/ads/{affiliate-status,affiliate-apply}.mjs` | ⚠️ **空（未ログイン）**。初回に headed で手動ログイン。サイト帰属 assert の SSOT は `.claude/config/affiliate-asp.json` |
| `playwright-afb-profile` | afb / アフィリエイトB (afi-b.com) — ★口座は **stats47 と doboku-note が同居**（対象は stats47 = SID `959426`） | `.claude/scripts/ads/{affiliate-status,affiliate-apply,afb-scan}.mjs` | ⚠️ **空（未ログイン）**。**storageState を別プロセスで復元できず headless も拒否される**ため、ログインから作業完了までを 1 プロセス・headed で完結させる（毎回ログインが要るのは仕様） |
| `playwright-coconala-profile` | ココナラ (coconala.com) — ★**stats47 専用アカウント**（doboku-note の `dobokunote` とは別） | `.claude/scripts/coconala/{coconala-publish,coconala-edit,coconala-delete-draft}.mjs` | ⚠️ **空（未ログイン）**。初回に headed で stats47 のココナラアカウントへ手動ログイン。account assert の SSOT は `.claude/config/coconala-account.json` の `sellerName`（現在空＝要記入） |
| `playwright-kdp-profile` | Amazon KDP (kdp.amazon.com) — ★**stats47 の Amazon/KDP アカウント** | `.claude/scripts/kdp/{login,capture-account,kdp-publish}.mjs` | ⚠️ **空（未ログイン）**。初回に headed で手動ログイン（2FA 含む）。account assert の SSOT は `.claude/config/kdp-account.json` の `accountEmail`/`accountName`（現在空＝要記入）。税務情報・銀行口座の設定は人間工程 |

- `PROFILE_DIR` は各スクリプトで `path.join(PROJECT_ROOT, ".local/playwright-*-profile")` として定義。
- X アカウントは `publish-x.ts --expect-account @<handle>` で照合可能（ログイン中の @handle が一致するまで投稿しない安全ガード）。実運用ハンドル：**（要記入）** / ひも付け Gmail：**（要記入）**。

## 「毎回ログインが必要」になる原因と対策

`.local/` は `.gitignore` 対象（`.gitignore:140`）なので、**`git worktree add` で作った作業ツリーにはプロファイルがコピーされない**。
SNS スクリプトの `PROJECT_ROOT = path.resolve(__dirname, "../../../..")` は実行元 worktree のルートを指すため、
**worktree から実行すると毎回まっさらなプロファイル＝再ログイン**になる。

対策：

- **A（恒久対応・適用済み 2026-07-19）**: worktree 相対だった `publish-x.ts` / `delete-instagram-posts.ts` の
  プロファイル参照を **本体固定の絶対パス**に変更した。既存の `check-x-scheduled.ts` /
  `update-x-profile.cjs` は元から本体絶対パスで整合。実装は各スクリプトで：
  ```ts
  const PROFILE_ROOT = "/Users/minamidaisuke/stats47";   // 本体チェックアウト固定
  const PROFILE_DIR = path.join(PROFILE_ROOT, ".local/playwright-x-profile");
  ```
  `PROJECT_ROOT`（debug/drafts 用）は worktree 相対のまま。**プロファイルのみ本体を共有**する。
  本体から実行した場合は従来と同一パスに解決されるため挙動不変。worktree から実行しても同一ログインを共有する。
- **A'（Mac / Windows 両対応・2026-07-28）**: Mac パスの直書きは Windows で**別ドライブ配下に空プロファイルを掘り、
  「ログイン済みなのに未ログイン」**になる（doboku-note で実際に発生）。`process.platform` で分岐せず、
  **実在するほうを採るフォールバック 1 本**にする。`process.cwd()` は実行ディレクトリ次第でプロファイルが
  分裂するため使わず、**そのファイル自身の位置から解決したリポジトリ root** を second choice にする：
  ```ts
  const MAIN_CHECKOUT = "/Users/minamidaisuke/stats47";              // Mac 本体（worktree 共有用）
  const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  const PROFILE_ROOT = existsSync(MAIN_CHECKOUT) ? MAIN_CHECKOUT : REPO_ROOT;
  ```
  適用済み: `.claude/scripts/ads/lib/asp-browser-base.mjs`（3 ASP 共通基盤）/
  `.claude/skills/ads/scout-asp/scripts/{a8-browser.ts,login.mjs}`。
  **SNS 系（publish-x 等）は未適用**＝Windows では再ログインになる（必要になった時点で同じ形に揃える）。
- **B（運用の補助）**: それでも投稿系は本体リポジトリ `~/stats47` から実行するのが無難（絶対パス固定と両立）。

## 再ログイン手順（プロファイルが空／期限切れのとき）

以下の使い捨てスクリプトで、対象プロファイルを headed ブラウザで開き、手動ログイン後に保存する。

```js
// login.mjs — 一度だけ手動ログインしてプロファイルに保存する
import { chromium } from "playwright";
const dir = process.argv[2];                       // 例: .local/playwright-ig-profile
const url = process.argv[3] ?? "https://x.com/login";
const ctx = await chromium.launchPersistentContext(dir, { headless: false });
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto(url);
console.log("ログインが完了したら、このターミナルで Enter を押す");
process.stdin.once("data", async () => { await ctx.close(); process.exit(0); });
```

```bash
# 本体リポジトリ ~/stats47 で実行すること（worktree 不可）
node login.mjs .local/playwright-x-profile   https://x.com/login
node login.mjs .local/playwright-ig-profile  https://www.instagram.com/accounts/login/
```

- `publish-x.ts --dry-run` でも X プロファイルの状態確認ができる（セレクタ検出まで、実投稿しない）。

## TODO（このプロジェクト固有）

- [ ] `playwright-ig-profile` にログインして永続化する（`delete-instagram-posts.ts` 利用前に必須。上の再ログイン手順を参照）。
- [ ] `playwright-meta-profile` は archive スキルでのみ使用。再開しないなら放置可、再開時はログインが必要。
- [ ] 上表の「実運用ハンドル / ひも付け Gmail」を記入する。
- [x] 対策 A（プロファイルの本体絶対パス固定）を各スクリプトに適用済み（2026-07-19）。

## セキュリティ

- `.local/` 配下のプロファイルには**ログイン Cookie が入る**。`.gitignore` 済みだが、**絶対にコミット・共有しない**。
- 漏洩＝アカウント乗っ取り相当。バックアップを取る場合も暗号化必須。
