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
updatedAt: 2026-10-23
published: true
ogImage: /blog/cc-estat-18-cache-r2/og.png
---

Part 17 までで「e-Stat からデータを取って、47 都道府県のチャートを描く」基本パターンは一通り出揃いました。ところが、ここまでの実装をそのまま本番に出すと **新しい壁** にぶつかります。ページが開かれるたびに e-Stat API を叩いてしまう、という壁です。1 リクエスト 1 秒として、月間 10 万 PV なら 100,000 秒（約 27 時間）e-Stat に張り付くことになります。レート制限にも引っかかりますし、何より遅くて UX が崩壊します。

解決策はキャッシュ。**取ったデータは自分のストレージに保存しておき、ページからはそこを読む**。今回の Part 18 では、そのストレージとして Cloudflare R2 を選び、**チャートデータ用の JSON ファイルをどう分割し、どう名前を付け、Claude Code でどう put/get を書くか** までを通しで解説します。

ありがちな「all.json に全部突っ込む」設計を最初に否定し、URL に対応した命名規約 `app/<page-type>/<key>/<resource>.json` に着地させるのがこの記事の山場です。Cloudflare Workers の isolate 特性に絡む「reader にメモリキャッシュを持たせるな」という落とし穴も合わせて押さえます。


## なぜキャッシュが必要なのか — e-Stat 直叩きの限界

まず動機をはっきりさせます。「キャッシュは速度のため」と思われがちですが、e-Stat の場合は **3 つの理由** がすべて致命的です。

1. **レイテンシ**: e-Stat API は応答が遅い時間帯があり、1 リクエストごとに待つ SSR/SSG には向きません。ページを開くたびに待たされる設計は避けたいところです
2. **レート制限**: 公開された具体的な閾値はないものの、短時間に数百リクエストを送ると 503 が返ってきます
3. **データの不変性**: 国勢調査・人口推計は年単位で更新。1 日に 1 万回 fetch しても答えは同じ

つまり「同じ JSON を 1 万回作り直している」のが直叩き設計です。これを 1 回作って R2 に置けば、以後 1 万人分のリクエストは R2 から配信されるだけ。e-Stat への負荷もゼロ、自分のサーバの CPU もほぼゼロになります。

直叩きと R2 キャッシュを観点ごとに並べると、差は速度だけにとどまりません。

- **レイテンシ**: 直叩きは毎回 e-Stat の応答を待ちます。R2 から読む場合は、同一 Cloudflare ネットワーク内の読み出しで済みます
- **レート制限**: 直叩きは集中すると 503 が返ることがあります（観測ベース、下の NOTE 参照）。R2 配信なら e-Stat 側の制限を受けません
- **e-Stat 障害時の挙動**: 直叩きは e-Stat が落ちるとサイト全体が落ちます。R2 キャッシュなら古いデータが出続けるので、表示は止まりません
- **月間コスト（10 万 PV 想定）**: 直叩きは API 呼び出し過多で警告が出ますが、R2 は無料枠内で 0 円です
- **データ整合性**: 直叩きは常に最新。R2 はバッチ更新になるので、ここだけはトレードオフが生じます

トレードオフは「データ整合性」だけ。これは「夜間バッチで R2 を更新する」という設計で十分に吸収できます。e-Stat の更新頻度は月次〜年次なので、1 日 1 回の差分更新でも問題ない統計が大半です。

> [!NOTE]
> ここでいう「e-Stat のレート制限」は公式に閾値が公開されているものではなく、短時間に数百リクエストを送ると 503 が返ってくるという観測ベースの挙動です。閾値は明示されていないため、再現性を担保したいなら「自分のストレージに 1 回だけ取りに行く」設計が安全側に倒れます。


## なぜ Cloudflare R2 を選ぶか

ストレージは選択肢が多い領域です。AWS S3、Google Cloud Storage、Cloudflare R2、Backblaze B2、Supabase Storage——全部使ったことがあるエンジニアでも「今回はどれ？」で迷います。stats47 では Cloudflare R2 を選びました。理由は 4 つです。

### 1. エグレス（下り帯域）無料

