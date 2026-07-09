---
type: note-draft
vertical: koumuin-estat-claude-code
category: skills
slug: claude-skills-routinize
title: 月次の e-Stat 集計を .claude/skills で 1 コマンド化する — 定型業務をスキル化する設計
description: 毎月の e-Stat データ取得 → 整形 → ダッシュボード更新を .claude/skills で 1 コマンド化する設計。SKILL.md の構造、引き継ぎ運用、人事異動対応まで。
created: 2026-05-26
status: ready-to-publish
is_paid: true
price_jpy: 300
target_chars: 9000
mvp: false
related_idea_no: 10
quality_phase: rewrite-1
tags: [koumuin, claude-code, estat, skills]
note_url: https://note.com/stats47/n/n53c16adaf2c7
published: true
published_at: 2026-06-14
---

# 月次の e-Stat 集計を .claude/skills で 1 コマンド化する — 定型業務をスキル化する設計

## はじめに

毎月第 1 営業日、統計担当のもとに「先月分の指標を更新して、課内資料に載せて」という依頼が下りてきます。e-Stat にログインして統計表 ID を覚え直し、API キーをどこに保存したか探し、ダウンロード形式を毎回間違え、Excel に貼り直します。

1 回 2-3 時間、毎月発生します。担当者が異動すると、新任者は最初の月だけで丸 1 日溶かしてしまいます。

Claude Code に同じ手順を `.claude/skills/` 配下のテキストファイル 1 枚として保存しておけば、翌月以降は「`/monthly-estat-update`」と打つだけで全工程が走ります。**初回 2-3 時間 → 月次 5 分**。

さらに人事異動が起きても skill は職場の資産として残り、新任者は SKILL.md を読むだけで前任者の段取りを引き継げます。

**こんな方に向けた記事です**

- 毎月の e-Stat 集計を繰り返しつつ、手順が自分の頭の中だけにある統計担当の職員
- 人事異動のたびに集計ノウハウが途切れ、後任が一から作り直す状況を変えたい方
- 定型業務を「1 コマンドで走る手順書」として職場に残したい方

**この記事でわかること**

- 月次の e-Stat 集計 (取得 → 整形 → ダッシュボード更新) を 1 コマンドに集約する設計
- SKILL.md の構造と、既存 skill を組み合わせて自前 skill を薄く保つ考え方
- 人事異動の引き継ぎを「SKILL.md を読んで」で完結させる運用の作り方

> **📌 この記事の読み方** — 本記事にはコマンド・設定例・プロンプト例など、やや専門的な記述も出てきます。ですが Claude Code の本質は「それらを自分で覚えること」ではなく、「**やってほしいことを言葉で頼めば、専門的な部分は AI が代わりに用意してくれる**」点にあります。掲載するコマンドや設定は丸暗記の対象ではなく「こう頼めば、こういうものが返ってくる」という地図として読んでください。

執筆者は元自治体職員です。Claude Code を使い、47 都道府県の統計サイト stats47.jp (約 2,000 のランキングを毎日自動更新) を個人で開発・運用しています。

同サイトの毎日更新は本記事で説明する「skill 化」が前提で、`/fetch-estat-data` `/inspect-estat-meta` `/search-estat` などの skill を組み合わせて回しています。

人口 10-30 万人規模の自治体では、統計担当 1 人が月次定型集計に 8-16 時間を費やしている事例が珍しくありません。本記事は、その時間を「初回設定 1 日 + 月次 5 分」に圧縮するための skill 設計指針です。

![SKILL.md の構造 — フロントマター + 手順 + 補助スクリプト](./images/structure-1-skill-anatomy.svg)
<!-- SVG: structure | SKILL.md の構造 -->

## 背景: なぜ自治体職員にこの課題があるか

民間ではノーコードツールやワークフロー自動化 (Zapier・Make など) で定型業務を自動化するのが一般的です。一方、自治体で同様のことが定着しにくい理由が 3 つあります。

- **基幹システムが LGWAN 系で隔離** — クラウドツールが直接接続できません
- **属人化の構造** — 「先月の集計どうやった?」が前任者の頭にしか残っていません
- **人事異動でリセット** — 2-3 年で担当が変わり、ノウハウが捨てられてしまいます

特に 3 番目が大きいです。Excel マクロを書ける職員が異動すると、後任は触れず、結局白紙からのやり直しになります。skill 化された「読めるテキストの業務マニュアル」は、この継承断絶を埋める現実解です。

