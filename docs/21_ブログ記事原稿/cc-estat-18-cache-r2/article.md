---
title: "チャートデータを R2 にキャッシュ｜JSON 分割と命名規約を Claude Code 流で"
seoTitle: "[2026]Cloudflare R2キャッシュ｜Claude CodeでチャートデータJSON分割設計"
subtitle: "Claude Code 未経験エンジニアのための実例集 Part 18"
slug: cc-estat-18-cache-r2
description: "e-Stat 経由で取得したチャートデータを Cloudflare R2 にキャッシュ。URL ベースの JSON 分割設計と命名規約を Claude Code で実装する手順。"
category: ict
tags:
  - ClaudeCode
  - CloudflareR2
  - キャッシュ
  - アーキテクチャ
  - JSON設計
publishedAt: 2026-05-17
updatedAt: 2026-05-17
published: true
ogImage: /blog/cc-estat-18-cache-r2/og.png
---

Part 17 までで「e-Stat からデータを取って、47 都道府県のチャートを描く」基本パターンは一通り出揃いました。ところが、ここまでの実装をそのまま本番に出すと **新しい壁** にぶつかります。ページが開かれるたびに e-Stat API を叩いてしまう、という壁です。1 リクエスト 1 秒として、月間 10 万 PV なら 100,000 秒（約 27 時間）e-Stat に張り付くことになります。レート制限にも引っかかりますし、何より遅くて UX が崩壊します。

解決策はキャッシュ。**取ったデータは自分のストレージに保存しておき、ページからはそこを読む**。今回の Part 18 では、そのストレージとして Cloudflare R2 を選び、**チャートデータ用の JSON ファイルをどう分割し、どう名前を付け、Claude Code でどう put/get を書くか** までを通しで解説します。

ありがちな「all.json に全部突っ込む」設計を最初に否定し、URL に対応した命名規約 `app/<page-type>/<key>/<resource>.json` に着地させるのがこの記事の山場です。Cloudflare Workers の isolate 特性に絡む「reader にメモリキャッシュを持たせるな」という落とし穴も合わせて押さえます。


## なぜキャッシュが必要なのか — e-Stat 直叩きの限界

まず動機をはっきりさせます。「キャッシュは速度のため」と思われがちですが、e-Stat の場合は **3 つの理由** がすべて致命的です。

1. **レイテンシ**: e-Stat API は速い日でも 300-800 ms、混雑時は 2-3 秒。SSR/SSG で待つには遅すぎます
2. **レート制限**: 公開された具体的な閾値はないものの、短時間に数百リクエストを送ると 503 が返ってきます
3. **データの不変性**: 国勢調査・人口推計は年単位で更新。1 日に 1 万回 fetch しても答えは同じ

つまり「同じ JSON を 1 万回作り直している」のが直叩き設計です。これを 1 回作って R2 に置けば、以後 1 万人分のリクエストは R2 から配信されるだけ。e-Stat への負荷もゼロ、自分のサーバの CPU もほぼゼロになります。

直叩きと R2 キャッシュを観点ごとに並べると、差は速度だけにとどまりません。

- **レイテンシ**: 直叩きは 1 リクエスト 300〜2,000 ms。R2 キャッシュなら 30〜80 ms に縮みます
- **レート制限**: 直叩きは集中時に 503 で死にますが、R2 配信なら実質ありません
- **e-Stat 障害時の挙動**: 直叩きは e-Stat が落ちるとサイト全体が落ちます。R2 キャッシュなら古いデータが出続けるので、表示は止まりません
- **月間コスト（10 万 PV 想定）**: 直叩きは API 呼び出し過多で警告が出ますが、R2 は無料枠内で 0 円です
- **データ整合性**: 直叩きは常に最新。R2 はバッチ更新になるので、ここだけはトレードオフが生じます

トレードオフは「データ整合性」だけ。これは「夜間バッチで R2 を更新する」という設計で十分に吸収できます。e-Stat の更新頻度は月次〜年次なので、1 日 1 回の差分更新でも問題ない統計が大半です。

> [!NOTE]
> ここでいう「e-Stat のレート制限」は公式に閾値が公開されているものではなく、短時間に数百リクエストを送ると 503 が返ってくるという観測ベースの挙動です。閾値は明示されていないため、再現性を担保したいなら「自分のストレージに 1 回だけ取りに行く」設計が安全側に倒れます。


