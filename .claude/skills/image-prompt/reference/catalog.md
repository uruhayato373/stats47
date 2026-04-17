# 画像プロンプト カタログ

外部 AI 画像生成（Midjourney、DALL-E、Nano Banana 等）用のプロンプトテンプレート 43 種を、メタデータ付きで収録する。

## メタデータ凡例

| フィールド | 意味 |
|---|---|
| `id` | テンプレート ID（51〜93） |
| `category` | `minimal-typography` / `minimal-accent` / `landscape-blend` |
| `fit` | stats47 ブランド（melta-ui 準拠）との適合度。`high`（推奨） / `medium`（条件付き） / `low`（非推奨だが記録用に保持） |
| `use_cases` | 用途タグ。`note-header`（note 表紙）/ `blog-hero`（ブログ hero）/ `x-banner`（X バナー）/ `sns-supporting`（SNS 補助）/ `brand-asset`（ブランド素材） |
| `mood` | 印象キーワード |

**`{{TITLE}}`** プレースホルダー: `/image-prompt --title "..."` で差し替える。

---

# Chapter 5: minimal-typography（文字入り × シンプル背景）

## 51. ネイビー×白タイトル

- **id**: 51 / **category**: minimal-typography / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: editorial, professional, trustworthy

### Prompt

```
A deep navy blue gradient background, slightly textured like fine fabric. Enormous clean text "{{TITLE}}" in bold condensed white sans-serif font, centered, filling 70% of the frame width. The text has a very subtle soft white glow behind it. Nothing else. Minimalist, powerful, editorial magazine cover feel, 8k, --ar 2500:1000
```

### stats47 での使い方
**汎用性最強**。どんな記事テーマにも合う。迷ったらこれ。melta-ui の `bg-slate-900 + text-white` と完全一致で、Remotion 側の OGP とも視覚的統一感あり。

---

## 52. マットブラック×ゴールドタイトル

- **id**: 52 / **category**: minimal-typography / **fit**: medium
- **use_cases**: note-header, brand-asset
- **mood**: luxury, premium, editorial

### Prompt

```
A pure matte black background with subtle noise texture. Enormous text "{{TITLE}}" in bold serif font with metallic gold color, centered, filling 65% of the frame width. The gold has a realistic brushed metal texture. A single thin gold horizontal line above and below the text. Nothing else. Luxury editorial design, 8k, --ar 2500:1000
```

### stats47 での使い方
収益化戦略・プレミアム記事など「高級感を出したいとき」限定。データ記事全般に使うとブランド不整合。

---

## 53. コンクリート壁×白ステンシルタイトル

- **id**: 53 / **category**: minimal-typography / **fit**: low
- **use_cases**: sns-supporting
- **mood**: raw, industrial, provocative

### Prompt

```
A weathered concrete wall texture filling the entire frame, subtle cracks and stains. Enormous text "{{TITLE}}" stencil-sprayed in clean matte white paint on the wall, centered, filling 65% of the frame width. The paint has realistic spray texture with slight overspray at edges. Raw, industrial, authentic feel, 8k, --ar 2500:1000
```

### stats47 での使い方
挑発的・ぶっちゃけ系の SNS 投稿のみ。本体ブランドとはトーン違い。

---

## 54. 霧のグラデーション×浮遊タイトル

- **id**: 54 / **category**: minimal-typography / **fit**: high
- **use_cases**: note-header, blog-hero
- **mood**: atmospheric, calm, sophisticated

### Prompt

```
A soft gradient from warm charcoal gray at the bottom to pale fog white at the top, like morning mist. Enormous text "{{TITLE}}" in elegant thin serif font, white, centered, filling 60% of the frame width. The text appears to float in the fog, lower letters slightly fading into the mist. Atmospheric, calm, sophisticated, 8k, --ar 2500:1000
```

### stats47 での使い方
分析系・思考法・相関分析などの「静かに深く考える」系記事に最適。知的な落ち着き。

---

## 55. 真っ白×極太黒タイトル

- **id**: 55 / **category**: minimal-typography / **fit**: high
- **use_cases**: note-header, blog-hero, x-banner
- **mood**: high-contrast, bold, urgent

### Prompt