R2 最大の特徴。S3 は無料枠（月 100 GB）を超えた分のインターネット向け転送に料金がかかりますが、R2 は **下りが無料**。10 万 PV × 1 ページあたり 100 KB の JSON（月 10 GB 程度）なら S3 でも無料枠に収まりますが、配信量が増えて無料枠を超えたときに差が出ます。R2 の egress コストは配信量にかかわらず 0 円です。

### 2. S3 互換 API

R2 は S3 互換のオブジェクトストレージなので、AWS SDK (`@aws-sdk/client-s3`) や `aws-cli` が **そのまま** 使えます。乗り換えコストが低いし、いざとなれば S3 に戻せる。`PutObject` `GetObject` `ListObjectsV2` のセマンティクスが同じです。

### 3. Cloudflare Workers とのネイティブ連携

stats47 は Cloudflare Workers 上で Next.js（OpenNext）を動かしているので、R2 バインディングが使えます。

```typescript
// wrangler.toml の [[r2_buckets]] で binding すると、Worker のコードから env.R2 として使える
const obj = await env.R2.get("app/ranking/total-population/values.json");
const json = await obj.json();
```

S3 互換 API は署名付きの HTTP リクエストを自分で送る形ですが、R2 binding は Worker から直接呼び出す形で、アクセスキーの受け渡しも署名も要りません。Cloudflare の [Workers ベストプラクティス](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)（2026-10 アクセス）も、REST API ではなく binding を使うことを勧めています。

### 4. 無料枠が広い

