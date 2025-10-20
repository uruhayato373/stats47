# e-Stat API 分野選択時の NO_DATA_FOUND エラー解決策

## 問題の概要

統計分野を選択した際、**データが存在しない分野**に対してエラーが発生し、ユーザーにエラーメッセージが表示されます。

```
EstatStatsListError: 正常に終了しましたが、該当データはありませんでした。
```

### エラー発生箇所
- `src/lib/estat-api/stats-list/fetcher.ts:80:17` - エラーのスロー
- `src/hooks/estat-api/useStatsListSearch.ts:124:22` - 検索実行
- `src/components/pages/EstatAPIStatsListPage/EstatAPIStatsListPage.tsx:64:7` - ページからの呼び出し

## 原因分析

### 問題の発生フロー

1. **ユーザーが分野を選択** (`EstatAPIStatsListPage.tsx:89-101`)
   ```typescript
   const handleFieldSelect = useCallback((fieldCode: StatsFieldCode) => {
     search({
       statsField: fieldCode,
       limit: 100,
     });
   }, [search]);
   ```

2. **検索フックが分野検索を実行** (`useStatsListSearch.ts:114-132`)
   ```typescript
   response = await EstatStatsListFetcher.searchByField(
     options.statsField,
     { limit: options.limit || 100, ... }
   );
   ```

3. **Fetcherがエラーをスロー** (`fetcher.ts:73-80`)
   - e-Stat APIが「データなし」を返す (status !== 0)
   - `NO_DATA_FOUND`エラーとしてスロー

4. **検索フックのエラーハンドリング** (`useStatsListSearch.ts:208-229`)
   - リトライ処理が実行される（最大3回）
   - 各リトライで指数バックオフ（1秒、2秒、4秒）
   - 最終的にエラーメッセージをセット

5. **UIにエラーが表示される** (`EstatAPIStatsListPage.tsx:153-166`)

### 問題点

1. **データなしは正常なケース**なのにエラーとして扱われる
2. **無駄なリトライ処理**が実行される（最大3回のAPI呼び出し）
3. **ユーザー体験の悪化**（エラーメッセージの表示、待機時間）
4. **API制限への影響**（不要なAPIコール）

## 解決策

### 推奨アプローチ: 多層防御による包括的対応

3つのレイヤーで対応することで、堅牢なエラーハンドリングを実現します。

---

## レイヤー1: Fetcher層の修正（最重要）

**目的**: `NO_DATA_FOUND`を正常なケースとして扱う

### 修正ファイル: `src/lib/estat-api/stats-list/fetcher.ts`

```typescript
// 修正箇所: 73-89行目
} else if (
  errorMsg.includes("該当するデータが存在しません") ||
  errorMsg.includes("該当データはありませんでした") ||
  errorMsg.includes("正常に終了しましたが、該当データはありませんでした")
) {
  // データなしは正常なケース - 空のレスポンスを返す
  console.log(`ℹ️ Fetcher: データなし (${errorMsg})`);

  return {
    ...response,
    GET_STATS_LIST: {
      ...response.GET_STATS_LIST,
      RESULT: {
        STATUS: 0, // 正常ステータスに変更
        DATE: response.GET_STATS_LIST.RESULT.DATE,
        ERROR_MSG: "正常終了",
      },
      DATALIST_INF: {
        NUMBER: 0,
        RESULT_INF: {
          FROM_NUMBER: 0,
          TO_NUMBER: 0,
        },
        LIST_INF: undefined,
      },
    },
  };
}
```

### メリット
- 全ての呼び出し元で一貫した動作
- エラーハンドリングのコードが不要
- コードがシンプルになる
- パフォーマンスの向上

---

## レイヤー2: 検索フック層の修正

**目的**: `NO_DATA_FOUND`エラーの場合はリトライせず、空結果を返す

### 修正ファイル: `src/hooks/estat-api/useStatsListSearch.ts`

#### 1. インポートに`EstatStatsListError`と`EstatErrorType`を追加（既に存在）

