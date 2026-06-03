/**
 * 都道府県間 人口移動フロー動画を、焦点県・フォーマット別にレンダーする再利用パイプライン。
 *
 * 出力: out/migration-flow/{format}/{prefCode}.mp4
 *   format = landscape (16:9 X/YouTube, 1920x1080) / portrait (9:16 Reels, 1080x1920)
 *   1 本 = 24 秒 (720 frames @ 30fps)、焦点県 1 県分。
 *
 * 実行 (リポジトリルートから):
 *   npm run pipeline:migration-flow --workspace remotion -- --pref 13
 *     → 東京 (13) を landscape で 1 本
 *   npm run pipeline:migration-flow --workspace remotion -- --pref 13,27,28
 *     → 複数県を landscape で
 *   npm run pipeline:migration-flow --workspace remotion -- --all
 *     → 全 47 県 (landscape)
 *   npm run pipeline:migration-flow --workspace remotion -- --pref 13 --format portrait
 *     → 縦型 9:16
 *
 * 前提: apps/remotion/public/migration-flow/{NN}.json が生成済み
 *       (cities/{NN}.topojson・municipalities/{NN}.json もあれば市区町村コロプレスが描画される)。
 *
 * 注意: Remotion の bundle() は public/ 全体をコピーする。SSD 未接続時に
 *       public/backgrounds/ges/{landscape,portrait} が dangling symlink になっていると
 *       コピーが ENOENT で落ちるため、bundle 前に壊れた symlink を退避し直後に復元する
 *       (migration-flow は GES 背景を使わないので退避しても描画に影響しない)。
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs/promises";
import path from "path";

type Format = "landscape" | "portrait";

const COMPOSITION_ID: Record<Format, string> = {
  landscape: "MigrationFlow-Reel",
  portrait: "MigrationFlow-Reel-Portrait",
};

const ALL_PREFS = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
/** Chrome を定期再起動する間隔 (動画レンダーはメモリを食う) */
const BROWSER_RESTART_INTERVAL = 5;

interface Args {
  prefs: string[];
  format: Format;
  theme: "light" | "dark";
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let format: Format = "landscape";
  let theme: "light" | "dark" = "light";
  let all = false;
  const prefTokens: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") {
      all = true;
    } else if (a === "--format") {
      const v = argv[++i];
      if (v === "landscape" || v === "portrait") format = v;
      else throw new Error(`--format は landscape | portrait のみ (受信: ${v})`);
    } else if (a === "--theme") {
      const v = argv[++i];
      if (v === "light" || v === "dark") theme = v;
      else throw new Error(`--theme は light | dark のみ (受信: ${v})`);
    } else if (a === "--pref") {
      prefTokens.push(...(argv[++i] ?? "").split(","));
    } else if (!a.startsWith("--")) {
      prefTokens.push(...a.split(","));
    } else {
      throw new Error(`不明なオプション: ${a}`);
    }
  }

  const prefs = all
    ? ALL_PREFS
    : prefTokens
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.padStart(2, "0"))
        .filter((t) => ALL_PREFS.includes(t));

  if (prefs.length === 0) {
    throw new Error(
      "県を指定してください: --pref <code[,code...]> または --all\n" +
        "例: npm run pipeline:migration-flow --workspace remotion -- --pref 13",
    );
  }
  return { prefs: [...new Set(prefs)], format, theme };
}

/** public/ 配下の dangling symlink を列挙する (lstat=symlink かつ stat=ENOENT) */
async function findBrokenSymlinks(root: string): Promise<string[]> {
  const broken: string[] = [];
  async function walk(dir: string) {
    let entries: import("fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isSymbolicLink()) {
        try {
          await fs.stat(full); // symlink を辿る。成功 = 生きている
        } catch {
          broken.push(full); // ENOENT 等 = dangling
        }
      } else if (e.isDirectory()) {
        await walk(full);
      }
    }
  }
  await walk(root);
  return broken;
}

