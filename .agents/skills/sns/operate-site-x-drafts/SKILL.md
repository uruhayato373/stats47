---
name: operate-site-x-drafts
description: >
  stats47のランキング・テーマ・エリア向けX集客下書きを、ドメイン境界、実在する着地URL、
  専用画像、機械lint、投稿台帳まで一貫管理する。GeoAIはoperate-geo-contentへ分離する。
  Use when user says "サイト集客X", "テーマ投稿", "エリア投稿", "X下書きを全て", "着地ページ付きX".
disable-model-invocation: true
primary_agent: x-strategist
co_agents: [theme-portfolio-manager, area-curator, sns-renderer]
argument-hint: "[build|audit|register]"
---

# operate-site-x-drafts

サイト集客用X下書きの正典入口。1投稿につき実在するcanonical着地ページを1つ持たせ、
`domain`を画像・キャプション・UTM・台帳まで貫通させる。外部投稿はこのスキルの範囲外。

## ドメイン境界

| domain | 読者価値 | canonical | image kind | 担当フロー |
|---|---|---|---|---|
| ranking | 単一指標の47都道府県比較 | `/ranking/<key>` | `ranking-card` / `tile-map` | `/post-x-batch` |
| theme | 複数指標を同じ主題で横断 | `/themes/<key>` | `theme-overview-card` | 本スキル |
| area | 1県のシンボル・特産・統計 | `/areas/<code>` | `area-profile-card` | 本スキル |
| geo | 複数GISレイヤー×空間演算 | `/geo/<slug>` / `/geo` | `geo-insight-card` | `/operate-geo-content` |

`theme`を単一ランキングへ、`area`を県順位だけへ、`geo`をランキング画像へ縮退させない。

## 実行フロー

1. 型・画像・UTM契約を `.claude/rules/sns-content-standards.md` §2/§4 で確認する。
2. theme/areaのgit TSカタログから下書きとサイトOGPを派生する。

   ```bash
   npm run x:build-site-acquisition
   ```

   出力:
   - `.local/r2/sns/_queue/site-acquisition-x.json`
   - `.local/r2/sns/theme/<key>/x/stills/{<key>.png,source.json}`
   - `.local/r2/sns/area/<code>/x/stills/{<code>.png,source.json}`

3. 画像寸法・画像SHA・landing HTTP 200・redirectなし・canonical一致を監査する。

   ```bash
   npm run x:audit-site-acquisition
   ```

4. キャプションの文字数、URL token、ハッシュタグ、NG語、類似度を検査する。

   ```bash
   node .claude/skills/sns/post-x-batch/scripts/lint-x-captions.cjs \
     --in .local/r2/sns/_queue/site-acquisition-x.json
   ```

5. dry-runで差分確認後、agentだけが`status=draft`へ登録する。予約日時は設定しない。

   ```bash
   node .claude/skills/sns/post-x-batch/scripts/register-drafts.cjs \
     --in .local/r2/sns/_queue/site-acquisition-x.json --dry-run
   node .claude/skills/sns/post-x-batch/scripts/register-drafts.cjs \
     --in .local/r2/sns/_queue/site-acquisition-x.json
   ```

6. 管理画面 `/content/x` はdomain、着地URL、画像、caption、statusの閲覧だけに使う。

## 機械Gate

- themeは`THEME_CATALOGS`全件、areaは`PREFECTURES` 47件と`AREA_EDITORIALS`全件の積集合ではなく全件一致。
- content key、canonical、campaign、media pathは一意。
- theme/area画像は1200×630 PNG。画像と`source.json`は1対1でSHA一致。
- canonicalはHTTP 200かつredirectなし。URLはtheme=`/themes/*`、area=`/areas/*`。
- captionは`{{url}}`を1個だけ持ち、生URLを含めない。lint全件PASS後だけ台帳登録可。
- 台帳は`domain=theme|area`、`status=draft`、`scheduled_at=null`、`utm_url`必須。
- 管理画面から予約・即時投稿・dry-run・生成・R2 pushを実行しない。

## 書き込み境界

- authored catalogs: `packages/data-configs/src/theme-catalog/**`, `packages/data-configs/src/area-databook/**`
- derived queue/media: `.local/r2/sns/**`
- ledger: `.claude/state/sns/posts.json`（`sns-posts-store.cjs`経由のみ）
- admin: read-only

## Output Contract

`domain | drafts | landing PASS | image/SHA PASS | caption lint | ledger | unpublished`
を返す。未取得・未監査・未登録・未投稿を区別する。
