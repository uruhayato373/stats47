# note マガジン設定: 公務員 × Claude Code × e-Stat

note.com でマガジンを作成する際の設定値とコピー。Profile 5 (note.com/stats47) で作成する。

## 課金モデル

- 種類: **買い切りマガジン**
- 価格: **¥1,480** (有料 9 本をバンドル)
- 個別記事: 有料 9 本は各 ¥300、無料 3 本は ¥0
- 訴求: 個別に全部買うと ¥300 × 9 = ¥2,700 → マガジンなら ¥1,480 (46% OFF)

## タイトル (30 文字以内)

```
公務員のための e-Stat × Claude Code 実務ガイド
```

(28 文字。代替案: 「自治体職員の e-Stat 統計データ取得ガイド」22 字 / 「公務員 × e-Stat × Claude Code 実務」22 字)

## 説明文 (案・note のマガジン説明欄にペースト)

```
「他自治体との比較資料、議会答弁の根拠データ、県民向け説明資料——e-Stat で都道府県統計を引いてくる仕事は、毎月のように発生するのに『毎回ゼロから検索してダウンロードして Excel で整形』を繰り返していませんか?」

そんな自治体職員のための、e-Stat API × Claude Code 実務ガイド (全 12 本)。e-Stat の API key 取得から、47 都道府県データの一括取得、Excel/CSV の構造把握、pandas/DuckDB での派生指標計算、議会答弁用チャート生成、月次ルーティンの自動化までを、コピペで動くサンプル付きで解説します。

執筆者は、Claude Code で 47 都道府県の統計サイト stats47.jp (約 2,000 のランキングを毎日自動更新) を個人で開発・運用。本マガジンで紹介する手順は、すべて stats47 の実運用で使い込んだものです。「AI で本当に統計データ業務が回るのか」の答えは、実際に動いているものを見てもらうのが早い、という考えで書いています。

▼ このマガジンについて
・全 12 本 (無料 3 本 + 有料 9 本)
・有料記事は個別 ¥300。本マガジン (¥1,480) なら有料 9 本すべて読めます
・はじめての方は #00「e-Stat × Claude Code とは」(無料) からどうぞ
・Excel / CSV / SQLite / pandas / DuckDB / MCP まで実務寄りでカバー

▼ 公務員 × Claude Code 全般版もあります
姉妹マガジン「公務員 × Claude Code 実務活用ガイド (全 33 本)」では、議事録・議会答弁・条例レビュー・補助金書類のチェックなど、統計以外の業務効率化を扱っています。
```

## カバー画像

専用カバー作成済み: `magazine-cover-1280x670.png` (このディレクトリ直下、1280×670)

記事カバーと同デザイン言語 (中央ボックス) + 専用の別背景 (`assets/koumuin-magazine-bg.png`・flagship ゴールド)。再生成:

```bash
node .claude/scripts/note/generate-koumuin-covers.cjs --magazine
```

シリーズ名・本数・価格の SSOT は本 MAGAZINE.md。変更したら `MAGAZINES` 定義 (`generate-koumuin-covers.cjs`) を合わせて再生成する。
note のマガジン作成画面でこの画像をアップロードする。

## 作成後の手順

1. マガジン作成 → URL を取得 (`https://note.com/stats47/m/m...`)
2. `node .claude/scripts/note/inject-magazine-url.cjs --vertical koumuin-estat-claude-code <マガジン URL>` で全 12 本の `{{ESTAT_MAGAZINE_URL}}` を実 URL に置換
3. `/publish-note` で公開 (Phase 0 ガードが未注入を検知)
4. 公開した 12 本をマガジンに追加

収録記事の一覧は [INDEX.md](INDEX.md) の「12 本一覧」を参照。