```
A pure clean white background. Enormous text "{{TITLE}}" in ultra-bold black condensed sans-serif font, centered, filling 75% of the frame width. The text is so bold it feels heavy. A single thin red horizontal line under the text. Nothing else. Maximum contrast, Helvetica-poster aesthetic, 8k, --ar 2500:1000
```

### stats47 での使い方
ランキング発表・ニュース速報系の記事に最強。0.5 秒で読める。熟度高いテーマに。

---

## 56. 夕焼けグラデーション×シルエットタイトル

- **id**: 56 / **category**: minimal-typography / **fit**: low
- **use_cases**: note-header
- **mood**: cinematic, emotional, warm

### Prompt

```
A smooth gradient sky from deep orange at the bottom through warm pink to deep purple at the top, no clouds, no objects, just the color. Enormous text "{{TITLE}}" in bold sans-serif font, pure black silhouette, centered, filling 65% of the frame width. The text is a clean dark shape against the warm sky. Cinematic simplicity, 8k, --ar 2500:1000
```

### stats47 での使い方
ストーリー系の note 記事のみ。データ記事には感情寄り過ぎ。

---

## 57. ダークウッド×ホワイトタイトル

- **id**: 57 / **category**: minimal-typography / **fit**: low
- **use_cases**: note-header, brand-asset
- **mood**: grounded, trustworthy, rustic

### Prompt

```
A dark walnut wood grain texture filling the entire frame, rich brown tones with visible grain pattern. Enormous text "{{TITLE}}" in bold clean white sans-serif font, centered, filling 65% of the frame width. The white text pops against the warm dark wood. Professional, grounded, trustworthy feel, 8k, --ar 2500:1000
```

### stats47 での使い方
ラスティック志向だが、stats47 のモダンデータ感とは不整合。基本使わない。

---

## 58. 深海ブルー×光るタイトル

- **id**: 58 / **category**: minimal-typography / **fit**: low
- **use_cases**: note-header
- **mood**: mystical, deep

### Prompt

```
A deep ocean blue background, smooth gradient from dark navy at edges to slightly lighter blue at center, like looking into deep water. Enormous text "{{TITLE}}" in bold sans-serif font, soft glowing cyan-white color as if the text is a light source underwater, centered, filling 65% of the frame width. Subtle light rays emanating from behind the text. Clean and deep, 8k, --ar 2500:1000
```

### stats47 での使い方
「深い分析」系の煽り向けだが、神秘主義寄り。データサイトには過剰演出。

---

## 59. 赤×白タイトル（警告系）

- **id**: 59 / **category**: minimal-typography / **fit**: low
- **use_cases**: sns-supporting
- **mood**: urgent, alert, high-impact

### Prompt

```
A bold solid red background, flat and saturated. Enormous text "{{TITLE}}" in ultra-bold condensed white sans-serif font, centered, filling 70% of the frame width. Nothing else. The stark red-white contrast creates immediate urgency. Emergency broadcast aesthetic, 8k, --ar 2500:1000
```

### stats47 での使い方
「知らないとヤバい」系の X 投稿のみ。本体ブランドは冷静な分析なので乖離大きい。

---

## 60. 星空×白タイトル

- **id**: 60 / **category**: minimal-typography / **fit**: low
- **use_cases**: note-header, brand-asset
- **mood**: vast, contemplative

### Prompt

```
A clear night sky filled with thousands of small stars, no moon, no landscape, just the deep black sky and stars. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of the frame width. The text is crisp white against the starfield. Simple, vast, contemplative, 8k, --ar 2500:1000
```

### stats47 での使い方
壮大テーマ向けだが、#75（星座線）の方が「データ感」が出るので代替可能。

---

## 61. 和紙テクスチャ×墨タイトル

- **id**: 61 / **category**: minimal-typography / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: traditional, japanese, editorial

### Prompt

```
A warm cream-colored Japanese washi paper texture filling the entire frame, subtle fiber patterns visible. Enormous text "{{TITLE}}" in bold black sumi ink brush calligraphy style, centered, filling 60% of the frame width. The ink has realistic brush texture with visible stroke dynamics and slight bleed into the paper. Traditional yet bold, 8k, --ar 2500:1000
```

### stats47 での使い方
和風・日本文化・地域伝統系の記事（ふるさと納税、地方文化）限定。モダン記事には不整合。

---

## 62. ボケ光×タイトル

