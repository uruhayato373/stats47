const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定
  dir: "./",
});

// Jestのカスタム設定
const customJestConfig = {
  // テスト環境の設定
  testEnvironment: "jsdom",

  // テストファイルのパターン
  testMatch: ["**/__tests__/**/*.(ts|tsx|js)", "**/*.(test|spec).(ts|tsx|js)"],

  // モジュールパスの設定
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // テストセットアップファイル
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // カバレッジの設定
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/*.story.{ts,tsx}",
  ],

  // テストのタイムアウト設定
  testTimeout: 10000,

  // モジュールファイル拡張子
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // 変換対象のファイル
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // 静的ファイルのモック
  moduleNameMapping: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
  },
};

module.exports = createJestConfig(customJestConfig);
