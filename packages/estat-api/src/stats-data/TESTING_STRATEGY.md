# estat-api テスト戦略と構造化方針

## 現状分析

### ディレクトリ構造
```
packages/estat-api/src/
├── core/                    # 共通基盤（バレルファイルあり、テストなし）
│   ├── client/              # HTTPクライアント
│   ├── config/              # 設定
│   ├── errors/              # エラー定義
│   ├── types/               # 共通型
│   ├── utils/               # ユーティリティ（retry, rate-limiter）
│   └── index.ts             # バレルファイル
├── stats-data/              # 統計データドメイン
│   ├── repositories/        # データアクセス層
│   │   ├── api/             # e-Stat API呼び出し
│   │   └── cache/           # R2キャッシュ
│   ├── services/            # ビジネスロジック
│   ├── utils/               # ユーティリティ
│   ├── types/               # 型定義
│   └── __tests__/           # テスト（現在1ファイルのみ）
├── stats-list/              # 統計表一覧ドメイン（テストあり）
└── meta-info/               # メタ情報ドメイン（テストあり）
```

---

## テスト戦略

### 1. テストの優先順位（ボトムアップ）

```
[1] core/utils        → 純粋関数、依存なし
[2] repositories      → 外部依存をモック
[3] utils             → 純粋関数が多い
[4] services          → repositories をモック
[5] 統合テスト        → E2E的な検証
```

**理由:**
- ボトムアップで進めると、上位層のテスト時に下位層の信頼性が担保される
- 純粋関数から始めることでモックの複雑さを避けられる

### 2. stats-data テスト計画

#### Phase 1: 純粋関数のテスト（依存なし）
| ファイル | テスト内容 |
|---------|-----------|
| `utils/extract-year-code.ts` | 年度コード抽出 |
| `utils/generate-year-name.ts` | 年度名生成 |
| `utils/convert-to-stats-schema.ts` | スキーマ変換 |
| `repositories/cache/generate-cache-key.ts` | キャッシュキー生成 |
| `repositories/cache/sanitize-metadata.ts` | メタデータサニタイズ |
| `repositories/api/build-request-params.ts` | リクエストパラメータ構築 |
| `repositories/api/validate-response.ts` | レスポンスバリデーション |

#### Phase 2: モック必要なテスト
| ファイル | モック対象 |
|---------|-----------|
| `repositories/cache/find-cache.ts` | R2Bucket |
| `repositories/cache/save-cache.ts` | R2Bucket |
| `repositories/api/fetch-from-api.ts` | HTTP client |
| `services/fetch-stats-data.ts` | repositories |
| `services/fetch-formatted-stats.ts` | fetch-stats-data |

### 3. core テスト計画

#### テストすべきファイル
| ファイル | 関数 | テスト内容 | 優先度 |
|---------|------|-----------|--------|
| `utils/retry.ts` | `executeWithRetry` | リトライロジック、エラー時の再試行 | 高 |
| `utils/rate-limiter.ts` | `RateLimiter` | レート制限、待機処理 | 高 |
| `client/http-client.ts` | `composeApiUrl` | URL構築（純粋関数） | 高 |
| `client/http-client.ts` | `validateResponseStatus` | HTTPステータス検証 | 高 |
| `client/http-client.ts` | `executeHttpRequest` | HTTP通信（fetchモック必要） | 中 |
| `core/utils/validate-meta-info-response.ts` | `validateMetaInfoResponse` | e-Stat API固有のエラー検証 | 高 |

---

## core カプセル化方針

### 現状の問題
- `core/index.ts` が全てを `export *` で公開している
- 内部実装が外部に露出している

### 推奨構造

```typescript
// core/index.ts（公開API）
export { executeHttpRequest } from "./client/http-client";
export { executeWithRetry } from "./utils/retry";
export { ESTAT_API, ESTAT_ENDPOINTS } from "./config";
export type { EstatApiError } from "./errors";
// 内部実装は公開しない
```

### バレルファイルの原則
1. **明示的エクスポート**: `export *` ではなく、公開するものを明示
2. **内部/外部の区別**: 外部向けAPIと内部実装を分離
3. **型のみエクスポート**: 実装詳細は隠蔽し、型のみ公開する場合もある

---

## テストファイル配置

### 推奨構造
```
packages/estat-api/src/
├── core/
│   └── __tests__/
│       ├── retry.test.ts
│       └── rate-limiter.test.ts
├── stats-data/
│   └── __tests__/
│       ├── repositories/
│       │   ├── generate-cache-key.test.ts
│       │   └── build-request-params.test.ts
│       ├── utils/
│       │   ├── extract-year-code.test.ts
│       │   └── convert-to-stats-schema.test.ts
│       └── services/
│           └── fetch-stats-data.test.ts
```

### 命名規則
- テストファイル: `{対象ファイル名}.test.ts`
- テストディレクトリ: `__tests__/`（各ドメインルートに配置）

---

## 実装順序

### Step 1: core のテスト追加
1. `core/__tests__/retry.test.ts` 作成
2. `core/__tests__/rate-limiter.test.ts` 作成

### Step 2: core のカプセル化
1. `core/index.ts` を明示的エクスポートに変更
2. 内部実装を隠蔽

### Step 3: stats-data repositories のテスト
1. `generate-cache-key.test.ts`
2. `build-request-params.test.ts`
3. `validate-response.test.ts`

### Step 4: stats-data utils のテスト
1. `extract-year-code.test.ts`
2. `convert-to-stats-schema.test.ts`

### Step 5: stats-data services のテスト
1. `fetch-stats-data.test.ts`（モック使用）

---

## テストツール

- **テストフレームワーク**: Vitest
- **モック**: vi.mock / vi.fn
- **アサーション**: expect (Vitest built-in)

---

## 注意事項

- E2E テストは別途検討（実際のAPI呼び出しを含む）
- R2Bucket のモックは `@stats47/r2-storage` のテストユーティリティを使用
- HTTP通信のモックは `msw` または `vi.mock` を検討