- **id**: 62 / **category**: minimal-typography / **fit**: low
- **use_cases**: note-header
- **mood**: dreamy, urban, atmospheric

### Prompt

```
A background of soft out-of-focus city lights at night, warm golden and cool blue bokeh circles scattered across the frame. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of the frame width. The text is sharp and crisp against the dreamy blurred background. Night city editorial feel, 8k, --ar 2500:1000
```

### stats47 での使い方
都市・ライフスタイル系の記事。ただし分析記事には情緒過多。

---

## 63. 大理石×ゴールドタイトル

- **id**: 63 / **category**: minimal-typography / **fit**: medium
- **use_cases**: note-header, brand-asset
- **mood**: luxury, premium

### Prompt

```
A white marble surface with subtle gray veining filling the entire frame. Enormous text "{{TITLE}}" in bold serif font with brushed gold metallic texture, centered, filling 65% of the frame width. The gold text sits elegantly on the marble. Luxury brand aesthetic, clean and premium, 8k, --ar 2500:1000
```

### stats47 での使い方
プレミアム・ブランディング系の固定記事向け。量産には向かない。

---

## 64. 雨粒のガラス越し×タイトル

- **id**: 64 / **category**: minimal-typography / **fit**: low
- **use_cases**: note-header
- **mood**: intimate, atmospheric, emotional

### Prompt

```
A window covered in rain droplets, the background behind the glass is a blurred warm amber light. Enormous text "{{TITLE}}" in bold white sans-serif font, appearing as if written on the glass surface, some rain droplets running over the letters, creating a wet texture on the text. Intimate, atmospheric, 8k, --ar 2500:1000
```

### stats47 での使い方
エモーショナル記事限定。データ分析記事には雰囲気過多。

---

## 65. スプリットカラー×対比タイトル

- **id**: 65 / **category**: minimal-typography / **fit**: medium
- **use_cases**: note-header, blog-hero, sns-supporting
- **mood**: geometric, contrast, comparison

### Prompt

```
The frame split exactly in half vertically, left half deep black, right half pure white. Enormous text "{{TITLE}}" in bold sans-serif font spanning both halves, centered. The letters on the black side are white, the letters on the white side are black, each letter switching color exactly at the center line. Clean geometric contrast, 8k, --ar 2500:1000
```

### stats47 での使い方
**2 地域比較ツール記事**（stats47 固有機能）にドンピシャ。「A vs B」「地方 vs 都市」等の構図記事。

---

# Chapter 6: minimal-accent（ミニマル背景に一点アクセント）

## 66. ダークグレー×赤い一本線×タイトル

- **id**: 66 / **category**: minimal-accent / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: structured, editorial, analytical

### Prompt

```
A dark charcoal gray background with a single bold red horizontal line running across the center of the frame. Enormous text "{{TITLE}}" in bold white condensed sans-serif font, centered, filling 65% of the frame width, the red line passing behind the text. Minimal, structured, editorial, 8k, --ar 2500:1000
```

### stats47 での使い方
フレームワーク・構造化された解説記事に合う。melta-ui の `border-t` デザインと親和性高い。

---

## 67. ブラック×下から光×タイトル

- **id**: 67 / **category**: minimal-accent / **fit**: low
- **use_cases**: sns-supporting, note-header
- **mood**: dramatic, theatrical

### Prompt

```
A pure black background with a soft warm golden light source at the very bottom edge of the frame, creating a subtle gradient glow on the lower 20%. Enormous text "{{TITLE}}" in bold white sans-serif font, centered slightly above middle, filling 65% of frame width. The bottom of each letter catches the warm golden light. Dramatic stage lighting feel, 8k, --ar 2500:1000
```

### stats47 での使い方
発表・ローンチ・リリース系のみ。分析記事ではドラマチック過ぎる。

---

## 68. ネイビー×一つの光る球×タイトル

- **id**: 68 / **category**: minimal-accent / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: focused, intentional, introspective

### Prompt

```
A deep navy background. A single small glowing orb of warm white light floating in the upper right corner, casting soft light across the frame. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The light from the orb creates a subtle gradient on the right side of each letter. Focused, intentional, 8k, --ar 2500:1000
```

### stats47 での使い方
「核心」「一つの答え」系の記事。#51 のバリエーションとして使える。

