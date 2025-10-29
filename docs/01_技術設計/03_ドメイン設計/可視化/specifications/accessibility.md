---
title: アクセシビリティガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
---

# アクセシビリティガイド

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: 可視化コンポーネントのアクセシビリティ対応

---

## 概要

stats47プロジェクトの可視化コンポーネントは、WCAG 2.1 AA準拠のアクセシビリティを提供します。全てのユーザーが統計データを理解し、操作できるよう配慮します。

## 基本原則

### 1. 知覚可能（Perceivable）
- 色だけで情報を伝えない
- 代替テキストの提供
- 十分なコントラスト比の確保

### 2. 操作可能（Operable）
- キーボードナビゲーション対応
- 十分な操作時間の提供
- 発作を引き起こすコンテンツの回避

### 3. 理解可能（Understandable）
- 明確で一貫したナビゲーション
- エラーの特定と修正を支援
- 予測可能な動作

### 4. 堅牢（Robust）
- 支援技術との互換性
- 将来の技術との互換性

## 実装ガイドライン

### 1. セマンティックHTML

#### 適切なHTML要素の使用
```typescript
// 良い例
<svg role="img" aria-label="都道府県別人口ランキングチャート">
  <title>都道府県別人口ランキング</title>
  <desc>47都道府県の人口を棒グラフで表示</desc>
  {/* チャート内容 */}
</svg>

// 悪い例
<div>
  {/* チャート内容 */}
</div>
```

#### ARIA属性の活用
```typescript
// インタラクティブな要素
<rect
  role="button"
  tabindex="0"
  aria-label="北海道: 5,224,614人 (8位)"
  aria-describedby="tooltip-hokkaido"
/>

// データテーブル
<table role="table" aria-label="ランキングデータ">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col">順位</th>
      <th role="columnheader" scope="col">都道府県</th>
      <th role="columnheader" scope="col">人口</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="cell">1</td>
      <td role="cell">東京都</td>
      <td role="cell">14,047,594人</td>
    </tr>
  </tbody>
</table>
```

### 2. キーボードナビゲーション

#### 基本的なキーボード操作
```typescript
export function setupKeyboardNavigation(
  chartElement: HTMLElement,
  data: ChartData[]
) {
  let selectedIndex = 0;
  let isNavigating = false;

  chartElement.addEventListener('keydown', (event) => {
    if (isNavigating) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        selectedIndex = Math.min(selectedIndex + 1, data.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Home':
        selectedIndex = 0;
        break;
      case 'End':
        selectedIndex = data.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onDataPointClick?.(data[selectedIndex]);
        break;
      case 'Escape':
        onDataPointHover?.(null);
        break;
    }
    
    updateSelection(selectedIndex);
    announceSelection(data[selectedIndex]);
  });
}
```

#### フォーカス管理
```typescript
export function manageFocus(
  chartElement: HTMLElement,
  data: ChartData[]
) {
  // フォーカス可能な要素を設定
  const focusableElements = chartElement.querySelectorAll('[tabindex="0"]');
  
  // フォーカストラップ
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  chartElement.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab: 逆方向
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 順方向
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}
```

### 3. スクリーンリーダー対応

#### データの構造化
```typescript
export function setupScreenReaderSupport(
  chartElement: HTMLElement,
  data: ChartData[]
) {
  // チャート全体の説明
  chartElement.setAttribute('role', 'img');
  chartElement.setAttribute('aria-label', '統計データチャート');
  
  // データの要約
  const summary = generateDataSummary(data);
  chartElement.setAttribute('aria-describedby', 'chart-summary');
  
  // 各データポイントの説明
  data.forEach((item, index) => {
    const element = chartElement.querySelector(`[data-index="${index}"]`);
    if (element) {
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-label', formatDataPointLabel(item));
      element.setAttribute('aria-describedby', `tooltip-${index}`);
    }
  });
}

function generateDataSummary(data: ChartData[]): string {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  
  return `データ件数: ${data.length}件, 最大値: ${max}, 最小値: ${min}, 平均値: ${avg.toFixed(1)}`;
}

function formatDataPointLabel(item: ChartData): string {
  return `${item.name}: ${item.value.toLocaleString()}${item.unit || ''}${item.rank ? ` (${item.rank}位)` : ''}`;
}
```

#### ライブリージョン
```typescript
export function setupLiveRegion(
  chartElement: HTMLElement
) {
  // ライブリージョンの作成
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.id = 'chart-announcements';
  
  chartElement.appendChild(liveRegion);
  
  return {
    announce: (message: string) => {
      liveRegion.textContent = message;
    }
  };
}
```

