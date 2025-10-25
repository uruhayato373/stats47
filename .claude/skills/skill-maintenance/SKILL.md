---
name: skill-maintenance
description: ドキュメント構造の変更に応じてskills定義を自動更新します。docs配下のドキュメントが追加・移動・削除された時や、skillの参照を最新化したい時に使用してください。
allowed-tools: Read, Glob, Grep, Edit, Write
---

# Skill メンテナンス自動化

このskillは、プロジェクトのドキュメント構造の変更を検知し、既存のskill定義を自動的に更新します。

## 使用タイミング

- `docs/` 配下のドキュメントファイルを移動・リネームした時
- 新しい重要なドキュメントを追加した時
- skill定義とドキュメント構造の整合性を確認したい時
- ドキュメントパスの参照を一括更新したい時

## 実行フロー

### 1. ドキュメント構造のスキャン

現在のドキュメント構造を確認します：

```bash
# 技術設計ドキュメントの一覧
docs/01_技術設計/**/*.md

# 開発ガイドの一覧
docs/04_開発ガイド/**/*.md

# その他重要ドキュメント
docs/**/*.md
```

### 2. 既存skill定義の読み込み

すべてのskill定義ファイルを確認：

```bash
.claude/skills/*/SKILL.md
```

### 3. 参照パスの検証

各skillが参照しているドキュメントパスが有効か確認：

- 絶対パスの存在確認
- 相対パスの解決確認
- 削除されたファイルへの参照検知

### 4. 自動更新の実施

以下の更新を自動実行：

#### 4.1 パス修正

```markdown
# 修正前
/Users/minamidaisuke/stats47/docs/old-path/document.md

# 修正後（ファイルが移動していた場合）
/Users/minamidaisuke/stats47/docs/new-path/document.md
```

#### 4.2 新規ドキュメントの追加提案

新しく追加された重要なドキュメントがあれば、関連するskillへの追加を提案：

```markdown
# 検出例
新規追加: docs/01_技術設計/07_新機能設計/feature.md
→ coding-standards skill に追加を提案
```

#### 4.3 削除されたドキュメントの参照除去

存在しないファイルへの参照を自動削除または警告：

```markdown
# 警告例
⚠️ coding-standards/SKILL.md が参照している以下のファイルが存在しません：
- /Users/minamidaisuke/stats47/docs/old-file.md
```

## 更新対象のskill

### coding-standards skill

参照ドキュメント：
- 実装パターン.md
- コンポーネント設計.md
- プロジェクト構造.md

更新内容：
- パスの修正
- 新しい設計ドキュメントの追加
- 削除されたドキュメントの参照削除

### 将来的に追加されるskill

新しいskillが追加された場合も自動的にスキャン対象に含めます。

## 実装手順

### Step 1: ドキュメントインベントリの作成

```typescript
// すべてのMarkdownファイルをスキャン
const allDocs = glob('docs/**/*.md');

// カテゴリ別に分類
const docsByCategory = {
  technicalDesign: allDocs.filter(d => d.includes('01_技術設計')),
  developmentGuide: allDocs.filter(d => d.includes('04_開発ガイド')),
  // ...
};
```

### Step 2: Skill定義のパース

```typescript
// すべてのSKILL.mdを読み込み
const skills = glob('.claude/skills/*/SKILL.md');

// パス参照を抽出
const references = skills.map(skill => {
  const content = readFile(skill);
  return extractFilePaths(content);
});
```

### Step 3: 整合性チェック

```typescript
// 各参照パスの存在確認
references.forEach(ref => {
  if (!fileExists(ref.path)) {
    // 類似パスを検索
    const suggestion = findSimilarPath(ref.path, allDocs);
    console.log(`Missing: ${ref.path}`);
    console.log(`Suggestion: ${suggestion}`);
  }
});
```

### Step 4: 自動更新

```typescript
// パスを自動修正
updateSkillFile(skillPath, oldPath, newPath);

// 新規ドキュメントの提案
suggestNewReferences(skill, newDocs);
```

## 実行例

```bash
# ユーザーの呼び出し
"docsを更新したのでskillsも更新して"

# Skill実行
1. docs/配下をスキャン
2. .claude/skills/配下をスキャン
3. 整合性チェック実行
4. 自動更新 or 提案を表示
```

## 出力レポート

```markdown
# Skill メンテナンスレポート

## 検出された問題

### coding-standards skill
- ❌ 存在しないパス: docs/old/file.md
- ✅ 修正提案: docs/new/file.md に移動されています

## 新規ドキュメント

- ➕ docs/01_技術設計/07_新機能/feature.md
  → coding-standards skill への追加を推奨

## 実施した更新

- ✏️ coding-standards/SKILL.md
  - パス修正: old/file.md → new/file.md
  - 新規参照追加: 07_新機能/feature.md
```

## 注意事項

- **破壊的変更は確認を求める**: 大きな変更の場合はユーザーに確認
- **バックアップを作成**: 更新前に既存のSKILL.mdをバックアップ
- **段階的更新**: 一度にすべてを変更せず、確認しながら進める

## トラブルシューティング

### ドキュメントが見つからない場合

1. Globパターンで広範囲を検索
2. ファイル名の部分一致で候補を表示
3. ユーザーに手動確認を依頼

### 複数の候補がある場合

```markdown
以下の複数の候補が見つかりました：
1. docs/01_技術設計/patterns.md
2. docs/06_設計パターン/patterns.md

どちらを参照しますか？
```

## 拡張性

将来的に以下の機能を追加可能：

- Git履歴から自動的にファイル移動を検出
- ドキュメント内容の変更サマリーをskillに反映
- 定期的な整合性チェックのスケジューリング