---

## 69. グレー×巨大な丸×タイトル

- **id**: 69 / **category**: minimal-accent / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: geometric, minimal, bauhaus

### Prompt

```
A medium gray background. A single enormous perfect circle in slightly lighter gray, centered, filling 80% of the frame height. Enormous text "{{TITLE}}" in bold black sans-serif font, centered within the circle, filling 60% of the circle width. Bauhaus-inspired geometric minimalism, 8k, --ar 2500:1000
```

### stats47 での使い方
テーマダッシュボード紹介・全体像解説・「フレームワーク」系記事に最適。Bauhaus 幾何でモダン。

---

## 70. ホワイト×影だけ×タイトル

- **id**: 70 / **category**: minimal-accent / **fit**: low
- **use_cases**: sns-supporting
- **mood**: clever, typographic-illusion

### Prompt

```
A pure white background. Enormous text "{{TITLE}}" in bold condensed sans-serif font, the text itself is also white and barely visible, but it casts a very prominent dark sharp shadow offset to the lower right, making the text readable through its shadow alone. Clever typographic illusion, 8k, --ar 2500:1000
```

### stats47 での使い方
「見えない本質」系のギミック記事。可読性低いので SNS 補助限定。

---

## 71. ダーク×ネオン一色アウトライン×タイトル

- **id**: 71 / **category**: minimal-accent / **fit**: low
- **use_cases**: sns-supporting
- **mood**: cyberpunk, tech, neon

### Prompt

```
A dark background, almost black. Enormous text "{{TITLE}}" as outline-only letters in a single neon cyan color, no fill, just the letter outlines glowing like neon tubes, centered, filling 65% of frame width. The neon outlines cast a soft cyan glow on the dark background. Clean cyberpunk, not cluttered, 8k, --ar 2500:1000
```

### stats47 での使い方
テック系記事向けだが、stats47 のデータ分析トーンからは離れる。

---

## 72. クラフト紙×手書き風タイトル

- **id**: 72 / **category**: minimal-accent / **fit**: medium
- **use_cases**: note-header
- **mood**: diy, personal, authentic

### Prompt

```
A brown kraft paper texture filling the entire frame, slightly crumpled. Enormous text "{{TITLE}}" in bold hand-lettering style with thick black marker strokes, centered, filling 60% of frame width. The marker ink has realistic bleed and slight imperfections on the paper. DIY, authentic, personal, 8k, --ar 2500:1000
```

### stats47 での使い方
体験談・ハウツー系の note 記事のみ。データ記事には合わない。

---

## 73. 黒板×チョークタイトル

- **id**: 73 / **category**: minimal-accent / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: educational, classroom

### Prompt

```
A dark green blackboard texture filling the entire frame, chalk dust visible. Enormous text "{{TITLE}}" in bold white chalk handwriting style, centered, filling 65% of frame width. The chalk has realistic texture with slight smudging and dust particles. A small chalk piece and eraser at the bottom edge. Classroom aesthetic, 8k, --ar 2500:1000
```

### stats47 での使い方
「統計の読み方入門」「データ分析講座」など教育系記事に合う。モダン記事には古風すぎる。

---

## 74. ブラック×一筋のスモーク×タイトル

- **id**: 74 / **category**: minimal-accent / **fit**: low
- **use_cases**: note-header, sns-supporting
- **mood**: mysterious, elegant

### Prompt

```
A pure black background with a single elegant wisp of white smoke curving through the frame from bottom left to upper right. Enormous text "{{TITLE}}" in bold white sans-serif font, centered, filling 65% of frame width. The smoke passes behind the text adding movement without clutter. Elegant, mysterious, 8k, --ar 2500:1000
```

### stats47 での使い方
ミステリアス系。データ分析サイトには雰囲気過多。

---

## 75. ミッドナイトブルー×星座線×タイトル

- **id**: 75 / **category**: minimal-accent / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: scientific, cosmic, data-chart

### Prompt

```
A deep midnight blue background. Faint constellation lines and dots scattered across the frame like a star chart. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The constellation lines pass behind the text. Scientific, cosmic, but clean, 8k, --ar 2500:1000
```

### stats47 での使い方
**相関分析記事・ネットワーク分析記事に最適**。「147 万ペアの相関」を暗示。stats47 の "Data Art" 系 OGP との視覚統一感あり。

