# バズ地図カード標準 (buzz-map の型・トークン・テーマカタログの正典)

まちの計量舎（@machi_measure）系「日本地図×統計」の SNS カード/動画を stats47 ブランドで量産するための
**実行規約の単一ソース (SSOT)**。企画・生成・改善に関わる agent / skill / 人間はこれに従う。

> **方式**: `sns-content-standards.md` と同じ「rules に規約カタログ 1 ファイル、skill/agent は参照のみ」。
> **機械値（色 hex・キャンバス px・fps 等）の正本は `apps/remotion/src/features/buzz-map/tokens.ts`**。
> 本ファイルには値を転記しない（二重管理禁止）。値を変えるときは tokens.ts を編集し、§6 決定ログに日付付きで追記する。
> 競合分析・企画の背景は obsidian vault `memos/20260715_proposal_stats47バズ地図テンプレ/`（読み物）。

---

## 1. 型（フォーマット）

| 型 | 内容 | コンポジション | 用途 |
|---|---|---|---|
| **型A** | 静止画・二値/少区分マップ | `BuzzMap-Still-{45,11,169,916}` | 「該当する自治体はどこ?」の意外な事実系（例: 内陸8県、女性>男性） |
| **型B** | 時系列アニメ・連続量マップ | `BuzzMap-Reel-{11,916}`（静止画化は `BuzzMap-Still-*` に `year`/`showSummary` props） | 長期トレンドの実感系（例: さくら開花日の50年）。30〜60秒 |

### 共通レイアウト（全カード固定・5要素）

1. **タイトルブロック（左上）**: 本題＋1行サブコピー（疑問形・自分事化）。**最大2行**、2行になる場合は
   spec の `titleLines` で助詞の前に手動改行（中途半端な折返しを許さない）
2. **出典（右上・極小）**: データ出典＋加工者表記＋ `stats47.jp`（転載時の透かし）
3. **沖縄・南西諸島インセット（左上の海域）**: ヘアライン枠＋ラベル必須。16:9 のみ非表示（本土トリム）
4. **凡例カード（右下）**: 型A は区分名＋**件数必須**（色だけに頼らない補助。海色上の social accent は
   コントラスト 2.98:1 のための必須要件）。型B はブルー単色ランプ＋目盛
5. **ブランド行（左下）**: `stats47.jp 統計で見る都道府県`（全カード共通・固定位置）

### 配色規則

- 海色はシリーズの「顔」＝**不変**。強調色は **social（人口・社会系）/ infra（インフラ・経済系）の2択固定**で
  シリーズ認知を作る。連続量は**ブルー単色ランプ（虹色禁止）**、増減の分岐が要る場合は blue↔red＋中立グレー（未実装・要決定ログ）
- 配色は dataviz 検証器で検証済み（social×infra: CVD ΔE 13.4）。**トークン変更時は再検証**する

### アスペクト比

| ratio | 実寸 | 用途 |
|---|---|---|
| `45` | 1080×1350 | **静止画の既定**（X・IG フィード） |
| `11` | 1080×1080 | X 動画・IG 正方形 |
| `916` | 1080×1920 | IG リール・TikTok（※TikTok は投稿禁止=素材のみ）・リール表紙 |
| `169` | 1920×1080 | YouTube・OGP。**本土左寄せトリム・沖縄インセット非表示** |

### 型B の演出規約

- **年カウンター**は右の海域（地図右に 22% の海を確保）・Archivo Bold 数字・地図と重ねない
- **減速カーブ**: 転換点以降を `speed` で遅くする（例: 2000年まで 2.5年/秒 → 以降 1.25年/秒）
- **ラスト静止 2 秒**（`holdSeconds`）で最大・最小のサマリーを表示してから終わる
- 同 spec の最終年静止画（`BuzzMap-Still-* --props` に `"showSummary": true`）を**併投稿用に必ず出す**（静止画→動画の二段導線）

## 2. spec（1カード/1動画 = 1 JSON）

- 型定義の正本: `apps/remotion/src/features/buzz-map/types.ts`（`BuzzMapSpec`）
- 置き場: `apps/remotion/src/features/buzz-map/specs/<id>.json`（**`{"spec": {...}}` の形で保存** ＝ そのまま `--props` に渡せる）
- コード体系: 都道府県=2桁（"01"〜"47"）/ 市区町村=N03_007 5桁
- `level`: `pref` / `muni`（全国市区町村）/ `muni:NN`（県トリム）。muni は県境オーバーレイが自動で乗る
- **ダミーデータのカードは `title` に【サンプル】、出典に「実データではありません」を必ず明記**（sample-anim が例）

