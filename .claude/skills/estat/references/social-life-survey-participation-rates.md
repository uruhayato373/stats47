# 社会生活基本調査 — 種目別行動者率

statsDataId: 0003456409 (スポーツ), 0003456573 (趣味・娯楽),
             0003456245 (学習・訓練), 0003456093 (旅行・行楽)

調査: 令和3年社会生活基本調査（総務省, 2021年実施, 2022-09-01 公開）

## 共通構造

4テーブルとも同じ cdTab・cat01 を使う。cat02 のみ旅行テーブルだけ異なる。

| パラメータ | 値 | 備考 |
|---|---|---|
| cdTab | `202110A09B08` | 行動者率 |
| cdCat01 | `0` (総数), `1` (男), `2` (女) | |
| cdCat02 | `99000` (総数) | **旅行のみ `0`**（頻度の総数） |
| cdCat03 | 種目コード（後述） | |
| 年次 | 2021年のみ (`2021000000`) | |
| 地域 | 全国 + 47都道府県 | area code `00000`〜`47000` |
| 単位 | ％ | |
| 対象年齢 | 10歳以上 | |

### cat02 の違い（重要）

| テーブル | cat02 の意味 | 総数コード | その他の値 |
|---|---|---|---|
| スポーツ・趣味・学習 | 人口集中地区区分 | `99000` | `99005` (DID), `99006` (非DID) |
| **旅行** | **頻度** | **`0`** | `1`〜`8` (年1回〜年10回以上) |

## populate 時の注意

`packages/estat-api` の `convertToStatsSchema` は cat02/cat03 がある多次元データを
除外する仕様（`convert-to-stats-schema.ts` L49）。
`populate-all-rankings.ts --key` では投入できないため、
e-Stat API を直接呼び出してデータを投入する必要がある。

## スポーツ (statsDataId: 0003456409)

22種目（総数・その他を除く）。ranking_key prefix: `sports-participation-rate-`

| cat03 | 種目名 | ranking_key suffix |
|---|---|---|
| `01` | 野球（キャッチボールを含む） | `baseball` |
| `02` | ソフトボール | `softball` |
| `03` | バレーボール | `volleyball` |
| `04` | バスケットボール | `basketball` |
| `05` | サッカー（フットサルを含む） | `soccer` |
| `06` | 卓球 | `table-tennis` |
| `07` | テニス | `tennis` |
| `08` | バドミントン | `badminton` |
| `09` | ゴルフ（練習場を含む） | `golf` |
| `10` | グラウンドゴルフ | `ground-golf` |
| `11` | 柔道 | `judo` |
| `12` | 剣道 | `kendo` |
| `13` | ボウリング | `bowling` |
| `14` | つり | `fishing` |
| `15` | 水泳 | `swimming` |
| `16` | スキー・スノーボード | `skiing` |
| `17` | 登山・ハイキング | `hiking` |
| `18` | サイクリング | `cycling` |
| `19` | ジョギング・マラソン | `jogging` |
| `20` | ウォーキング・軽い体操 | `walking` |
| `21` | ヨガ | `yoga` |
| `22` | 器具を使ったトレーニング | `gym-training` |

除外: `00` (総数), `23` (その他)

## 趣味・娯楽 (statsDataId: 0003456573)

34種目。ranking_key prefix: `hobby-participation-rate-`

| cat03 | 種目名 | ranking_key suffix |
|---|---|---|
| `01` | スポーツ観覧・観戦 | `sports-spectating` |
| `02` | 美術鑑賞 | `art-appreciation` |
| `03` | 演芸・演劇・舞踊鑑賞 | `theater` |
| `04` | 映画館での映画鑑賞 | `cinema` |
| `05` | 映画館以外での映画鑑賞 | `home-movie` |
| `06` | クラシック音楽鑑賞（コンサート等） | `classical-music` |
| `07` | ポピュラー音楽・歌謡曲鑑賞（コンサート等） | `popular-music` |
| `08` | CD・スマートフォンなどによる音楽鑑賞 | `music-listening` |
| `09` | 楽器の演奏 | `instrument` |
| `10` | 邦楽（民謡含む） | `japanese-music` |
| `11` | コーラス・声楽 | `chorus` |
| `12` | カラオケ | `karaoke` |
| `13` | 邦舞・おどり | `japanese-dance` |
| `14` | 洋舞・社交ダンス | `western-dance` |
| `15` | 書道 | `calligraphy` |
| `16` | 華道 | `flower-arrangement` |
| `17` | 茶道 | `tea-ceremony` |
| `18` | 和裁・洋裁 | `sewing` |
| `19` | 編み物・手芸 | `knitting` |
| `20` | 趣味としての料理・菓子作り | `cooking` |
| `21` | 園芸・庭いじり・ガーデニング | `gardening` |
| `22` | 日曜大工 | `diy` |
| `23` | 絵画・彫刻の制作 | `painting` |
| `24` | 陶芸・工芸 | `pottery` |
| `25` | 写真の撮影・プリント | `photography` |
| `26` | 詩・和歌・俳句・小説などの創作 | `writing` |
| `27` | 趣味としての読書（マンガを除く） | `reading` |
| `28` | マンガを読む | `manga` |
| `29` | 囲碁 | `go` |
| `30` | 将棋 | `shogi` |
| `31` | パチンコ | `pachinko` |
| `32` | ゲーム（スマホ・家庭用ゲーム機等） | `video-games` |
| `33` | 遊園地・動植物園・水族館 | `theme-parks` |
| `34` | キャンプ | `camping` |

除外: `00` (総数), `35` (その他)

## 学習・訓練 (statsDataId: 0003456245)

10種目。ranking_key prefix: `study-participation-rate-`

| cat03 | 種目名 | ranking_key suffix | 備考 |
|---|---|---|---|
| `1` | 外国語 | `foreign-language` | 親カテゴリ (= 11 + 12) |
| `11` | 英語 | `english` | |
| `12` | 英語以外の外国語 | `other-language` | |
| `2` | 商業実務・ビジネス関係（総数） | `business` | 親カテゴリ (= 21 + 22) |
| `21` | パソコンなどの情報処理 | `computer` | |
| `22` | 商業実務・ビジネス関係（情報処理除く） | `business-skills` | |
| `3` | 介護関係 | `nursing-care` | |
| `4` | 家政・家事 | `home-economics` | |
| `5` | 人文・社会・自然科学 | `academic` | |
| `6` | 芸術・文化 | `arts-culture` | |

除外: `0` (総数), `7` (その他)

親子カテゴリ注意: 外国語(1) = 英語(11) + 英語以外(12)。両方登録済み。

## 旅行・行楽 (statsDataId: 0003456093)

6種目。ranking_key prefix: `travel-participation-rate-`
category_key: `tourism`（他3テーブルは `educationsports`）

| cat03 | 種目名 | ranking_key suffix | 備考 |
|---|---|---|---|
| `1` | 行楽（日帰り） | `day-trip` | |
| `2` | 旅行（1泊2日以上） | `overnight` | 親カテゴリ (= 21 + 22) |
| `21` | 国内旅行 | `domestic` | 親カテゴリ (= 211 + 212) |
| `211` | 国内観光旅行 | `domestic-tourism` | |
| `212` | 帰省・訪問などの旅行 | `homecoming` | |
| `22` | 海外観光旅行 | `overseas` | |

除外: `0` (総数)

旅行テーブルの area に `00005` (人口集中地区), `00006` (非DID) が含まれる。
都道府県データ投入時はこれらを除外すること。