### 4. 色とコントラスト

#### コントラスト比の確保
```typescript
// カラーパレットの定義（WCAG AA準拠）
export const AccessibleColorPalette = {
  // 十分なコントラスト比（4.5:1以上）
  primary: '#1f77b4',      // 濃い青
  secondary: '#ff7f0e',    // 濃いオレンジ
  success: '#2ca02c',      // 濃い緑
  warning: '#d62728',      // 濃い赤
  info: '#9467bd',         // 濃い紫
  
  // テキスト用
  text: '#333333',         // 濃いグレー
  textSecondary: '#666666', // 中程度のグレー
  background: '#ffffff',    // 白
  backgroundSecondary: '#f5f5f5' // 薄いグレー
} as const;

// コントラスト比の計算
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string) => {
    const rgb = hexToRgb(color);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}
```

#### 色以外の視覚的手がかり
```typescript
export function createAccessibleChart(
  data: ChartData[],
  config: ChartConfig
) {
  return {
    // パターンや形状の使用
    patterns: {
      solid: 'solid',
      stripes: 'url(#stripes)',
      dots: 'url(#dots)',
      diagonal: 'url(#diagonal)'
    },
    
    // アイコンの使用
    icons: {
      high: '↑',
      medium: '→',
      low: '↓',
      trend: '📈',
      decline: '📉'
    },
    
    // テキストラベルの追加
    labels: data.map(item => ({
      ...item,
      label: `${item.name}: ${item.value}`,
      pattern: getPatternForValue(item.value, data),
      icon: getIconForValue(item.value, data)
    }))
  };
}
```

### 5. アニメーションとモーション

#### モーションの制御
```typescript
export function setupMotionPreferences() {
  // prefers-reduced-motion の検出
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    shouldAnimate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 1000,
    easing: prefersReducedMotion ? 'linear' : 'ease-in-out'
  };
}

// アニメーションの条件付き適用
export function createAccessibleAnimation(
  element: d3.Selection<any, any, any, any>,
  data: ChartData[],
  motionPrefs: MotionPreferences
) {
  if (motionPrefs.shouldAnimate) {
    return element
      .transition()
      .duration(motionPrefs.duration)
      .ease(d3.ease(motionPrefs.easing));
  } else {
    return element;
  }
}
```

### 6. フォーカス表示

#### フォーカスインジケーター
```css
/* フォーカス表示のスタイル */
.chart-element:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 95, 204, 0.3);
}

.chart-element:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

.chart-element:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 95, 204, 0.3);
}

/* 高コントラストモード対応 */
@media (prefers-contrast: high) {
  .chart-element:focus {
    outline: 3px solid;
    outline-offset: 1px;
  }
}
```

## テスト戦略

### 1. 自動テスト

```typescript
// アクセシビリティテスト
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Chart Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<BarChart data={mockData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', () => {
    render(<BarChart data={mockData} />);
    
    const chart = screen.getByRole('img');
    chart.focus();
    
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(screen.getByLabelText(/Item 2/)).toHaveFocus();
  });

  it('should announce data changes', () => {
    const { rerender } = render(<BarChart data={mockData} />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('データ件数: 3件');
    
    rerender(<BarChart data={updatedData} />);
    expect(liveRegion).toHaveTextContent('データ件数: 5件');
  });
});
```

### 2. 手動テスト

#### キーボードテスト
1. Tabキーでフォーカス移動
2. 矢印キーでデータポイント間移動
3. Enter/Spaceキーで選択
4. Escapeキーで選択解除

#### スクリーンリーダーテスト
1. NVDA（Windows）
2. JAWS（Windows）
3. VoiceOver（macOS）
4. TalkBack（Android）

#### 色覚テスト
1. 色覚シミュレータでの確認
2. グレースケール表示での確認
3. 高コントラストモードでの確認

## 実装チェックリスト

### 基本要件
- [ ] セマンティックHTMLの使用
- [ ] ARIA属性の適切な設定
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応
- [ ] 十分なコントラスト比の確保

### 高度な要件
- [ ] ライブリージョンの実装
- [ ] フォーカス管理の実装
- [ ] モーション設定の尊重
- [ ] 高コントラストモード対応
- [ ] ズーム機能の対応

### テスト要件
- [ ] 自動テストの実装
- [ ] 手動テストの実施
- [ ] スクリーンリーダーテスト
- [ ] キーボードテスト
- [ ] 色覚テスト

## 関連ドキュメント

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**更新履歴**:
- 2025-10-16: 初版作成