e-Stat のデータは商用利用可で、出典明記が条件です (e-Stat 利用規約: <https://www.e-stat.go.jp/terms-of-use>、アクセス日 2026-05-26)。skill のテンプレに「出典を必ず挿入」と書いておけば、引き継ぎ後も規約遵守が継続します。

## 手順 / 解説

### Step 1: .claude/skills の正体 — Excel マクロより読みやすい業務マニュアル

`.claude/skills/` は、プロジェクトのルート (またはホームディレクトリ) に置くフォルダです。中に `<skill 名>/SKILL.md` を作ると、Claude Code がそれを「呼び出し可能な手順書」として認識します。

```
.claude/skills/
├── monthly-estat-update/
│   └── SKILL.md            ← これだけで skill が完成
├── fetch-estat-data/
│   └── SKILL.md
└── inspect-estat-meta/
    └── SKILL.md
```

`SKILL.md` の中身は、フロントマター (YAML) + 本文 (マークダウン) という構造です。フロントマターは Excel ワークブックのプロパティに、本文は「業務マニュアル」に相当します。

Excel マクロと違って、**読めば内容がわかる・修正できる・引き継げる**のが特長です。プログラミング知識は不要で、日本語で書けます。

### Step 2: SKILL.md のフロントマター 4 項目

最初に覚えるべきは 4 つだけです。

```yaml
---
name: monthly-estat-update
description: 毎月第 1 営業日に走らせる e-Stat 月次集計。
  「月次集計」「先月分の指標」「ダッシュボード更新」と頼まれたら使う。
disable-model-invocation: false
argument-hint: "[対象年月 (YYYY-MM)、省略時は前月]"
---
```

フロントマターの各項目の役割は以下のとおりです。

- **`name`**: skill の名前 (`/monthly-estat-update` で呼びます)
- **`description`**: Claude Code が「どんなときに使うか」を判断する手がかりです。**具体的な使いどころを書く**のが最重要です
- **`disable-model-invocation`**: `true` にすると skill を Claude 側から自動呼び出しさせません (人間が `/` で明示呼出のみになります)
- **`argument-hint`**: `/monthly-estat-update 2026-05` のように引数を取る場合のヒントです

特に `description` の書き方がコツです。「○○の業務」だけでは弱く、「『先月分の指標更新して』と言われたら」のような **発話例を 1-2 個入れる** と、Claude Code がスキルを呼び出す精度が上がります。

### Step 3: 月次集計 skill の骨格

題材は「人口・財政・産業の 3 指標を毎月更新して、ダッシュボード CSV を出力する」業務とします。skill の本文はこうなります。

`.claude/skills/monthly-estat-update/SKILL.md`:

```markdown
---
name: monthly-estat-update
description: 毎月第 1 営業日に走らせる e-Stat 月次集計。
  「月次集計」「先月分の指標」「ダッシュボード更新」と頼まれたら使う。
argument-hint: "[対象年月 (YYYY-MM)、省略時は前月]"

---

💡 **この記事を書いた私から、Claude Code 学習でひとつだけご紹介させてください（PR）**

この記事を読んでいる方は、Claude Code を業務に取り入れようとしているか、すでに使い始めているのだと思います。

独学でも十分に使えますが、「もっと体系的に学びたい」「詰まったときにすぐサポートを受けたい」という方には、Claude Code に特化した研修プログラムも選択肢のひとつです。

このリンクから申し込んでいただくと、私に紹介料が入ります。それでもお伝えするのは、Claude Code を業務で使いこなしたいすべての方に本当に役立つと思っているからです。

{{AFFILIATE_BANNER:ai_agent_camp}}

▶ Claude Code 特化研修「AI Agent Camp」の詳細はこちら（無料相談あり）

---

---

# 月次 e-Stat 集計 skill

統計担当の毎月の定型業務。3 指標 (人口・財政・産業) を更新する。

## 入力

- 引数: 対象年月 (省略時は前月)
- API キー: $ESTAT_API_KEY 環境変数から取得

## 手順

1. /fetch-estat-data で次の 3 つの統計表 ID を取得する
   - 人口総数: 0003448237
   - 歳出決算額: 0003411981
   - 製造品出荷額: 0003348423

2. 取得した JSON を CSV (列: 都道府県, 年月, 指標名, 値) に整形する

3. 出力先: `./output/YYYY-MM-monthly-dashboard.csv`
   - フッタに「出典: 政府統計の総合窓口 (e-Stat) より作成」を必ず含める

4. 47 都道府県のうち、当該自治体の県値を抽出して「先月比」「前年比」を計算する

5. 増減 5% 以上の指標があれば「⚠️ 注意」マーカーをつけて報告する

## 制約

- e-Stat API の `cdArea` `cdTimeFrom` は使わない (全国一括取得しメモリでフィルタ)
- 個人情報・決裁前資料は絶対に SKILL.md に書き込まない
- 出力ファイルは `./output/` 配下のみ。庁内システム領域に書き込まない

## 確認

- 対象年月が不明な場合は、作業前に確認する
- API キーが未設定の場合は作業を止めて報告する
```

### Step 4: skill を呼び出す

ここまで作れば、次回からはこれだけです:

```
/monthly-estat-update 2026-05
```

Claude Code が SKILL.md を読み込み、`/fetch-estat-data` で 3 つの統計表を取得し、CSV に整形し、当県値の前年比を計算し、増減 5% 以上があれば警告つきで報告します。月初 5 分で完了します。

第 2 回以降は引数だけ変えて呼びます:

```
/monthly-estat-update    # 引数省略時は前月
/monthly-estat-update 2026-06
```

### Step 5: e-Stat 既存 skill との組み合わせ

stats47 では `.claude/skills/estat/` 配下に汎用 skill を 3 つ整備しています。

- `/search-estat` — キーワードから統計表 ID を探します
- `/inspect-estat-meta` — 統計表のメタ情報 (時系列・カテゴリ) を確認します
- `/fetch-estat-data` — 統計表データを取得して JSON 化します

自前の `/monthly-estat-update` はこれらを呼ぶだけの薄いラッパーで構成できます。「全部自分で書く」必要はなく、**既存 skill を組み合わせる**のが現実的です。Lego ブロックを積むのに近い感覚で、組織内で skill を蓄積していけば、新規業務の skill 化コストは下がり続けます。

ここから先は有料部分:

### Step 6: skill 化すべき業務の見分け方 (3 軸)

すべての業務を skill にする必要はありません。次の 3 つに当てはまる業務だけを優先します。

毎月以上の頻度で繰り返す業務（月次集計・週次レポート・四半期報告など）が対象です。

また、誰がやっても同じ結果が出るはずの業務（公用文校正・統計データ取得・前年比計算など）、特定の人の頭の中にしかない業務（「あの集計のコツ」「議会答弁の作り方」など）も対象になります。

逆に **skill にしないほうがよい** 業務は以下のとおりです。

- 一度きりで二度とやらない業務 (その場でプロンプトを書けば十分です)
- 毎回状況に応じて判断や進め方が大きく変わる業務 (型にはめると窮屈です)

迷ったときの目安は **「来月もまた使うか?」** です。Yes なら skill にする価値があります。

![手作業 vs skill 化の比較](./images/infographic-1-routine-vs-skill.svg)
<!-- SVG: infographic | 手作業 (1 ヶ月 N 時間) vs skill 化 (1 コマンド) -->

### Step 7: skill の動作フロー (内部の仕組み)

`/monthly-estat-update` と打ってから集計完了までの内部処理は、4 段階に整理できます。

![/monthly-estat-update が呼ばれてから集計完了までの流れ](./images/flow-1-monthly-skill-flow.svg)
<!-- SVG: flow | skill 起動から完了までのパイプライン -->

1. **skill 解決** — Claude Code が `.claude/skills/monthly-estat-update/SKILL.md` を読み込みます
2. **コンテキスト注入** — SKILL.md の手順・制約・確認事項を Claude のプロンプトに追加します
3. **既存 skill 呼出** — `/fetch-estat-data` 等を順に実行します
4. **出力 + 報告** — CSV ファイルを書き、ユーザーに完了報告 + 警告を返します

ユーザーは内部処理を知らなくても問題ありません。「`/monthly-estat-update`」と打てば結果が返る、それだけで業務が回ります。これが「skill の本当の価値」です。

### Step 8: 人事異動の引き継ぎを skill で完結させる

自治体最大の課題、**人事異動の引き継ぎ**。skill 化した業務は、引き継ぎ書類に次の 3 つを書くだけで済みます。

```markdown
## 月次 e-Stat 集計

- 場所: .claude/skills/monthly-estat-update/SKILL.md
- 呼び出し方: /monthly-estat-update [年月]
- 例: /monthly-estat-update 2026-05

担当者は SKILL.md の「手順」「制約」を読めば全体像がわかる。
不明点は SKILL.md を直接修正してよい (テキストファイルなので)。
```

新任者はターミナルで `/monthly-estat-update` と打つだけで、前任者と同じ集計が走ります。前任者の暗黙知 (「あの統計表 ID は 0003448237」「先月比 5% 以上は注意」) は SKILL.md に記述として残っています。

> **重要**: skill には「手順」だけを書きます。実際のデータ (住民個人情報・決裁前資料) は絶対に書き込みません。skill はあくまで「やり方の説明書」であり、Excel のひな形と中身のデータが別物なのと同じ感覚で扱います。

### Step 9: 補助スクリプトを skill 配下に置く

skill によっては、`SKILL.md` だけでは収まらず、補助スクリプト (Python・Node.js) が必要になる場合があります。次のように配置します。

```
.claude/skills/monthly-estat-update/
├── SKILL.md
└── scripts/
    ├── calc-yoy.py          # 前年比計算ロジック
    └── format-csv.py        # CSV 整形ロジック
```

SKILL.md の本文に「Step 4 で `scripts/calc-yoy.py` を実行する」と書いておけば、Claude Code が自動でスクリプトを呼びます。スクリプトの中身は Claude Code 自身に書かせて構いません。

### Step 10: 庁内での運用 — 共有フォルダ + Git の選択肢

skill を組織で共有する方法は 2 通りあります。

- **共有フォルダ方式** — 課の共有フォルダに `.claude/skills/` 一式をコピーします。最も簡単です
- **Git リポジトリ方式** — 庁内 Git (GitLab 等) で管理します。変更履歴が残り、複数人が同時に編集できます

人口 5 万人未満の自治体なら共有フォルダで十分です。人口 10 万人超で複数課が触る場合は Git が現実解になります。stats47 では GitHub プライベートリポジトリで管理しており、skill の修正がそのまま `git log` に残るので「いつ・誰が・どう変えたか」がすぐ追えます。

### Step 11: ROI 試算 — 1 自治体での年間効果

人口 10-30 万人規模の自治体で、統計担当が月次集計に 8-16 時間/月 を費やしているとします。skill 化後は月次 5 分 = 0.08 時間です。

- 削減時間: (8-16) - 0.08 ≒ 8-16 時間/月
- 年間: 96-192 時間 = 12-24 日相当
- 初回設定: 1 日 (skill の作り込み + 動作確認)
- 投資回収: 約 1 ヶ月

複数業務を skill 化すれば効果は積み上がります。stats47.jp の毎日更新も、十数個の skill の組み合わせで回しています。

## よくあるつまずきと回避策

- **⚠️ skill が呼ばれない** → `description` に発話例が足りません。「『月次集計して』と言われたら」のように具体例を 1-2 個追加します
- **⚠️ SKILL.md を直したのに反映されない** → Claude Code を再起動します (skill は起動時に読み込む実装が多いためです)
- **⚠️ 補助スクリプトで個人情報をハードコード** → 絶対に避けます。データは引数で渡し、SKILL.md には「手順」のみを書きます
- **⚠️ skill が肥大化して読めない** → 1 skill 1 業務が原則です。複数業務を 1 つの SKILL.md に詰め込まないようにします
- **⚠️ 異動した前任者しか skill の意図がわからない** → SKILL.md の冒頭に「この skill は何のために存在するか」を 2-3 行で明記しておきます

## 応用 / 次に読むべき記事

- [#09 議会答弁・県民向けチャート生成](../09-assembly-chart-generation/draft.md) — 本記事のチャート生成ロジックを skill 化する具体例
- [#11 MCP sqlite で自前 DB と e-Stat 連携](../11-mcp-sqlite-search/draft.md) — skill の先、外部システム連携へ
- [#03 47 都道府県データを 1 コマンドで取得](../03-fetch-prefecture-ranking/draft.md) — 月次 skill から呼ぶ既存 skill の使い方

stats47.jp の実例も併せてどうぞ。

- 月次更新の対象指標例: <https://stats47.jp/category/economy>
- 全カテゴリ一覧: <https://stats47.jp/>

<!-- circulation-footer:v2 -->

## このシリーズについて

「公務員のための e-Stat × Claude Code 実務ガイド」全 12 本のシリーズ第 10 回。e-Stat 業務の効率化に関心がある方は、マガジン購読がお得です。

▶️ マガジン: 公務員のための e-Stat × Claude Code 実務ガイド
🔗 https://note.com/stats47/m/m1b836e4c8dce

姉妹マガジン「公務員 × Claude Code 実務活用ガイド (全 33 本)」では議事録・議会答弁・条例レビューなど統計以外の業務効率化を扱っています。

▶️ stats47.jp: 本記事で紹介した手順で運用している 47 都道府県統計サイト (約 2,000 のランキングを毎日自動更新)。動いている実例として参考にどうぞ。
🔗 https://stats47.jp