/** dangling symlink を一旦消して target 文字列を控える (復元で同一 symlink を再作成) */
async function stashBrokenSymlinks(
  root: string,
): Promise<{ linkPath: string; target: string }[]> {
  const stash: { linkPath: string; target: string }[] = [];
  for (const linkPath of await findBrokenSymlinks(root)) {
    const target = await fs.readlink(linkPath);
    await fs.unlink(linkPath);
    stash.push({ linkPath, target });
  }
  if (stash.length > 0) {
    console.log(
      `🔗 dangling symlink を一時退避: ${stash.map((s) => path.relative(root, s.linkPath)).join(", ")}`,
    );
  }
  return stash;
}

async function restoreBrokenSymlinks(
  stash: { linkPath: string; target: string }[],
) {
  for (const { linkPath, target } of stash) {
    try {
      await fs.symlink(target, linkPath);
    } catch {
      /* 既に存在するなどは無視 */
    }
  }
}

async function main() {
  const { prefs, format, theme } = parseArgs();
  const projectRoot = path.resolve(__dirname, "..", "..");
  const srcPath = path.join(projectRoot, "src");
  const publicDir = path.join(projectRoot, "public");

  // 焦点県データの存在確認 (無い県はスキップ)
  const jobs: { prefCode: string; outputPath: string }[] = [];
  for (const prefCode of prefs) {
    const dataPath = path.join(publicDir, "migration-flow", `${prefCode}.json`);
    try {
      await fs.access(dataPath);
    } catch {
      console.warn(
        `⚠️  ${prefCode}: public/migration-flow/${prefCode}.json が無いのでスキップ`,
      );
      continue;
    }
    jobs.push({
      prefCode,
      outputPath: path.join(
        projectRoot,
        "out/migration-flow",
        format,
        `${prefCode}.mp4`,
      ),
    });
  }
  if (jobs.length === 0) {
    console.error("レンダー対象がありません。");
    process.exit(1);
  }

  console.log(
    `📦 Bundling Remotion project... (${jobs.length} 本: ${format} / theme=${theme})`,
  );
  // bundle() は public/ をコピーするので dangling symlink を退避してから実行し、直後に復元
  const stash = await stashBrokenSymlinks(publicDir);
  let bundleUrl: string;
  try {
    bundleUrl = await bundle({
      entryPoint: path.join(srcPath, "index.ts"),
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: { ...(config.resolve?.alias ?? {}), "@": srcPath },
        },
      }),
    });
  } finally {
    await restoreBrokenSymlinks(stash);
  }
  console.log("✅ Bundle completed\n");

  const compositionId = COMPOSITION_ID[format];
  let browser = await openBrowser("chrome");
  let success = 0;
  let fail = 0;
  const startTime = Date.now();

  try {
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];

      if (i > 0 && i % BROWSER_RESTART_INTERVAL === 0) {
        await browser.close({ silent: true });
        browser = await openBrowser("chrome");
        console.log("♻️  Chrome restarted\n");
      }

      const label = `${format}/${job.prefCode}`;
      console.log(`[${i + 1}/${jobs.length}] 🎬 ${label}`);
      try {
        await fs.mkdir(path.dirname(job.outputPath), { recursive: true });
        // landscape は format 省略 (コンポーネント既定が landscape)。
        // portrait は composition 自体の defaultProps が format:portrait を持つ。
        const inputProps = { theme, focusPrefCode: job.prefCode };
        const composition = await selectComposition({
          serveUrl: bundleUrl,
          id: compositionId,
          inputProps,
          puppeteerInstance: browser,
        });
        await renderMedia({
          serveUrl: bundleUrl,
          composition,
          outputLocation: job.outputPath,
          inputProps,
          codec: "h264",
          puppeteerInstance: browser,
        });
        console.log(`   ✅ ${path.relative(projectRoot, job.outputPath)}`);
        success++;
      } catch (err) {
        fail++;
        console.error(`   ❌ ${label} 失敗:`, err);
      }
    }
  } finally {
    await browser.close({ silent: true });
  }

  const mins = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n✅ 完了: 成功 ${success} / 失敗 ${fail} (${mins} 分)`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
