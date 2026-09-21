---
name: native_chrome_session_export
description: 通常ChromeのGoogle認証をPlaywrightへ取り出す際のOS keychain互換と元profile保護
type: feedback
---

**問題**: 通常Chromeで本人ログイン済みの専用Google profileをPlaywright既定値で開くと、認証Cookieを取り出せず再ログイン要求となった。

**原因**: PlaywrightのChromium既定引数には`--password-store=basic`と`--use-mock-keychain`があり、macOS通常ChromeのOS keychainと保存方式が異なる。既定値での直接起動では元Cookie DBが空になり、既定値を除いた一時コピーからは23 Cookieをexportでき、元DB44 Cookieを保持した。

**対策**: `.claude/scripts/measurement/bootstrap-session.mjs gsc --from-profile`は専用profileを一時領域へコピーし、上記2引数だけを除いてexportする。終了時に一時コピーを削除する。ログイン自体は`google-admin/cli.mjs login`で通常Chromeを開き本人が行う。CAPTCHA・認証拒否の回避はしない。

**証拠**: 2026-09-21、bootstrapのprofile保護回帰テスト、同認証からGSC coverage 5種の実取得成功。恒久運用は`docs/01_技術設計/07_Playwright認証プロファイル.md`。
