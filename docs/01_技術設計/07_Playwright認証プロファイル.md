---
title: Playwright認証プロファイル
type: technical-design
status: adopted
updated: 2026-07-29
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
| `playwright-google-admin-profile/`                    | Google Admin         | `.claude/scripts/google-admin/`                                         | GA4 / GSC の allowlist と read-before-write gate を使う |

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

profile はログイン保持だけに使う。設定変更の許可範囲、secret の redaction、read-before-write は `.claude/scripts/google-admin/README.md` と CLI の allowlist を正典とする。

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
5. 再発防止を `docs/todo/04_改善バックログ.md` または `bug` Issue へ記録する。