```typescript
import {
  EstatStatsListFetcher,
  EstatStatsListFormatter,
  EstatStatsListError,  // 追加確認
  EstatErrorType,       // 追加確認
} from "@/lib/estat-api/stats-list";
```

#### 2. エラーハンドリングの修正（208-229行目）

```typescript
} catch (err) {
  console.error("❌ Hook: 検索エラー", err);

  // NO_DATA_FOUNDエラーの場合は空結果を返す（リトライしない）
  if (
    err instanceof EstatStatsListError &&
    err.type === EstatErrorType.NO_DATA_FOUND
  ) {
    console.log("ℹ️ Hook: データなし - 空の検索結果を返します");

    setSearchResult({
      totalCount: 0,
      fromNumber: 0,
      toNumber: 0,
      tables: [],
    });

    setIsLoading(false);
    return; // リトライせずに終了
  }

  // その他のエラーの場合はリトライ処理
  if (retryCountRef.current < maxRetries) {
    retryCountRef.current++;
    console.log(`🔄 Hook: リトライ ${retryCountRef.current}/${maxRetries}`);

    const waitTime = Math.pow(2, retryCountRef.current - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    return search(options);
  }

  setError(err instanceof Error ? err.message : "検索に失敗しました");
} finally {
  setIsLoading(false);
}
```

### メリット
- レイヤー1の修正が適用される前でも動作
- リトライ処理の無駄を防ぐ
- より明示的なエラーハンドリング

---

## レイヤー3: UI層の改善

**目的**: データなしの場合のUX改善

### 修正ファイル: `src/components/pages/EstatAPIStatsListPage/EstatAPIStatsListPage.tsx`

#### データなしの場合の表示改善（153-166行目）

```typescript
{/* エラー表示 */}
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          エラーが発生しました
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>{error}</p>
        </div>
      </div>
    </div>
  </div>
)}

{/* データなし表示（エラーではない） */}
{!error && searchResult && searchResult.tables.length === 0 && !isLoading && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
    <div className="flex">
      <div className="ml-3">
        <h3 className="text-sm font-medium text-blue-800">
          該当する統計データが見つかりませんでした
        </h3>
        <div className="mt-2 text-sm text-blue-700">
          <p>
            選択した条件では統計データが存在しません。
            <br />
            別の分野を選択するか、検索条件を変更してください。
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* 検索結果表示 */}
{searchResult && searchResult.tables.length > 0 && (
  <StatsListResults
    tables={searchResult.tables}
    totalCount={searchResult.totalCount}
    isLoading={isLoading}
    onTableSelect={handleTableSelect}
    onSort={handleSort}
    onFilter={handleFilter}
    sortBy="surveyDate"
    sortOrder="desc"
  />
)}
```

### メリット
- エラーと「データなし」を明確に区別
- ユーザーに次の行動を提案
- より良いUX

---

## 実装の優先順位

### 必須（Phase 1）
1. **レイヤー1の修正** - `fetcher.ts:73-89`
   - 最も根本的な解決策
   - 全ての呼び出し元に影響

### 推奨（Phase 2）
2. **レイヤー2の修正** - `useStatsListSearch.ts:208-229`
   - リトライ処理の最適化
   - パフォーマンス改善

### オプション（Phase 3）
3. **レイヤー3の修正** - `EstatAPIStatsListPage.tsx:153-180`
   - UX改善
   - より親切なメッセージ

---

## 実装手順

### Phase 1の実装

```bash
# 1. fetcher.tsを修正
# src/lib/estat-api/stats-list/fetcher.ts:73-89を上記の通り修正

# 2. 型定義の確認
# src/lib/estat-api/types/stats-list.tsで、DATALIST_INFとLIST_INFの型を確認
# LIST_INFがundefinableであることを確認

# 3. 動作確認
npm run dev

# ブラウザで以下をテスト:
# - データが存在する分野を選択 → 正常に表示
# - データが存在しない分野を選択 → エラーなし、空結果
# - コンソールにエラーログが表示されないことを確認
```

