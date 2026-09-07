---
title: Playwright認証プロファイル
type: technical-design
status: adopted
updated: 2026-09-07
---

# Playwright認証プロファイル

Playwright を使う運用スクリプトのログイン状態、アカウント照合、復旧方法を定義する。実際にログインできるか、Cookie が有効か等の変動状態は本書へ記録しない。

## 原則

- profile と storage state は `.local/` 配下に置き、git へ commit しない。
- サービスとアカウント用途ごとに profile を分離する。
- 投稿、申請、公開、購入に関わる操作は実行前に対象アカウントを照合する。
- 認証失敗を自動再登録や別アカウントで回避しない。人が headed browser で復旧する。
- 2FA、CAPTCHA、税務・銀行情報、規約同意は人の操作として残す。
- 実行後は `.claude/rules/browser-use-cleanup.md` に従い browser / daemon / tab を閉じる。

## Playwright を使う前の判断（API 代替の可否）

**公式 API がある操作に Playwright を使わない。** API 経路は OAuth scope で権限を最小化でき、ブラウザセッション（サービス全権を持つ Cookie）を扱わず、セッション期限切れによる再ログインも要らない。Playwright は「API が提供されていない操作」だけの最後の手段とする。

判定を誤らないため、**API の有無と利用条件を型定義・公式リファレンスで実際に確認する**。
2026-07-30にはAdSense write methodをgrepで取りこぼし、翌日はmethodの存在だけを見て
一般publisherでも使えると誤認した。`create` / `patch`等の名前だけでなく、利用主体、
product code、対応format、scope、必要roleまで確認する。

| 操作 | 公式 API | 判定 |
|---|---|---|
| AdSense 広告ユニットの作成・更新 | `accounts.adclients.adunits.create` / `patch` は存在するが、AdSense for Platforms 系の制限プロジェクト向けかつ現状 `DISPLAY` のみ。stats47 の利用権限は未証明 | **API化しない。人間が管理画面で実施** |
| GA4 カスタムディメンション作成 | `properties.customDimensions.create` / `patch` / `archive` | **API を使う** |
| GA4 AdSense リンク監査・作成 | `properties.adSenseLinks.list` / `create` / `delete` | 監査はAPI。作成・削除は必要性と承認がある場合だけ個別allowlist化 |
| Instagram 投稿削除 | Graph API `DELETE /<IG_MEDIA_ID>`（`instagram_manage_contents`） | **API を使う** |
| GA4 の Search Console リンク作成 | 無い（Admin API v1alpha の型定義に `searchConsole` の語が無い。`Searchads` は Search Ads 360 で別物） | Playwright |
| GA4 Library の collection 公開 | 無い（Properties サブリソースに Library / Collection が無い） | Playwright |
| Amazon KDP の出品 | 無い（Amazon が公開 API を提供していない） | Playwright |
| note の記事投稿 | 公式 API 無し。非公開エンドポイントは note が保証せず規約・アカウントリスクがある | Playwright |
| A8 の提携申請・広告コード取得 | メディア側の該当 API は見当たらない（A8 の公開 API は広告主・ASP 事業者向けの成果確定／成果連携） | Playwright |
| ココナラ / もしも / afb | **未確認**（推測で「無い」と書かない） | 現状 Playwright |

### CI 実行について

**Playwright 自体は CI で動く。** `pr-quality-check.yml` と `post-deploy-smoke.yml` が `ubuntu-latest`（GitHub ホストランナー）で実行している。CI で足りないのは**認証済みセッション**だけで、Playwright の実行環境ではない。

- **セルフホストランナーは本 repo では使えない。** stats47 は PUBLIC で、GitHub 公式が「セルフホストランナーは private repository のみ推奨。public repository の fork が危険なコードをランナー上で実行しうる」と警告している。
- 認証済みセッションを CI へ渡すなら storage state を Secrets に置く経路になるが、Playwright 公式は state ファイルを「なりすましに使える機密」として repository へのコミットを強く非推奨としている（Secrets については公式ガイダンス無し）。**この方式を採る場合は本書「禁止事項」の Cookie 非 commit 規定との整合を先に決める。**
- セッションは期限切れするため、この経路でも初回作成と期限切れ時の再作成は人の操作として残る。

### Playwright でも取得できないもの（提供側が封じた機能）

**Google Cloud Console は OAuth クライアントの Client Secret の表示を廃止した**（2026-07-31 実機確認）。画面には `****FOrt` のようなマスク表示しか出ず、Console 自身がこう明記している。

> クライアント シークレットの表示とダウンロードは利用できなくなりました。下記のシークレットを紛失した場合は、新しいシークレットを追加してください。

したがって **Secret を Playwright で読み取ることはできない**。セレクタの問題ではなく機能が存在しない。取得できるのは「シークレットを追加」した直後のダイアログだけで、そこを逃すと二度と見られない。

- Secret が要るときは **人が Console で追加し、その場でコピーする**。自動化の対象外とする。
- 自動化スクリプトが「追加」だけ実行して値を取れないと、**使えない Secret が増えるだけ**になる（同日に実際に発生させ、無効化して後始末した）。追加を自動化しない。
- 同種の「作成時にしか表示されない」認証情報（API キー、サービスアカウント鍵）も同じ扱いとする。

### Playwright MCP の位置づけ