---

## 76. ホワイト×赤い丸（日の丸構図）×タイトル

- **id**: 76 / **category**: minimal-accent / **fit**: low
- **use_cases**: sns-supporting
- **mood**: japanese, iconic

### Prompt

```
A pure white background with a single large solid red circle centered in the frame, like the Japanese flag but slightly off-center to the right. Enormous text "{{TITLE}}" in bold black sans-serif font, centered overlapping the red circle, filling 65% of frame width. Strong, iconic, Japanese minimalism, 8k, --ar 2500:1000
```

### stats47 での使い方
政治的含意が強く、汎用記事には不向き。「日本の統計」ブランド記事限定。

---

## 77. ダーク×グリッド線×タイトル

- **id**: 77 / **category**: minimal-accent / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: analytical, data-driven, structured

### Prompt

```
A dark charcoal background with a subtle thin grid pattern in slightly lighter gray, like graph paper. Enormous text "{{TITLE}}" in bold white sans-serif font, centered, filling 65% of frame width. The grid lines pass through and behind the text. Structured, analytical, data-driven feel, 8k, --ar 2500:1000
```

### stats47 での使い方
**データ分析記事全般に最適**。グリッド = グラフ用紙を暗示、データサイトの本丸。

---

## 78. グラデーション（青→紫）×白タイトル

- **id**: 78 / **category**: minimal-accent / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: modern, tech, clean

### Prompt

```
A smooth horizontal gradient from deep blue on the left to rich purple on the right, no texture. Enormous text "{{TITLE}}" in bold white sans-serif font, centered, filling 65% of frame width. The white text pops against the gradient. Modern, tech-forward, clean, 8k, --ar 2500:1000
```

### stats47 での使い方
AI・テック・ict カテゴリ記事向け。ただしややサイバー寄り。

---

## 79. ブラック×タイトルに切り込み光

- **id**: 79 / **category**: minimal-accent / **fit**: low
- **use_cases**: sns-supporting
- **mood**: dramatic, reveal

### Prompt

```
A pure black background. Enormous text "{{TITLE}}" in bold sans-serif font. The text is black and invisible against the background, but a single diagonal beam of white light crosses the frame, and the text is only visible where the light illuminates it, revealing portions of each letter. Dramatic reveal effect, 8k, --ar 2500:1000
```

### stats47 での使い方
「隠された真実」系の煽り記事のみ。データ分析トーンから逸脱。

---

## 80. 紙が破れて現れるタイトル

- **id**: 80 / **category**: minimal-accent / **fit**: low
- **use_cases**: sns-supporting
- **mood**: reveal, sensational

### Prompt

```
A white paper surface filling the frame, the paper is torn open in the center revealing a solid bold red background underneath. Enormous text "{{TITLE}}" in bold white sans-serif font, visible through the torn opening on the red layer beneath, centered, filling 60% of frame width. Paper curl and tear edges are realistic. Revealing something hidden, 8k, --ar 2500:1000
```

### stats47 での使い方
「暴露」「公開」系の煽り SNS のみ。本体ブランドとは乖離。

---

# Chapter 7: landscape-blend（風景に溶け込むタイトル）

## 81. 朝焼けの空×白タイトル

- **id**: 81 / **category**: landscape-blend / **fit**: low
- **use_cases**: note-header
- **mood**: fresh, beginning, soft

### Prompt

```
A soft pastel sunrise sky gradient from warm peach at the horizon to pale blue above, no clouds, no landscape, just the sky color. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered in the lower third, filling 65% of frame width. The text sits cleanly against the soft sky. Fresh, new beginning feel, 8k, --ar 2500:1000
```

### stats47 での使い方
「入門」「始め方」系の柔らかい記事向けだが、データ記事には温度感がやや過剰。

---

## 82. ぼかした山脈×白タイトル

- **id**: 82 / **category**: landscape-blend / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: grounded, long-term, strategic

### Prompt

```
A distant mountain range silhouette, heavily blurred and desaturated to a soft blue-gray, occupying the lower 30% of the frame, upper 70% is clean pale sky. Enormous text "{{TITLE}}" in bold white sans-serif font, centered in the upper portion, filling 65% of frame width. Mountains provide grounding without distraction, 8k, --ar 2500:1000
```