### Phase 2の実装

```bash
# 1. useStatsListSearch.tsを修正
# src/hooks/estat-api/useStatsListSearch.ts:208-229を上記の通り修正

# 2. 動作確認
# - データなし分野でリトライが発生しないことを確認
# - コンソールログで"リトライ"が表示されないことを確認
```

### Phase 3の実装

```bash
# 1. EstatAPIStatsListPage.tsxを修正
# src/components/pages/EstatAPIStatsListPage/EstatAPIStatsListPage.tsx:153-180を修正

# 2. UIの確認
# - データなし時に青い情報メッセージが表示されることを確認
# - エラーと区別されていることを確認
```

---

## テスト項目

### 基本動作テスト
- [ ] データが存在する分野を選択 → 統計表が表示される
- [ ] データが存在しない分野を選択 → 空結果が表示される（エラーなし）
- [ ] キーワード検索で結果なし → 空結果が表示される（エラーなし）

### エラーハンドリングテスト
- [ ] ネットワークエラー時 → エラーメッセージが表示される
- [ ] 不正なパラメータ → エラーメッセージが表示される
- [ ] データなしの場合 → エラーではなく情報メッセージ（Phase 3）

### パフォーマンステスト
- [ ] データなし分野でリトライが発生しない
- [ ] コンソールにエラーログが表示されない
- [ ] 必要なログ（情報ログ）は表示される

### リグレッションテスト
- [ ] 既存の検索機能が正常に動作
- [ ] ソート・フィルタ機能が正常に動作
- [ ] お気に入り機能が正常に動作

---

## 影響範囲

### 修正対象ファイル
1. `src/lib/estat-api/stats-list/fetcher.ts` - 必須
2. `src/hooks/estat-api/useStatsListSearch.ts` - 推奨
3. `src/components/pages/EstatAPIStatsListPage/EstatAPIStatsListPage.tsx` - オプション

### 影響を受ける機能
- 統計分野選択
- キーワード検索
- 政府統計コード検索
- 統計名リスト取得
- 更新された統計取得
- **すべての統計表検索機能**（fetchStatsListを使用する全機能）

### 他の呼び出し元の確認が必要
```bash
# fetchStatsListを使用している箇所を検索
grep -r "fetchStatsList\|searchByField\|searchByKeyword\|searchByStatsCode" src/
```

---

## 補足事項

### e-Stat APIの仕様

e-Stat APIは以下のレスポンスを返します：

```json
{
  "GET_STATS_LIST": {
    "RESULT": {
      "STATUS": 1,  // 0以外はエラー扱い
      "ERROR_MSG": "正常に終了しましたが、該当データはありませんでした。"
    }
  }
}
```

**重要**: `ERROR_MSG`に「正常に終了しました」と書いてあるのに、`STATUS`が0以外になっている矛盾した仕様。これが今回の問題の根本原因。

### なぜ空レスポンスを返すアプローチが最適か

1. **APIの仕様の矛盾を吸収** - APIレスポンスの矛盾をFetcher層で解決
2. **一貫性** - すべての呼び出し元で同じ動作
3. **シンプル** - エラーハンドリングが不要
4. **保守性** - 新しい機能追加時も考慮不要

---

## 参考資料

- e-Stat API仕様: https://www.e-stat.go.jp/api/api-info/api-spec
- 関連Issue: `docs/issues/estat-no-data-found-error.md`

---

## まとめ

### 最小限の対応（Phase 1のみ）
- `fetcher.ts`の1箇所のみ修正
- 5-10分で完了
- すべての機能に効果

### 推奨対応（Phase 1 + 2）
- `fetcher.ts`と`useStatsListSearch.ts`を修正
- 15-20分で完了
- パフォーマンス最適化も実現

### 完全対応（Phase 1 + 2 + 3）
- UI層も含めて修正
- 30分程度で完了
- 最高のUXを提供