MCP は AI エージェントを live なブラウザセッションへ接続する仕組みで、**CI/CD の無人自動化の手段ではない**。CI で回すのはコミット済みの決定的スクリプトとする（CLAUDE.md 原則 5「モデルは判断時のみ。決定的なものはコードで処理する」と同旨。無人 cron に LLM を載せない方針は `.claude/rules/affiliate-ads-standards.md` §10 の A8 cron と揃える）。

MCP が有用なのは**セレクタ確定の探索工程**である。実機を見てセレクタを確定し、その結果を決定的スクリプトへ落として CI へ載せる。

## Active profile

| `.local/` 配下                                        | サービス             | 主な利用箇所                                                            | 固定契約                                                |
| ----------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `playwright-x-profile/`                               | X                    | `.claude/skills/sns/publish-x/`、`.claude/skills/sns/update-x-profile/` | `--expect-account` で handle を照合                     |
| `playwright-ig-profile/`                              | Instagram            | `.claude/scripts/sns/delete-instagram-posts.ts`                         | headed login を保持                                     |
| `playwright-a8-profile/` + `playwright-a8-state.json` | A8.net               | `.claude/skills/ads/scout-asp/scripts/`、`.claude/scripts/ads/`         | storage state の再注入を併用                            |
| `playwright-moshimo-profile/`                         | もしもアフィリエイト | `.claude/scripts/ads/`                                                  | `.claude/config/affiliate-asp.json` の site ID を照合   |
| `playwright-afb-profile/`                             | afb                  | `.claude/scripts/ads/`                                                  | login から完了まで同一 headed process                   |
| `playwright-coconala-profile/`                        | ココナラ             | `.claude/scripts/coconala/`                                             | `.claude/config/coconala-account.json` の seller を照合 |
| `playwright-kdp-profile/`                             | Amazon KDP           | `.claude/scripts/kdp/`                                                  | `.claude/config/kdp-account.json` の account を照合     |
| `playwright-note-profile/`                            | note                 | `.claude/scripts/note/`                                                 | `.claude/config/note-account.json` の account を照合    |
| `playwright-google-admin-profile/`                    | Google Admin         | `.claude/scripts/google-admin/`                                         | GSC link / GA4 Library のAPI非提供操作だけに使う         |

archive skill だけが参照する profile は Active 一覧へ含めない。復活させる場合は script、profile、account assertion、cleanup を再監査してから追加する。

## サービス固有の認証

### A8.net

永続 context だけでは session が復元できない場合があるため、`.local/playwright-a8-state.json` を併用する。初回または期限切れ時は `.claude/skills/ads/scout-asp/scripts/login.mjs` を headed で実行する。

### もしも / afb

同じ ASP アカウント内に複数サイトが存在するため、ログイン成功だけでは安全条件を満たさない。

- もしも: 対象 site ID を config と照合する。
- afb: storage state の別 process 復元や headless が拒否される場合がある。ログインから対象確認、操作完了まで同一 headed process で行う。

### ココナラ / KDP

専用 config の account assertion が一致しない場合は停止する。KDP の税務情報、銀行口座、2FA は自動入力しない。

### Google Admin

profile はログイン保持だけに使い、GSC link作成とGA4 Library collection公開に限定する。
GA4 Admin API、AdSense read API、CIの承認境界、設定変更のallowlistは
`.claude/scripts/google-admin/README.md`を正典とする。

## worktree と OS

`.local/` は git worktree へ複製されない。worktree 相対の profile path を使うと、新しい空 profile が作られ再ログインになる。

現在は二つの実装が混在している。

1. ASP 共通基盤は、既知の main checkout が実在すればそこを使い、無ければ script 位置から repository root を解決する。
2. X、Instagram、ココナラ、KDP の一部は main checkout の絶対 path を使用する。

このため browser 操作は原則として main checkout から実行する。別 OS または別 clone で動かす場合は、空 profile を正しい profile と誤認していないか、対象 script の `PROFILE_ROOT` / `PROFILE_DIR` を先に確認する。

profile path の実装を統一する変更は、全サービスを一括置換せず、account assertion とログイン復旧をサービス単位で検証する。

## ログイン復旧

1. 対象 script と profile path を確認する。
2. 同じ profile を使う別 process と browser を閉じる。
3. サービス固有の login command または対象 script の headed mode で開く。
4. 人が login、2FA、CAPTCHA を完了する。
5. account / site assertion を実行する。
6. dry-run または read-only mode で session を確認する。
7. context を正常終了し、profile lock を残さない。

profile が壊れたと判断しても、既存 directory を即時削除しない。path の取り違え、別 process の lock、Cookie 期限切れを先に確認し、必要なら退避してから再作成する。

## 禁止事項

- profile、storage state、Cookie、screenshot 内の個人情報を commit する。
- profile をサービス間または別用途アカウント間で共有する。
- login 成功だけで対象サイト・seller・handle の照合を省く。
- CAPTCHA 回避、2FA secret の埋め込み、規約同意の自動化。
- headless 拒否を検知した後も retry loop を続ける。
- 実際の login 状態、メールアドレス、handle を git 文書の TODO として残す。

## Security incident

profile の漏洩は account takeover 相当として扱う。

1. 対象サービスの session を revoke する。
2. password / token を必要に応じて rotate する。
3. repository history と artifact への混入を確認する。
4. 原因が path、log、screenshot、artifact のどこかを特定する。
5. 再発防止を `.claude/todo/improvements.md` または `bug` Issue へ記録する。