### stats47 での使い方
**戦略・長期ビジョン系記事に最適**。`docs/02_実装計画/01_実装ロードマップ.md` 解説、週次レビュー note などに。

---

## 83. 水面のリップル×白タイトル

- **id**: 83 / **category**: landscape-blend / **fit**: low
- **use_cases**: note-header
- **mood**: meditative, deep

### Prompt

```
A calm dark water surface filling the entire frame, a single soft ripple expanding from the center. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The text appears to float on the water surface, its reflection subtly visible below. Meditative, deep, 8k, --ar 2500:1000
```

### stats47 での使い方
「深いインサイト」系の note 記事向け。データサイトとしてはやや瞑想的。

---

## 84. 森の中の霧×白タイトル

- **id**: 84 / **category**: landscape-blend / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: mysterious, discovery

### Prompt

```
A misty forest scene, all trees heavily blurred and desaturated to soft gray-green, dense fog reducing visibility. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The text cuts through the fog clearly. Mysterious, discovery-oriented, 8k, --ar 2500:1000
```

### stats47 での使い方
「発見」「見つけた」系の記事。隠れた格差などの切り口。

---

## 85. 夜空のグラデーション×白タイトル

- **id**: 85 / **category**: landscape-blend / **fit**: high
- **use_cases**: note-header, blog-hero, brand-asset
- **mood**: vast, contemplative, professional

### Prompt

```
A smooth gradient from deep black at the top to dark indigo at the bottom, like looking straight up at the night sky, a few faint stars visible. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The white text glows against the dark sky. Vast, contemplative, 8k, --ar 2500:1000
```

### stats47 での使い方
壮大なテーマ・年間戦略系の記事。#75（星座線）より静か、汎用性あり。

---

## 86. ぼかした桜×白タイトル

- **id**: 86 / **category**: landscape-blend / **fit**: low
- **use_cases**: note-header
- **mood**: seasonal, spring, dreamy

### Prompt

```
A background of heavily blurred cherry blossom branches, soft pink and white bokeh filling the frame. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The text is sharp against the dreamy pink blur. Spring freshness without visual clutter, 8k, --ar 2500:1000
```

### stats47 での使い方
春季節限定。年間通用するブランド素材には不向き。

---

## 87. コンクリートの隙間から光×タイトル

- **id**: 87 / **category**: landscape-blend / **fit**: low
- **use_cases**: sns-supporting, note-header
- **mood**: breakthrough, dramatic

### Prompt

```
Two massive concrete walls forming a narrow gap in the center, brilliant white light pouring through the gap. Enormous text "{{TITLE}}" in bold white sans-serif font, the text is made of the same white light emerging from the gap, centered, filling 60% of frame width. Breakthrough, discovery aesthetic, 8k, --ar 2500:1000
```

### stats47 での使い方
「突破」「ブレイクスルー」系の煽り記事のみ。

---

## 88. 海と空の境界線×タイトル

- **id**: 88 / **category**: landscape-blend / **fit**: high
- **use_cases**: note-header, blog-hero, x-banner, brand-asset
- **mood**: boundless, open, professional

### Prompt

```
A minimal seascape, the horizon line perfectly centered, calm ocean below and clear sky above, both in similar soft blue tones creating near-symmetry. Enormous text "{{TITLE}}" in bold white sans-serif font, centered on the horizon line, filling 65% of frame width. The text bridges sea and sky. Boundless, open, 8k, --ar 2500:1000
```

### stats47 での使い方
**ビッグピクチャー系記事・X ヘッダーに最適**。「全体像」「マクロ視点」系。3:1 比率でも成立する稀少テンプレ。

---

## 89. 雨の窓×ネオンぼかし×タイトル

- **id**: 89 / **category**: landscape-blend / **fit**: low
- **use_cases**: note-header
- **mood**: moody, atmospheric, emotional

### Prompt

```
A window covered in rain droplets at night, behind the glass blurred neon lights in purple and blue bokeh. Enormous text "{{TITLE}}" in bold white sans-serif font, centered, filling 65% of frame width, the text appears as if written by finger on the wet glass, some droplets running through the letters. Moody, atmospheric, 8k, --ar 2500:1000
```

### stats47 での使い方
エモーショナル記事のみ。データ分析トーンとは乖離大きい。

