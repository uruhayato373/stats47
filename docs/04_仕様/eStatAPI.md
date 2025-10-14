## 8. API連携の技術的詳細

### 8.1 e-Stat API連携

#### エンドポイント
- **基本URL**: `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData`
- **認証方式**: APIキー認証
- **レート制限**: 1日1,000リクエスト
- **データ形式**: JSON

#### 実装例
```typescript
// API呼び出しの実装例
const fetchEstatData = async (params: EstatParams) => {
  const response = await fetch('/api/estat/stats-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error('API呼び出しに失敗しました');
  }
  
  return response.json();
};
```

#### エラーハンドリング
- **タイムアウト**: 30秒
- **リトライ**: 3回まで（指数バックオフ）
- **フォールバック**: サンプルデータの提供

### 8.2 データベース設計

#### Cloudflare D1スキーマ
```sql
-- ユーザー管理
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- e-Statメタ情報
CREATE TABLE estat_metainfo (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### データフロー
1. **データ取得**: e-Stat API → アプリケーション
2. **データ変換**: JSON → TypeScript型定義
3. **データ保存**: Cloudflare D1
4. **データ表示**: React コンポーネント