## なぜ Cloudflare R2 を選ぶか

ストレージは選択肢が多い領域です。AWS S3、Google Cloud Storage、Cloudflare R2、Backblaze B2、Supabase Storage——全部使ったことがあるエンジニアでも「今回はどれ？」で迷います。stats47 では Cloudflare R2 を選びました。理由は 4 つです。

### 1. エグレス（下り帯域）無料

R2 最大の特徴。S3 では 1 GB あたり \$0.09 のエグレス料金がかかりますが、R2 は **下りが無料**。10 万 PV × 1 ページあたり 100 KB の JSON を配信しても、月額の egress コストは 0 円です。

S3 の場合: 10 万 × 100 KB = 10 GB → 月 \$0.90（小さく見えるが、PV が 10 倍になると 10 倍効く）  
R2 の場合: **0 円**

### 2. S3 互換 API

R2 は S3 互換のオブジェクトストレージなので、AWS SDK (`@aws-sdk/client-s3`) や `aws-cli` が **そのまま** 使えます。乗り換えコストが低いし、いざとなれば S3 に戻せる。`PutObject` `GetObject` `ListObjectsV2` のセマンティクスが同じです。

### 3. Cloudflare Workers / Pages とのネイティブ連携

stats47 は Cloudflare Pages で Next.js を動かしているので、R2 バインディングが使えます。

```typescript
// wrangler.toml で binding するだけで env.R2 として使える
const obj = await env.R2.get("app/ranking/population/values.json");
const json = await obj.json();
```

S3 互換 API は **インターネット経由** の外部 HTTP になりますが、R2 binding は **同 PoP 内** で完結するので 10 ms 未満。これは S3 では真似できません。

### 4. 無料枠が広い

ストレージ 10 GB / 月、Class A 操作（put/list）100 万回 / 月、Class B 操作（get）1,000 万回 / 月まで無料。個人プロジェクトや中規模 SaaS の初期フェーズなら **完全無料** で運用できます。

10 GB ストレージ + 10 GB egress（10 万 PV × 100 KB JSON 相当）で月額を試算すると、差は egress 料金に集約されます。

- **AWS S3**: ストレージ \$0.23 + egress \$0.90 = 月 **\$1.13**
- **GCS**: ストレージ \$0.20 + egress \$0.80 = 月 **\$1.00**
- **Cloudflare R2**: ストレージ \$0.00 + egress \$0.00 = 月 **\$0.00**（無料枠内）

絶対額は小さく見えますが、PV が 10 倍になると egress も 10 倍効きます。R2 だけが「PV に対して egress コストが増えない」性質を持つため、配信量が読めない初期フェーズで効いてきます。

> [!TIP]
> R2 の弱点は「アジア圏のレイテンシが S3 東京リージョンよりやや劣る」「Lifecycle ルールが S3 ほど洗練されていない」あたりです。逆に言えば、レイテンシ要件が極端に厳しい配信や、世代管理を Lifecycle で精緻に回したいワークロードでは S3 のほうが向きます。stats47 のようなチャートデータ配信では弱点が刺さらないので採用した、というだけで、ワークロード次第で答えは変わります。


## Step 1: R2 バケット作成と wrangler セットアップ

ここから手を動かします。Cloudflare アカウントは作成済みで `wrangler` CLI（v3 以上）が入っている前提で進めます。入っていなければ Part 1 を参照してください。

### 1-1. ダッシュボードでバケット作成