---

## 90. ぼかした本棚×白タイトル

- **id**: 90 / **category**: landscape-blend / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: knowledge, learning, intellectual

### Prompt

```
A background of heavily blurred bookshelves filled with colorful book spines, warm soft focus. Enormous text "{{TITLE}}" in clean bold white sans-serif font, centered, filling 65% of frame width. The text is sharp against the intellectual blurred backdrop. Knowledge, learning, depth, 8k, --ar 2500:1000
```

### stats47 での使い方
書評・学習・解説系の記事向け。「統計データで読み解く」系に合う。

---

## 91. 古い地図×タイトル

- **id**: 91 / **category**: landscape-blend / **fit**: medium
- **use_cases**: note-header, blog-hero
- **mood**: exploration, cartography

### Prompt

```
An aged antique world map filling the entire frame, sepia tones, compass roses and sea monsters visible. Enormous text "{{TITLE}}" in bold serif font with dark brown color, centered, filling 60% of frame width. The text looks like it belongs on the map as a cartographer's label. Exploration, discovery, 8k, --ar 2500:1000
```

### stats47 での使い方
**市区町村コロプレスマップ解説・地域特性分析記事に相性良**。「完全マップ」系の切り口に。

---

## 92. ブラック×一本の赤い糸×タイトル

- **id**: 92 / **category**: landscape-blend / **fit**: low
- **use_cases**: sns-supporting
- **mood**: connection, fate, romantic

### Prompt

```
A pure black background with a single red thread curving elegantly through the frame from left to right. Enormous text "{{TITLE}}" in bold white sans-serif font, centered, filling 65% of frame width. The red thread weaves through and around the letters. Connection, fate, continuity, 8k, --ar 2500:1000
```

### stats47 での使い方
「つながり」系だが、ロマンチックすぎてデータサイトに不整合。

---

## 93. サンセットシルエット都市×タイトル

- **id**: 93 / **category**: landscape-blend / **fit**: medium
- **use_cases**: note-header, blog-hero, x-banner
- **mood**: urban, forward-looking

### Prompt

```
A city skyline silhouetted in pure black against a warm sunset gradient sky from orange to purple, no detail in the buildings, just the outline. Enormous text "{{TITLE}}" in bold white sans-serif font, centered above the skyline, filling 65% of frame width. Urban, forward-looking, clean, 8k, --ar 2500:1000
```

### stats47 での使い方
都市経済・都道府県別 GDP・商業系記事に合う。#88 よりアクセント強め。

---

# インデックス（fit=high 10 選）

迷ったら以下から選ぶと stats47 ブランドに必ず適合する。

| ID | 名前 | 特に推奨の用途 |
|---|---|---|
| 51 | ネイビー×白タイトル | 汎用、最万能 |
| 54 | 霧のグラデーション×浮遊 | 分析・思考系 |
| 55 | 真っ白×極太黒 | ランキング発表系 |
| 66 | ダークグレー×赤一本線 | フレームワーク解説 |
| 69 | グレー×巨大な丸 | テーマダッシュボード・全体像 |
| 75 | ミッドナイトブルー×星座線 | 相関分析・ネットワーク |
| 77 | ダーク×グリッド線 | データ分析全般 |
| 82 | ぼかした山脈 | 戦略・長期ビジョン |
| 85 | 夜空のグラデーション | 壮大テーマ・年間戦略 |
| 88 | 海と空の境界 | ビッグピクチャー・X ヘッダー |

# インデックス（用途別ショートカット）

### note 記事表紙で使える主力 (fit=high)
51 / 54 / 55 / 66 / 69 / 75 / 77 / 82 / 85 / 88

### ブログ記事 hero 画像
51 / 54 / 66 / 69 / 75 / 77 / 82 / 85 / 88

### X バナー・X ヘッダー（3:1 対応）
51 / 55 / 82 / 85 / 88 / 93

### ブランド素材・固定画像
51 / 69 / 77 / 82 / 85 / 88

### 2 地域比較ツール記事
65（スプリットカラー）

### 相関分析記事
75（星座線） / 69（円）

### 地図・地域系記事
91（古地図） / 82（山脈）

### 教育・入門系記事
73（黒板） / 54（霧）

### 和風・伝統系記事
61（和紙×墨）
