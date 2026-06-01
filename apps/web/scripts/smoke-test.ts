/**
 * 本番スモークテスト（ヘルスチェック）
 *
 * 主要ページに HTTP リクエストを送り、ステータスコードと
 * 期待するテキストの存在を検証する軽量スクリプト。
 *
 * @example
 * # 本番環境（デフォルト）
 * npx tsx apps/web/scripts/smoke-test.ts
 *
 * # URL指定
 * npx tsx apps/web/scripts/smoke-test.ts --base-url http://localhost:3000
 */

const DEFAULT_BASE_URL = "https://stats47.jp";

interface SmokeTestCase {
  /** テスト名 */
  name: string;
  /** パス */
  path: string;
  /** 期待する HTTP ステータスコード */
  expectedStatus: number;
  /** レスポンスボディに含まれるべきテキスト（部分一致） */
  expectedTexts?: string[];
}

const testCases: SmokeTestCase[] = [
  {
    name: "トップページ",
    path: "/",
    expectedStatus: 200,
    expectedTexts: ["stats47"],
  },
  {
    name: "都道府県一覧",
    path: "/areas",
    expectedStatus: 200,
    expectedTexts: ["都道府県"],
  },
  {
    name: "都道府県詳細（北海道）",
    path: "/areas/01000",
    expectedStatus: 200,
    expectedTexts: ["北海道"],
  },
  {
    // 旧カテゴリ URL → テーマ URL に 301 リダイレクト (2026-06-02)
    name: "都道府県テーマ（北海道・人口動態、旧 /population → 301）",
    path: "/areas/01000/population",
    expectedStatus: 301,
  },
  {
    name: "都道府県テーマ（北海道・人口動態）",
    path: "/areas/01000/population-dynamics",
    expectedStatus: 200,
    expectedTexts: ["北海道"],
  },
  {
    // non-indexable かつ テーママップ外は 410
    name: "都道府県カテゴリ（北海道・気象、テーマなし）— 410 期待",
    path: "/areas/01000/landweather",
    expectedStatus: 410,
  },
  {
    name: "ランキング一覧（廃止 2026-05-28 → / に 301）",
    path: "/ranking",
    expectedStatus: 301,
  },
  {
    name: "ランキング詳細（総人口）",
    path: "/ranking/total-population",
    expectedStatus: 200,
    expectedTexts: ["人口"],
  },
  {
    name: "地域間比較 (旧 /compare は 301、新パス /category/{key}/compare)",
    path: "/category/population/compare?areas=13000,27000",
    expectedStatus: 200,
    expectedTexts: ["比較"],
  },
  {
    name: "404 ページ",
    path: "/this-page-does-not-exist-at-all",
    expectedStatus: 404,
  },
];

interface TestResult {
  name: string;
  path: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

async function runTest(
  baseUrl: string,
  testCase: SmokeTestCase,
): Promise<TestResult> {
  const url = `${baseUrl}${testCase.path}`;
  const start = Date.now();

  try {
    // リダイレクト期待 (3xx) の test case は follow すると最終ページ (200) に
    // 着地して status を観測できないため manual にする。それ以外は follow。
    const expectsRedirect =
      testCase.expectedStatus >= 300 && testCase.expectedStatus < 400;
    const response = await fetch(url, {
      redirect: expectsRedirect ? "manual" : "follow",
      headers: { "User-Agent": "stats47-smoke-test/1.0" },
    });
    const durationMs = Date.now() - start;
    const body = await response.text();

    // ステータスコード検証
    if (response.status !== testCase.expectedStatus) {
      return {
        name: testCase.name,
        path: testCase.path,
        passed: false,
        message: `Status ${response.status} (expected ${testCase.expectedStatus})`,
        durationMs,
      };
    }

    // テキスト存在検証
    if (testCase.expectedTexts) {
      for (const text of testCase.expectedTexts) {
        if (!body.includes(text)) {
          return {
            name: testCase.name,
            path: testCase.path,
            passed: false,
            message: `Missing text: "${text}"`,
            durationMs,
          };
        }
      }
    }

    return {
      name: testCase.name,
      path: testCase.path,
      passed: true,
      message: `OK (${response.status})`,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      name: testCase.name,
      path: testCase.path,
      passed: false,
      message: `Fetch error: ${error instanceof Error ? error.message : String(error)}`,
      durationMs,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrlIndex = args.indexOf("--base-url");
  const baseUrl =
    baseUrlIndex !== -1 && args[baseUrlIndex + 1]
      ? args[baseUrlIndex + 1]
      : DEFAULT_BASE_URL;

  console.log(`\n🔍 Smoke Test: ${baseUrl}\n`);

  const results = await Promise.all(
    testCases.map((tc) => runTest(baseUrl, tc)),
  );

  // 結果表示
  const maxNameLen = Math.max(...results.map((r) => r.name.length));
  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    const name = result.name.padEnd(maxNameLen);
    const duration = `${result.durationMs}ms`.padStart(6);
    console.log(`  ${icon} ${name}  ${duration}  ${result.message}`);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n  ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
