// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
	incrementalCache: r2IncrementalCache,
	// 注意: AWS SDK の除外は next.config.ts の serverExternalPackages と webpack.externals で行う
	// Open-Next は next.config.ts の設定を読み取るため、ここでの設定は不要
	// 
	// Workers runtime用のビルドを生成するには、ビルド時に --workers-runtime フラグを指定すること
	// package.json の workers:build スクリプトで既に設定済み
});