Standard ストレージで、ストレージ 10 GB-month / 月、Class A 操作（put/list など書き込み系）100 万回 / 月、Class B 操作（get など読み取り系）1,000 万回 / 月まで無料です（[R2 の料金ページ](https://developers.cloudflare.com/r2/pricing/)、2026-10 アクセス）。個人プロジェクトや中規模サイトの初期フェーズなら、**無料枠の範囲内** で運用できます。

egress については、10 万 PV × 1 ページあたり 100 KB の JSON なら月 10 GB 程度で、この規模では AWS S3 でも差は出ません。S3 はインターネットへの転送が月 100 GB まで無料だからです（[S3 の料金ページ](https://aws.amazon.com/s3/pricing/)、2026-10 アクセス）。差が出るのは、配信量がその無料枠を超えてからです。

- **AWS S3**: 月 100 GB を超えた分の転送に、転送量に応じた料金がかかります
- **Cloudflare R2**: egress は無料で、料金がかかるのはストレージと操作回数だけです

つまり R2 の利点は、PV が増えて配信量が読めなくなっても、egress の請求が増えない点にあります。配信量の見通しが立たない初期フェーズで効いてきます。

> [!TIP]
> R2 にも向かないワークロードはあります。レイテンシや世代管理（Lifecycle ルールなど）の要件が厳しい場合は、機能と実測値を比べてから選んでください。stats47 のようなチャートデータ配信では、egress が無料な点が効くので採用した、というだけで、ワークロード次第で答えは変わります。


## Step 1: R2 バケット作成と wrangler セットアップ

ここから手を動かします。Cloudflare アカウントは作成済みで、`wrangler` CLI（v4 系）が入っている前提で進めます。この記事のコマンドは wrangler 4.148.0 時点の挙動を前提にしています。入っていなければ Part 1 を参照してください。

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

### 1-3. wrangler.toml で Worker にバインド

本番（Cloudflare Workers）から使うには binding が必要です。

```toml
# wrangler.toml
name = "stats47"
compatibility_date = "2026-06-01"

[[r2_buckets]]
binding = "R2"                # コード上では env.R2 でアクセス
bucket_name = "stats47-cache"
# wrangler dev でも本物のバケットを読みたいときだけ、次の 1 行を足す
# remote = true
```

`wrangler dev` は、既定ではローカルの R2 シミュレーションを使います。この間に保存したオブジェクトは自分のマシンの `.wrangler/state` にだけ存在し、本番バケットには影響しません。本番バケットに接続するには、binding に `remote = true` を足します（[R2 の Workers API](https://developers.cloudflare.com/r2/get-started/workers-api/)、2026-10 アクセス）。

`preview_bucket_name` は、`wrangler dev --remote` を使うときに必要な項目で、`remote = true` の remote bindings では要りません（[Wrangler の設定ドキュメント](https://developers.cloudflare.com/workers/wrangler/configuration/)）。連載の執筆時の確認では、`remote = true` と併記せず `preview_bucket_name` を外す必要がありました。公式ドキュメントは「不要」としか書いていないので、併記してエラーや意図しないバケットへの接続が起きたら、`preview_bucket_name` を外してください。

複数のサブパッケージから同じローカルデータを見たいときは、`wrangler dev --persist-to <共通のディレクトリ>` のように保存先を揃えます。保存先を **サブパッケージごとに分けない** のがコツです。

### 1-4. 動作確認

ここまでで bash から R2 を叩けるはずです。テストファイルを 1 個 put してみます。

```bash
# サンプル JSON
echo '{"hello":"r2"}' > /tmp/hello.json

# put（--remote を付けると本物のバケットに書き込む）
wrangler r2 object put stats47-cache/test/hello.json --file=/tmp/hello.json --remote

# get（確認も --remote を付ける）
wrangler r2 object get stats47-cache/test/hello.json --file=/tmp/got.json --remote
cat /tmp/got.json   # → {"hello":"r2"}

# 動作確認が済んだら、テスト用のオブジェクトを消す
wrangler r2 object delete stats47-cache/test/hello.json --remote
```

`wrangler r2 object put` と `get` には `--local`（ローカルの保存先）と `--remote`（本物のバケット）があります（[wrangler r2 コマンド](https://developers.cloudflare.com/workers/wrangler/commands/r2/)、2026-10 アクセス）。wrangler 4.148.0 で `--remote` を付けずに put すると、ローカルの保存先に書き込まれ、本番バケットには何も届きません。コマンドが成功と表示されるので、本番に反映されたと思い込みやすい点に注意してください。

ここで失敗する場合の多くは、`wrangler login` が済んでいないか、**企業ネットワークのプロキシ** に止められているケースです（後述）。


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

このコードの問題は **4 つ**:

1. **20 MB を毎回 fetch する** — 人口ランキング 1 件見たいだけなのに全カテゴリ分のデータが配信される
2. **更新粒度が大きい** — 1 件更新するために 20 MB を put し直す
3. **module-level メモリキャッシュ** がほぼ必須になる（後述の落とし穴）
4. **キャッシュ失効が雑になる** — 1 件更新で 20 MB が全部失効

### あるべき設計: URL に対応した JSON 分割

代わりに **URL 1 つにつき必要な JSON だけを 1 ファイル** に分けます。URL `/ranking/total-population` が必要なのは「人口ランキングの 47 都道府県の値」だけなので、`app/ranking/total-population/values.json` という 1 ファイルにまとめます。

```typescript
// ✅ URL に対応した最小ファイルを fetch
const values = await env.R2.get("app/ranking/total-population/values.json");
```

ロード量は数 KB に縮みます。更新も `total-population` だけを put すれば済みます。1 ページが読むファイルが増えるぶん R2 の読み取り操作の回数は増えますが、無料枠（月 1,000 万回）に対して小さい数です。分割の利点は操作回数ではなく、転送量・パース時間・メモリ・更新粒度にあります。reader にアプリ側のメモリキャッシュを持たせる必要もありません（理由は Step 5 と Step 6）。

両設計を並べると差は歴然です。

- **all.json 設計**: ファイル数 1、1 リクエストで 20 MB を fetch、更新粒度は全体
- **URL 対応分割**: ファイル数は数百〜数千だが、1 リクエストの fetch は 5〜50 KB、更新粒度は最小

ファイル数だけ見ると分割のほうが「散らかる」印象を受けますが、命名規約を決めておけば（次の Step 3）むしろ把握しやすくなります。

### 移行の判断基準

「いつ分割を考えるべきか」の目安:

- 1 ファイルが **数百 KB を超えそうになったら** 分割を検討（Worker のメモリ上限は 128 MB なので、数 MB まで読み込むのは危険ゾーンです。つまずき 4 を参照）
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

URL `/ranking/total-population` のページが必要な JSON はすべて `app/ranking/total-population/*` 配下に置きます。誰が見ても **URL から R2 パスを推測できる** のがゴールです。

### 対応の実例（stats47）

stats47 では URL と R2 キーが次のように 1:1 で対応しています。

- `/` → `app/home/featured.json`（トップの注目ランキング）
- `/ranking/[key]` → `app/ranking/[key]/item.json`（ランキング 1 件のメタ）
- `/ranking/[key]` → `app/ranking/[key]/values.json`（47 都道府県の値）
- `/ranking/[key]` → `app/ranking/[key]/ai-content.json`（AI 生成の解説）
- `/category/[key]` → `app/category/[key]/items.json`（カテゴリ内ランキング一覧）
- `/areas/[code]` → `app/areas/[code]/databook.json`（都道府県データブック）
- `/blog/[slug]` → `app/blog/[slug]/thumbnail-light.webp`（ブログサムネ）

たとえば人口推計のランキングページを開くと、ページは `app/ranking/total-population/values.json` を読みに行きます。URL の階層がそのまま R2 のキー階層になっているので、デバッグ時に「このページはどのファイルを読んでいるか」が即座に分かります。今回 R2 キャッシュの題材にした実データは、下記から確認できます。

あわせて見る: [人口推計ランキング（47都道府県）](/ranking/total-population)

### 設計上のルール

stats47 では以下の補助ルールも定めています。

1. **`app/` プレフィックス必須** — Web アプリが fetch する全 JSON はここに集約。URL に対応しないインフラデータ（GIS 等）は別 prefix
2. **ファイル名の意味を決める**
   - `item.json` — 1 件の詳細
   - `items.json` — 一覧（複数件）
   - `databook.json` — 1 件のデータブック（item.json と棲み分け）
   - `values.json` — 数値配列
3. **URL に現れないディレクトリ名を作らない** — `ranking-items/` のような名前は禁止です。命名規約違反になります

リクエストの流れを言葉で追うと、`Browser → /ranking/total-population` のアクセスが `Next.js Page（SSG）` に届き、ページが R2 を fetch して `app/ranking/total-population/values.json`・`app/ranking/total-population/ai-content.json`・`app/ranking/total-population/item.json` を読む、という一本道です。URL の階層がそのまま R2 のキー階層になるので、図に描き起こさなくても頭の中で経路を追えます。

### Claude Code への伝え方

この規約を Claude Code に渡すには、リポジトリのルールファイル（stats47 では `.claude/rules/r2-storage-design.md`）に明文化しておきます。すると以後、Claude Code に「新しい snapshot を追加して」と頼むと自動でこの命名規約に従ってくれます。**規約は文書化してこそ Claude Code が守る**——これが連載通して通底するメッセージです。


## Step 4: Claude Code で put_object 呼び出しを書く

設計が固まったら実装。Claude Code に頼むときのプロンプト例:

```
e-Stat から取得した 47 都道府県の人口データを R2 にキャッシュする
exporter スクリプトを書いてください。

要件:
- 入力: 取得・整形済みの 47 都道府県の値（ローカルの JSON ファイル）
- 出力: app/ranking/total-population/values.json
- 形式: { areaCode: string, value: number, rank: number }[]
- AWS SDK v3 (@aws-sdk/client-s3) を使う
- リトライ 3 回まで、指数バックオフ
- 既存ファイルとハッシュ比較して同一ならスキップ

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

ポイントは 3 つ:

1. **同一データなら put しない**（Class A 操作節約）
2. **Cache-Control を埋め込む**（後述）
3. **リトライは指数バックオフ**（503 や 429 対策）

呼び出し側はシンプルに:

```typescript
// scripts/sync-snapshots.ts
for (const rankingKey of allKeys) {
  const values = await loadValues(rankingKey);  // ローカルの JSON を読む関数
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

Workers は **isolate** という軽量実行環境で動きます。1 つの isolate が複数のリクエストを処理することはありますが、あるリクエストが同じ isolate に届くか別の isolate に届くかは保証されません。Cloudflare 自身も、グローバル状態を使ったり書き換えたりしないことを勧めています（[How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/)、2026-10 アクセス）。**module-level 変数の寿命は isolate の寿命と同じ** で、isolate は予告なく入れ替わります。

つまり:

- 同じ URL を 100 人がアクセスしても、cachedItems がヒットするとは限らない
- データを更新しても、古い isolate に残った cachedItems は **更新を見ない** 可能性がある
- ローカル開発（Node.js プロセス）では「動いてる」ように見える → 本番で詰む

何より致命的なのは「古いデータを掴んだまま isolate が残り続ける」ことです。更新を見落とした値が、残っている isolate にだけ居座ります。

> [!WARNING]
> この事故が厄介なのは、ローカル開発の Next.js（単一 Node.js プロセス）では module-level キャッシュが「ちゃんと効いている」ように見える点です。ローカルで再現しないため、本番デプロイ後に一部のユーザーだけが古い値を見続けるという、最も気づきにくい形で表面化します。「ローカルで動いた」を本番の保証にしないこと。リクエストがどの isolate に届くかは保証されないという前提を、コードを書く前に頭に入れておく必要があります。

### 正しい設計: 毎回 R2 から fetch

```typescript
// ✅ シンプルに毎回 fetch
// （OpenNext の Next.js からは、env を getCloudflareContext() で取り出して渡す）
export async function readRankingValues(env: Env, key: string) {
  const obj = await env.R2.get(`app/ranking/${key}/values.json`);
  if (!obj) return null;
  return obj.json();
}
```

「毎回 fetch して遅くないの？」と思うかもしれませんが、

- R2 binding は Worker から直接呼ぶ形で、署名や認証情報の受け渡しがない
- SSG/ISR で静的化していればそもそも fetch されない
- キャッシュが要るなら、isolate のメモリではなく、Workers Cache や Cache API のようにプラットフォームが管理するキャッシュに載せる

ここで **読み出しの経路によってエッジキャッシュが効くかどうかが違う** 点に注意してください。R2 の公式ドキュメント（[R2 の consistency](https://developers.cloudflare.com/r2/reference/consistency/)、2026-10 アクセス）には、キャッシュは Worker の API binding や S3 API 経由のアクセスには影響しないと書かれています。それらは直接バケットに対する操作で、キャッシュを通らないためです。

- **カスタムドメイン経由で読む**（ブラウザや SSR からの `fetch("https://storage.stats47.jp/app/...")`）: エッジキャッシュを使えます。ただし Cloudflare の CDN は `.json` を既定ではキャッシュしないので（[Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)、2026-10 アクセス）、そのホスト名に Cache Rule（Eligible for cache）を作って Edge TTL を決める必要があります。そのうえで、put 時の `Cache-Control` とゾーンのキャッシュパージ（Step 6）が意味を持ちます
- **Worker の binding（`env.R2.get`）経由で読む**: バケットに直接当たるので、エッジキャッシュは効きません。キャッシュが要るなら、Workers Cache や Cache API を自分で足します

結局、**「メモリ上の自前キャッシュは持たず、キャッシュは経路に応じてプラットフォームのものを使う」** のが正解です。アプリ側のキャッシュは isolate の都合と戦うことになり、その複雑性に見合うメリットがありません。

ローカル開発の Next.js だと module-level キャッシュが「効いてる」ように見えるので尚更危険。**Workers の挙動を頭に入れた上で書く** ことが必須です。


## Step 6: ETag と Cache-Control の設定

R2 そのものではなく **配信** の話です。put した JSON にどう Cache-Control を付けるかで、エンドユーザーの体感速度が大きく変わります。ただし Step 5 で書いたとおり、この Cache-Control とエッジキャッシュが効くのは、バケットに繋いだカスタムドメイン経由で読む場合です。Worker の binding 経由の読み出しはキャッシュを通りません。

### Cache-Control の方針

stats47 では JSON ごとに 2 種類の TTL を使い分けています。

```
public, max-age=300, s-maxage=86400
        ^^^^^^^^^^^  ^^^^^^^^^^^^^^
        ブラウザ 5 分  CDN 24 時間
```

- `max-age=300`: 個々のブラウザは 5 分間ローカル使い回し
- `s-maxage=86400`: Cloudflare エッジは 24 時間使い回し

「ブラウザ側のキャッシュは短く、エッジ側のキャッシュは長く」がコツです。エッジ側の `s-maxage` は、`.json` を対象にした Cache Rule を作ってはじめて効きます。ブラウザを長くしすぎるとデータ更新が反映されない端末が出ますが、エッジは長くしても明示的にパージできるので問題ありません。

### バッチ後のエッジパージ

データ更新後はエッジキャッシュをパージします。

wrangler の `r2 object` コマンドは get / put / delete だけで、キャッシュのパージ用コマンドはありません。パージは、R2 を公開しているドメインのゾーンに対して、Cloudflare の cache purge API を呼びます。

```bash
# 更新したファイルだけをパージ（URL を指定する）
curl -X POST \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://storage.stats47.jp/app/ranking/total-population/values.json"]}'
```

`$CF_API_TOKEN` にはゾーンのキャッシュパージ権限を持つトークンを使います。R2 の API トークン（Object Read & Write）とは別物で、R2 用のトークンではパージできません。

### ETag を使った 304 応答

R2 が返す ETag をクライアント側で握っておけば、`If-None-Match` ヘッダで 304 を引き出せます。これにより 2 回目以降は body 転送なしで「変わっていない」ことが分かります。

```typescript
// OpenNext の Next.js の Route Handler の例（素の Workers なら env は fetch ハンドラの引数）。
// ここで付ける Cache-Control は、ブラウザと、Workers Cache を有効にしたときの Worker 前段のキャッシュ向けです
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: Request) {
  const { env } = getCloudflareContext();
  const obj = await env.R2.get("app/ranking/total-population/values.json");
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

この例の `if-none-match` の比較は完全一致だけを見ています。複数の ETag が並ぶ場合や、`W/` で始まる弱い ETag は扱えないので、そこまで要るなら比較を丁寧に書いてください。実装は 30 行ほどです。効果は大きいので、**ETag は最初から入れておく** ことを勧めます。


## つまずきポイント — 経験者の地雷踏み歴

連載通して書いていますが、ここでも詰まった話を共有します。

### つまずき 1: プロキシ環境で S3 API がブロックされる

社用 PC + 企業プロキシ環境だと、AWS SDK（S3 互換 API）で `PutObject` したときに **HTTP 407（Proxy Auth Required）や 503** が返ってくることがあります。S3 互換 API は外向き HTTPS なので、プロキシで弾かれやすいのです。

回避策は 2 つ:

1. **wrangler CLI 経由にする** — wrangler は Cloudflare API を叩くので、S3 API より通る確率が高い。ただし本番バケットに書くには `wrangler r2 object put ... --remote` と `--remote` を付ける必要があります（付けないとローカルに書くだけです）。wrangler の put は 1 回に 1 オブジェクトで、扱えるファイルは 315 MB までです
2. **個人ネットワーク（テザリング等）から実行** — 一時的な回避

stats47 の `/push-r2` スキルにはこの fallback が組み込まれていて、S3 API が失敗したら自動で wrangler CLI に切り替わるようになっています。

### つまずき 2: 同じキーへの連続書き込みで 429

R2 には、**同じオブジェクト名（キー）への書き込みは 1 秒に 1 回まで**という制限があります。超えると HTTP 429（レート制限）が返ります（[R2 の制限](https://developers.cloudflare.com/r2/platform/limits/)、2026-10 アクセス）。バッチを並列化すると、同じ `values.json` を複数のジョブが同時に書きに行く形になりやすいので注意してください。

対策は、**1 つのキーを書くジョブを 1 つにする**ことです。Step 4 の exporter は 429 でもリトライしますが、そもそも同じキーを同時に書かない設計にしておくほうが確実です。

### つまずき 3: ローカルでは動くが本番で 404

ローカルの wrangler dev では `app/ranking/total-population/values.json` が見えるのに、本番だと 404。よくある原因:

- ローカルは `.wrangler/state` のローカル R2 のシミュレーション、本番は実 R2 を見ている → **`--remote` を付けずに put した**、または **本番 R2 への push 忘れ**
- バインディング名が違う（`R2` vs `R2_CACHE` 等のタイポ）

stats47 では「ローカルで生成した JSON → `/sync-snapshots` → R2 → 本番配信」のフローを固定し、データ変更後は **必ず `/sync-snapshots` を走らせる** ルールを `.claude/rules/branch-workflow.md` に書いています。

### つまずき 4: 大きな JSON を Worker で読み込むとメモリが足りない

R2 自体は 1 リクエストで 4.995 GiB（multipart では 4.995 TiB）までの 1 ファイルを格納できます。しかし Workers のメモリは **1 isolate あたり 128 MB** で、`await obj.json()` のように丸ごと読み込むと、大きな JSON ではこの上限に近づきます（[Workers の制限](https://developers.cloudflare.com/workers/platform/limits/)、2026-10 アクセス）。複数のリクエストが 1 つの isolate でメモリを共有する点にも注意が必要です。1 ファイルが数 MB を超えそうなら、それは Step 2 の「分割を検討」のサインです。設計を見直しましょう。

### つまずき 5: 「キャッシュしたつもりが効いていない」

Cache-Control を設定したのにキャッシュが効かないとき、まず疑うのは BYPASS ではなく DYNAMIC（キャッシュの対象外）であることが多いです。`.json` は既定でキャッシュ対象の拡張子に入っていないので、Cache Rule を作っていないと DYNAMIC になります。`cf-cache-status: BYPASS` が混じる場合の原因は、Cloudflare の公式ドキュメント（[Workers Caching の自動バイパス条件](https://developers.cloudflare.com/workers/cache/configuration/#automatic-bypass-conditions)、[デバッグ](https://developers.cloudflare.com/workers/cache/debugging/)、2026-10 アクセス）では、レスポンスに `Set-Cookie` が付いていること、リクエストに `Authorization` ヘッダーがあること、`Cache-Control` に `private` や `no-store` が入っていること、GET / HEAD 以外のメソッドなどです。クエリストリングは BYPASS の原因ではなく、キャッシュキーの一部になります。`Cf-Cache-Status` が付かないときは、キャッシュが有効になっていない可能性があるので、`wrangler.toml` の `cache.enabled = true` と wrangler のバージョンを確認してください。R2 配信用のエンドポイントは、Cookie を付けず、`Cache-Control: public` を明示してください。

```typescript
// 実際に返すレスポンスから Set-Cookie を外す
const headers = new Headers({
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=86400",
});
const res = new Response(obj.body, { headers });
res.headers.delete("set-cookie");  // 認証・セッション用の Set-Cookie が混ざらないようにする
```


## 次回予告: Skill チェーンで「e-Stat 取得 → R2 キャッシュ」を 1 コマンドに

Part 19 では、ここまでのフロー（e-Stat 取得 → JSON への整形 → R2 キャッシュ）を **1 つの Claude Code スキル** にまとめます。`/sync-ranking` のような名前のスキルを定義しておくと、人間は「人口ランキング更新」と頼むだけで、メタ照会・API 呼び出し・JSON 整形・R2 put・キャッシュパージまで全部走るようになります。

Skill 定義はファイル 1 つで済みます。複数のステップを「成功条件」「失敗時の戻し方」「ログの出し方」まで含めて記述し、Claude Code に **オペレーションを移譲する** ことが目的です。複雑なバッチほど Skill 化の効果は大きくなります。

Part 18 で作った exporter は、Part 19 で Skill 内から呼び出される **部品** になります。今のうちに名前と引数を整えておくと、後で楽です。


## シリーズの前後と参考

この記事は Claude Code 連載の Part 18 です。前後のステップと、料金・制限の一次情報をまとめておきます。

- **Part 17**: [教育費の格差を Slope Graph で可視化](/blog/cc-estat-17-edu-slope-graph) — Part 17 の続編が本記事です
- **Part 19**: [20本の図を毎週自動更新｜Skill チェーンと GitHub Actions Claude Code](/blog/cc-estat-19-skill-pipeline) — 本記事の exporter を Skill から呼び出して週次バッチ化します
- **カテゴリ**: [情報通信カテゴリ](/category/ict) — Web/インフラ系のランキング一覧
- **公式ドキュメント**: [Cloudflare R2 公式ドキュメント](https://developers.cloudflare.com/r2/)（2026-10 アクセス）— 料金・制限・無料枠の最新値はこちらが一次情報です


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