## 3. ジオデータ

| level | ソース | 備考 |
|---|---|---|
| pref | `apps/remotion/public/prefecture.topojson`（既存共用） | N03_007 2桁 / N03_001 |
| muni | `apps/remotion/public/buzz-map/municipalities.topojson` | smartnews-smri/japan-topography s0010（1.5MB・2021-01-01 時点 1,906 自治体=政令市区含む）。再取得URL はファイル履歴と §6 参照 |

- 本土は固定フレーム（`MAINLAND_BBOX`）に投影。**小笠原・大東諸島等の外れ島は v1 では非描画**（沖縄はインセットに集約）
- 市区町村の合併・境界改定でデータ年次と地図年次がずれる場合は topojson の年次を明記して差し替える（gis-curator 相談）

## 4. テーマカタログ（★企画の台帳）

status: `案` → `spec作成` → `生成済` → `投稿済`（投稿記録の正本は posts.json。ここは企画側の一覧）。

<!-- buzz-map:catalog:start -->
| theme_id | テーマ（固有名） | 型 | level | データ源 | spec | status |
|---|---|---|---|---|---|---|
| sample-landlocked | 海に面していない都道府県 | A | pref | 地理的事実（検証済み内陸8県） | specs/sample-landlocked.json | 生成済（検証用サンプル） |
| sample-anim | 【サンプル】◯◯率の推移 | B | pref | ダミー値（実データではない） | specs/sample-anim.json | 生成済（検証用サンプル） |
| sakura-bloom-50y | さくら開花日の50年 | B | pref | 気象庁 生物季節観測（issue [#538](https://github.com/uruhayato373/stats47/issues/538)） | — | 案（第1弾候補。交通インフラ系は本家と被るため回避） |
| female-majority-muni | 女性が男性より多い市区町村 | A | muni | 国勢調査（e-Stat） | — | 案（まちの計量舎の令和2年版に対し最新調査で差別化） |
<!-- buzz-map:catalog:end -->

テーマ選定4条件: ①全国地図 ②市区町村粒度が刺されば優先 ③固有名・地元ネタ ④ツッコミ余地（リプで語りたくなる余白）。

## 5. 運用フロー

- **生成の入口は `/buzz-map` スキル**（`.claude/skills/sns/buzz-map/SKILL.md`）。レンダ実行は sns-renderer の担当領域
- **改善ループ**: 生成 PNG を Read で目視 → 崩れは **spec 側の修正を優先**。カード CSS/レイアウト
  （`BuzzMapCard.tsx`）や tokens.ts を触る変更は **§6 決定ログ追記とセット**（勝手に型を漂流させない）
- **投稿は本カタログの範囲外**: X は §2-9/§2-0（`sns-content-standards.md`）の既存フロー。buzz-map を
  X 画像カタログ（§2-9 image_kind）へ登録する改訂は **§2-10 の人間承認ゲート経由**で行う（未実施）
- 出力先: `.local/r2/sns/buzz-map/<theme_id>/{x,instagram,youtube}/...`（gitignored・R2 push は `/push-r2`）
- 頻度リミット・キャプション雛形は `sns-content-standards.md` §1-2 に従う（本ファイルで重複定義しない）

## 6. 決定ログ

- **2026-07-15 基盤新設**: Playwright+ffmpeg の独立パイプライン案を棄却し、既存 Remotion 基盤の feature
  （`apps/remotion/src/features/buzz-map/`）として実装（レンダ入口一本化の規約に従う）。
  デザインは obsidian vault の競合分析＋モック（PR uruhayato373/obsidian#6）から移植
- **2026-07-15 フォント同梱**: レンダ環境（リモート Linux）に Noto Sans JP が無く描画が環境依存になるため、
  @fontsource の japanese+latin サブセット woff2（400/700、計約2.3MB）と Archivo Bold 数字サブセット（2.8KB）を
  `public/buzz-map/fonts/` にコミットし FontFace API でロード（`useBuzzMapFonts`）
- **2026-07-15 市区町村データ**: smartnews-smri/japan-topography s0010 全国版（1.5MB）を public にコミット。
  展開・投影は実行時計算（キャッシュ不要の軽さのため）。外れ島（小笠原等）は v1 非描画
- **2026-07-15 配色検証**: sea/land/accent×2/ランプ7段を dataviz 検証器で確認（CVD ΔE 13.4・
  海色上 social 2.98:1 → 凡例件数ラベル必須を型仕様に固定）