ブラウザから [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → R2 → "Create bucket"。バケット名は **DNS 名と同じ制約**（小文字 + ハイフン）なので `stats47-cache` のように付けます。リージョンは "Automatic" でよし（最寄りに自動配置されます）。

CLI 派なら以下でも同じ:

```bash
wrangler r2 bucket create stats47-cache
```

### 1-2. ローカル開発用の API トークン発行

ローカルから put/get するために、R2 用の API トークンを発行します。

1. ダッシュボード → R2 → "Manage R2 API Tokens" → "Create API token"
2. 権限: `Object Read & Write` を選択
3. 対象: 上で作ったバケット
4. 発行された 3 つの値を控える: **Access Key ID** / **Secret Access Key** / **Endpoint URL**

`.env.local` に保存:

```bash
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET=stats47-cache
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

### 1-3. wrangler.toml で Workers / Pages にバインド

本番（Cloudflare Pages）から使うには binding が必要です。

```toml
# wrangler.toml
name = "stats47"
compatibility_date = "2026-06-01"

[[r2_buckets]]
binding = "R2"                # コード上では env.R2 でアクセス
bucket_name = "stats47-cache"
preview_bucket_name = "stats47-cache-preview"

# ローカル開発で永続化先を統一（重要）
[dev]
persist_to = "../../.local/d1"
```

stats47 ではモノレポ全体でローカル D1/R2 を `.local/d1` に揃えています。複数のサブパッケージから同じデータを参照したいので、persist 先を **絶対に分けない** のがコツです。

### 1-4. 動作確認

ここまでで bash から R2 を叩けるはずです。テストファイルを 1 個 put してみます。

```bash
# サンプル JSON
echo '{"hello":"r2"}' > /tmp/hello.json

# put
wrangler r2 object put stats47-cache/test/hello.json --file=/tmp/hello.json

# get
wrangler r2 object get stats47-cache/test/hello.json --file=/tmp/got.json
cat /tmp/got.json   # → {"hello":"r2"}
```

ここで失敗するなら、たいていは **企業ネットワークのプロキシで S3 API がブロックされている** ケースです（後述）。


## Step 2: モノリス all.json は避ける — URL に対応した JSON 分割

ここからが今回の本題です。**何のファイルを** R2 に置くかという設計の話です。最も犯しがちなアンチパターンが「ぜんぶ 1 つの `all.json` に入れる」設計です。stats47 でも最初の 3 ヶ月はこれでした。失敗を共有します。

### アンチパターン: 巨大な all.json

```typescript
// ❌ 全データを 1 ファイルに
await env.R2.put("ranking-items/all.json", JSON.stringify(allRankingItems));

// reader 側
const allItems = await fetchAllRankingItems();  // ← 20 MB を毎回ロード
const populationRanking = allItems.find(i => i.key === "population");
```

このコードの問題は **5 つ**:

1. **20 MB を毎回 fetch する** — 人口ランキング 1 件見たいだけなのに全カテゴリ分のデータが配信される
2. **更新粒度が大きい** — 1 件更新するために 20 MB を put し直す
3. **module-level メモリキャッシュ** がほぼ必須になる（後述の落とし穴）
4. **R2 の Class B 操作が増える** — `.find()` で絞る前にロードしているので
5. **キャッシュ失効が雑になる** — 1 件更新で 20 MB が全部失効

### あるべき設計: URL に対応した JSON 分割

代わりに **URL 1 つにつき必要な JSON だけを 1 ファイル** に分けます。URL `/ranking/population` が必要なのは「population ランキングの 47 都道府県の値」だけなので、`app/ranking/population/values.json` という 1 ファイルにまとめます。

```typescript
// ✅ URL に対応した最小ファイルを fetch
const values = await env.R2.get("app/ranking/population/values.json");
```

ロード量は数 KB に縮みます。更新も `population` だけを put すれば済みます。reader にキャッシュを持たせる必要もありません（Cloudflare 自体がエッジでキャッシュするので）。

両設計を並べると差は歴然です。

- **all.json 設計**: ファイル数 1、1 リクエストで 20 MB を fetch、更新粒度は全体
- **URL 対応分割**: ファイル数は数百〜数千だが、1 リクエストの fetch は 5〜50 KB、更新粒度は最小

ファイル数だけ見ると分割のほうが「散らかる」印象を受けますが、命名規約を決めておけば（次の Step 3）むしろ把握しやすくなります。

### 移行の判断基準

「いつ分割を考えるべきか」の目安:

- 1 ファイルが **100 KB を超えそうになったら** 分割を検討
- 「URL の一部だけ更新したい」が出てきたら **必ず分割**
- マスタデータ（カテゴリ・タグ）など全件参照する小さいデータは all で OK


## Step 3: 命名規約 `app/<page-type>/<key>/<resource>.json`

ファイルを分けると決めた途端に「じゃあどう名前を付ける？」で頭を抱えます。stats47 の答えは **URL 構造と 1:1 で対応させる**。

### 規約

```
app/<page-type>/<key>/<resource>.json
  ^^^           ^^^^   ^^^         ^^^^
  prefix        URL の  リソース ID  扱う実体
                セグメント
```

URL `/ranking/population` のページが必要な JSON はすべて `app/ranking/population/*` 配下に置きます。誰が見ても **URL から R2 パスを推測できる** のがゴールです。

### 対応の実例（stats47）

stats47 では URL と R2 キーが次のように 1:1 で対応しています。

- `/` → `app/home/featured.json`（トップの注目ランキング）
- `/ranking/[key]` → `app/ranking/[key]/item.json`（ランキング 1 件のメタ）
- `/ranking/[key]` → `app/ranking/[key]/values.json`（47 都道府県の値）
- `/ranking/[key]` → `app/ranking/[key]/ai-content.json`（AI 生成の解説）
- `/category/[key]` → `app/category/[key]/items.json`（カテゴリ内ランキング一覧）
- `/areas/[code]` → `app/areas/[code]/profile.json`（都道府県プロフィール）
- `/blog/[slug]` → `app/blog/[slug]/thumbnail-light.webp`（ブログサムネ）

たとえば人口推計のランキングページを開くと、ページは `app/ranking/population/values.json` を読みに行きます。URL の階層がそのまま R2 のキー階層になっているので、デバッグ時に「このページはどのファイルを読んでいるか」が即座に分かります。今回 R2 キャッシュの題材にした実データは、下記から確認できます。

<source-link href="/ranking/population">人口推計ランキング（47都道府県）を見る</source-link>

### 設計上のルール

stats47 では以下の補助ルールも定めています。

1. **`app/` プレフィックス必須** — Web アプリが fetch する全 JSON はここに集約。URL に対応しないインフラデータ（GIS 等）は別 prefix
2. **ファイル名の意味を決める**
   - `item.json` — 1 件の詳細
   - `items.json` — 一覧（複数件）
   - `profile.json` — 1 件のプロフィール（item.json と棲み分け）
   - `values.json` — 数値配列
3. **URL に現れないディレクトリ名を作らない** — `ranking-items/` のような名前は禁止です。命名規約違反になります

リクエストの流れを言葉で追うと、`Browser → /ranking/population` のアクセスが `Next.js Page（SSG）` に届き、ページが R2 を fetch して `app/ranking/population/values.json`・`app/ranking/population/ai-content.json`・`app/ranking/population/item.json` を読む、という一本道です。URL の階層がそのまま R2 のキー階層になるので、図に描き起こさなくても頭の中で経路を追えます。

### Claude Code への伝え方

この規約を Claude Code に渡すには、リポジトリのルールファイル（stats47 では `.claude/rules/r2-storage-design.md`）に明文化しておきます。すると以後、Claude Code に「新しい snapshot を追加して」と頼むと自動でこの命名規約に従ってくれます。**規約は文書化してこそ Claude Code が守る**——これが連載通して通底するメッセージです。


## Step 4: Claude Code で put_object 呼び出しを書く

設計が固まったら実装。Claude Code に頼むときのプロンプト例:

```
e-Stat から取得した 47 都道府県の人口データを R2 にキャッシュする
exporter スクリプトを書いてください。

要件:
- 入力: D1 から `ranking_data` テーブルを SELECT
- 出力: app/ranking/population/values.json
- 形式: { areaCode: string, value: number, rank: number }[]
- AWS SDK v3 (@aws-sdk/client-s3) を使う
- リトライ 3 回まで、指数バックオフ
- 既存ファイルとハッシュ比較して同一ならスキップ
- ETag を Content-MD5 から計算してレスポンスと突き合わせる

配置: packages/r2-storage/src/exporters/ranking-values-exporter.ts
```

Claude Code が返してくるのは概ね以下のような実装です。

```typescript
// packages/r2-storage/src/exporters/ranking-values-exporter.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 500;

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

type RankingValue = {
  areaCode: string;
  value: number;
  rank: number;
};

export async function exportRankingValues(
  rankingKey: string,
  values: RankingValue[]
): Promise<{ skipped: boolean; etag?: string }> {
  const key = `app/ranking/${rankingKey}/values.json`;
  const body = JSON.stringify(values);
  const md5 = createHash("md5").update(body).digest("base64");

  // 既存と比較して同一ならスキップ
  const existing = await readExisting(key);
  if (existing && existing === body) {
    return { skipped: true };
  }

  // put with retry
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: "application/json; charset=utf-8",
          ContentMD5: md5,
          CacheControl: "public, max-age=300, s-maxage=86400",
        })
      );
      return { skipped: false, etag: res.ETag };
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
    }
  }
  throw new Error("unreachable");
}

async function readExisting(key: string): Promise<string | null> {
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    return (await res.Body?.transformToString()) ?? null;
  } catch (err) {
    if (err instanceof NoSuchKey) return null;
    throw err;
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
```

ポイントは 4 つ:

1. **同一データなら put しない**（Class A 操作節約）
2. **ContentMD5 を渡す**（破損検知）
3. **Cache-Control を埋め込む**（後述）
4. **リトライは指数バックオフ**（503 対策）

呼び出し側はシンプルに:

```typescript
// scripts/sync-snapshots.ts
for (const rankingKey of allKeys) {
  const values = await loadFromD1(rankingKey);
  const { skipped } = await exportRankingValues(rankingKey, values);
  console.log(`${rankingKey}: ${skipped ? "SKIP" : "PUT"}`);
}
```

実行するとログがこう出ます:

```
population: PUT
aging-ratio: SKIP
medical-cost-per-capita: PUT
...
```

差分だけ put されるので、毎日のバッチでも R2 の Class A 操作は数十件に収まります。


## Step 5: 読み出し側に module-level キャッシュを持たせない理由

ここが Cloudflare Workers 特有の落とし穴です。**reader 関数に `let cached = null` のようなモジュールレベルキャッシュを置いてはいけません**。

### やってはいけないコード

```typescript
// ❌ アンチパターン
let cachedItems: RankingItem[] | null = null;

export async function readAllRankingItems(env: Env) {
  if (cachedItems) return cachedItems;
  const obj = await env.R2.get("app/ranking-items/all.json");
  cachedItems = await obj!.json();
  return cachedItems;
}
```

「2 回目以降の呼び出しが速くなる」と思いきや、Cloudflare Workers の **isolate ライフサイクル** がこれを台無しにします。

### なぜダメか — Cloudflare Workers の isolate 特性

Workers は **isolate** という軽量実行環境で動きます。1 isolate は数百リクエスト捌いて消えたり、急にスケールアウトして 100 個の isolate が並行で立ち上がったりします。**module-level 変数の寿命は isolate 寿命と同じ** で、しかも isolate は **PoP ごと・タイミングごとに別物** です。

つまり:

- 同じ URL を 100 人がアクセスしても、cachedItems がヒットするとは限らない
- データを更新しても、古い isolate に残った cachedItems は **更新を見ない**
- ローカル開発（Node.js プロセス）では「動いてる」ように見える → 本番で詰む

何より致命的なのは「古いデータを掴んだまま isolate が残り続ける」ことです。stats47 でこれを踏んで、ユーザーから「ランキングが昨日の値のまま」と問い合わせが来たことがあります。

> [!WARNING]
> この事故が厄介なのは、ローカル開発の Next.js（単一 Node.js プロセス）では module-level キャッシュが「ちゃんと効いている」ように見える点です。ローカルで再現しないため、本番デプロイ後に一部のユーザーだけが古い値を見続けるという、最も気づきにくい形で表面化します。「ローカルで動いた」を本番の保証にしないこと。Workers の isolate が PoP ごと・タイミングごとに別物だという前提を、コードを書く前に頭に入れておく必要があります。

### 正しい設計: 毎回 R2 から fetch

```typescript
// ✅ シンプルに毎回 fetch
export async function readRankingValues(env: Env, key: string) {
  const obj = await env.R2.get(`app/ranking/${key}/values.json`);
  if (!obj) return null;
  return obj.json();
}
```

「毎回 fetch して遅くないの？」と思うかもしれませんが、

- R2 binding は **同 PoP 内** で 10 ms 以下
- Cloudflare の **エッジキャッシュ** が前段で効く（Cache-Control を設定していれば）
- SSG/ISR で静的化していればそもそも fetch されない

結局、**「キャッシュは Cloudflare 任せ、コードは毎回素直に fetch」** が正解です。アプリ側のキャッシュは isolate の都合と戦うことになり、その複雑性に見合うメリットがありません。

ローカル開発の Next.js だと module-level キャッシュが「効いてる」ように見えるので尚更危険。**Workers の挙動を頭に入れた上で書く** ことが必須です。


## Step 6: ETag と Cache-Control の設定

R2 そのものではなく **配信** の話。put した JSON にどう Cache-Control を付けるかで、エンドユーザーの体感速度が大きく変わります。

### Cache-Control の方針

stats47 では JSON ごとに 2 種類の TTL を使い分けています。

```
public, max-age=300, s-maxage=86400
        ^^^^^^^^^^^  ^^^^^^^^^^^^^^
        ブラウザ 5 分  CDN 24 時間
```

- `max-age=300`: 個々のブラウザは 5 分間ローカル使い回し
- `s-maxage=86400`: Cloudflare エッジは 24 時間使い回し

「ブラウザ側のキャッシュは短く、エッジ側のキャッシュは長く」がコツです。ブラウザを長くしすぎるとデータ更新が反映されない端末が出ますが、エッジは長くしても明示的にパージできるので問題ありません。

### バッチ後のエッジパージ

データ更新後はエッジキャッシュをパージします。

```bash
# 全パージ（雑だが手っ取り早い）
wrangler r2 object purge stats47-cache

# 個別パージ（推奨）
curl -X POST \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://stats47.jp/api/r2/app/ranking/population/values.json"]}'
```

### ETag を使った 304 応答

R2 が返す ETag をクライアント側で握っておけば、`If-None-Match` ヘッダで 304 を引き出せます。これにより 2 回目以降は body 転送なしで「変わっていない」ことが分かります。

```typescript
// Workers / Next.js Route Handler
export async function GET(req: Request) {
  const obj = await env.R2.get("app/ranking/population/values.json");
  if (!obj) return new Response("Not Found", { status: 404 });

  const etag = obj.httpEtag;
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
      ETag: etag,
    },
  });
}
```

ブラウザの DevTools で見ると、アクセス回数ごとに次のように転送量が変わります。

- **1 回目**: `200 OK` で本体 50 KB を取得
- **2 回目（5 分以内）**: `200 OK (from disk cache)` で転送 0 B（ブラウザ側の `max-age` が効く）
- **3 回目（5 分経過後）**: `304 Not Modified` でヘッダのみ、本体 0 B（`If-None-Match` が一致）
- **4 回目（データ更新後）**: ETag が変わるので再び `200 OK` で 50 KB を取得

実装は 30 行ほどです。効果は大きいので、**ETag は最初から入れておく** ことを勧めます。


## つまずきポイント — 経験者の地雷踏み歴

連載通して書いていますが、ここでも詰まった話を共有します。

### つまずき 1: プロキシ環境で S3 API がブロックされる

社用 PC + 企業プロキシ環境だと、`wrangler r2 object put` で **HTTP 407（Proxy Auth Required）や 503** が返ってくることがあります。S3 互換 API は外向き HTTPS なので、プロキシで弾かれやすいのです。

回避策は 2 つ:

1. **wrangler CLI 経由にする** — wrangler 自体は Cloudflare API（ダッシュボード API）を叩くので、S3 API より通る確率が高い
2. **個人ネットワーク（テザリング等）から実行** — 一時的な回避

stats47 の `/push-r2` スキルにはこの fallback が組み込まれていて、S3 API が失敗したら自動で wrangler CLI に切り替わるようになっています。

### つまずき 2: キーの hot spot 問題

R2（S3）は内部的にキーのプレフィックスで分散します。**同じ prefix に書き込みが集中するとパーティションが偏る** のがクラウドストレージの定石です。たとえば全部 `app/ranking/...` に置くと、ピーク時に書き込み集中で速度が落ちることがあります。

対策はそこまで凝らなくて OK ですが、**バッチ実行時に並列度を上げすぎない**（50 並列くらいまで）を意識すると安全です。

### つまずき 3: ローカルでは動くが本番で 404

ローカルの wrangler dev では `app/ranking/population/values.json` が見えるのに、本番だと 404。よくある原因:

- ローカルは `persist_to` のローカル R2、本番は実 R2 を見ている → **`/sync-snapshots` で本番 R2 に push 忘れ**
- バインディング名が違う（`R2` vs `R2_CACHE` 等のタイポ）

stats47 では「ローカル D1（source of truth）→ `/sync-snapshots` → R2 → 本番配信」のフローを固定し、データ変更後は **必ず `/sync-snapshots` を走らせる** ルールを `.claude/rules/branch-workflow.md` に書いています。

### つまずき 4: 1 ファイル 5 MB を超えると怒られる

R2 自体は 5 GB まで 1 ファイルに格納できますが、**Cloudflare Workers のレスポンスサイズ上限**（無料プラン）に引っかかる場面があります。1 ファイルが 5 MB を超えそうなら、それは Step 2 の「分割を検討」のサインです。設計を見直しましょう。

### つまずき 5: 「キャッシュしたつもりが効いていない」

Cache-Control を設定したのに `cf-cache-status: BYPASS` がレスポンスに混じることがあります。原因は **Cookie / クエリストリング** がリクエストに付いていて、Cloudflare がデフォルトでキャッシュ対象から外している場合です。R2 配信用のエンドポイントは `Vary` / Cookie に依存させない設計にしてください。

```typescript
// Cookie を握らない、Set-Cookie を返さない
const headers = new Headers();
headers.delete("set-cookie");
```


## 次回予告: Skill チェーンで「e-Stat 取得 → R2 キャッシュ」を 1 コマンドに

Part 19 では、ここまでのフロー（e-Stat 取得 → ローカル D1 保存 → R2 キャッシュ）を **1 つの Claude Code スキル** にまとめます。`/sync-ranking` のような名前のスキルを定義しておくと、人間は「人口ランキング更新」と頼むだけで、メタ照会・API 呼び出し・D1 INSERT・R2 put・キャッシュパージまで全部走るようになります。

Skill 定義はファイル 1 つで済みます。複数のステップを「成功条件」「失敗時の戻し方」「ログの出し方」まで含めて記述し、Claude Code に **オペレーションを移譲する** ことが目的です。複雑なバッチほど Skill 化の効果は大きくなります。

Part 18 で作った exporter は、Part 19 で Skill 内から呼び出される **部品** になります。今のうちに名前と引数を整えておくと、後で楽です。


## シリーズの前後と参考

この記事は Claude Code 連載の Part 18 です。前後のステップと、料金・制限の一次情報をまとめておきます。

- **Part 17**: [教育費の格差を Slope Graph で可視化](/blog/cc-estat-17-edu-slope-graph) — Part 17 の続編が本記事です
- **Part 19**: [20本の図を毎週自動更新｜Skill チェーンと GitHub Actions Claude Code](/blog/cc-estat-19-skill-pipeline) — 本記事の exporter を Skill から呼び出して週次バッチ化します
- **カテゴリ**: [情報通信カテゴリ](/category/ict) — Web/インフラ系のランキング一覧
- **公式ドキュメント**: [Cloudflare R2 公式ドキュメント](https://developers.cloudflare.com/r2/)（2026-06 アクセス）— 料金・制限・無料枠の最新値はこちらが一次情報です


## まとめ

Part 18 で押さえた要点は次の 7 つ。

1. **キャッシュは速度のためだけでなく、レート制限回避と障害耐性のため** にも必要
2. **Cloudflare R2** はエグレス無料 + S3 互換 + Workers 連携で、stats47 のような JSON 配信に最適
3. **モノリス all.json は地獄**。URL 1 つにつき必要最小限の JSON を置く
4. **命名規約 `app/<page-type>/<key>/<resource>.json`** で URL と R2 キーを 1:1 に
5. **put 側はハッシュ比較で差分のみ、リトライは指数バックオフ**
6. **reader に module-level キャッシュを持たせない** — Workers isolate が事故る
7. **Cache-Control + ETag** でエッジと条件付きリクエストを使い倒す

ここまで来るとサイトの体感速度が一段上がり、e-Stat への負荷もほぼゼロになります。あとは「いつ更新するか」のバッチ設計に集中できます。これがキャッシュ層を持つことの最大の価値です。次回 Part 19 ではそのバッチを Claude Code の Skill に統合して、人間の運用負荷も一緒に下げます。お楽しみに。


## データ出典

- 本記事で R2 キャッシュの題材にした人口データは、政府統計ポータル [e-Stat](https://www.e-stat.go.jp/)（総務省統計局「人口推計」）を経由して整備したものです。表示している [人口推計ランキング](/ranking/population) は同データに基づきます。
- ストレージの料金・無料枠・操作上限、および R2 の仕様（エグレス無料・S3 互換 API・Workers binding・レスポンスサイズ上限）は [Cloudflare R2 公式ドキュメント](https://developers.cloudflare.com/r2/)（2026-06 アクセス）に基づく記載です。料金は改定されるため、実運用前に一次情報で最新値を確認してください。
- 記事内のコード・命名規約は stats47 リポジトリの実装（`packages/r2-storage` / `.claude/rules/r2-storage-design.md`）を簡略化したものです。
