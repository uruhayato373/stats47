# e-Stat API Core

共通インフラ層。e-Stat API との通信とデータ型定義を提供。

## client/

API クライアント実装。全機能から利用される。

## types/

型定義。API レスポンス型、共通型を定義。

## config/

API 設定（URL、タイムアウト、レート制限等）

## constants/

定数定義

## errors/

エラークラス定義

## 使用方法

```typescript
// 直接インポート
import { estatAPI } from "@/features/estat-api/core/client";
import { EstatMetaInfoResponse } from "@/features/estat-api/core/types";

// 統合index経由（推奨）
import { estatAPI, EstatMetaInfoResponse } from "@/features/estat-api";
```

## 注意事項

- この層は他の機能に依存してはいけません
- 変更時は全機能への影響を考慮してください
- 型定義の変更は特に慎重に行ってください
