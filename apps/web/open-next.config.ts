// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({
	// 注意: AWS SDK の除外は next.config.ts の serverExternalPackages と webpack.externals で行う
	// Open-Next は next.config.ts の設定を読み取るため、ここでの設定は不要
	// 
	// Workers runtime用のビルドを生成するには、ビルド時に --workers-runtime フラグを指定すること
	// package.json の workers:build スクリプトで既に設定済み
});
