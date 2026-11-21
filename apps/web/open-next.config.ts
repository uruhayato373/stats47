// open-next.config.ts — @opennextjs/cloudflare adapter config
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
// R2 incremental cache: ISR/SSG エントリを R2 バケット (binding NEXT_INC_CACHE_R2_BUCKET) に
// 永続化する。これを設定しないと OpenNext は incremental cache を無効化し、
// revalidate を付けたページも毎リクエスト full render になる (キャッシュが効かない)。
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
// 同一データセンター内のリクエストに対し Cache API でローカルヒットを返すラッパー。
// long-lived モードは ISR/SSG エントリを最大 30 分エッジ再利用する。
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
// 期限切れ (revalidate 経過) の ISR エントリを作り直す queue。これが無いと保存された描画は
// 次のデプロイまで作り直されない (2026-11-13 のブログ改稿で旧版が残った)。
// memory queue は WORKER_SELF_REFERENCE (wrangler.toml の自分自身への service binding) に
// x-prerender-revalidate 付きの HEAD を投げて再描画させる。gateway はこの要求を Workers Cache に通さない。
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

export default defineCloudflareConfig({
  // 注意: AWS SDK の除外は next.config.ts の serverExternalPackages と webpack.externals で行う
  // Open-Next は next.config.ts の設定を読み取るため、ここでの設定は不要
  //
  // Workers runtime用のビルドを生成するには、ビルド時に --workers-runtime フラグを指定すること
  // package.json の workers:build スクリプトで既に設定済み

  // R2 を SSOT とする incremental cache。binding 名は override が要求する
  // NEXT_INC_CACHE_R2_BUCKET 固定 (wrangler.toml で stats47 バケットに割当)。
  // regional cache (long-lived) でエッジローカルヒットを上乗せする。
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: memoryQueue,
});
