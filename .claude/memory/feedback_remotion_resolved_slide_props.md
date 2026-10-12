---
name: feedback_remotion_resolved_slide_props
description: Remotion renderStillでinputPropsだけを変えてもカルーセルが全て同じ画像になる。各slideでselectCompositionを解決する。
type: feedback
---

**問題**: SNSカルーセルの表紙・本体・出典の3枚がすべて本体と同じ画像になった。

**原因**: Remotion 4.0.517の`renderStill`は`composition.props`を解決済みpropsとして描画する。一度だけ`selectComposition`を呼び、後から`inputProps.slide`だけ変えても、解決済みpropsは変わらない。

**対策**: スライドごとのinputPropsで`selectComposition`を呼んでから`renderStill`へ渡す。`render-data-card.ts`は3枚のSHAが異なることも保存前に検査する。画像が存在するだけで成功としない。

**証拠**: 2026-10-11、`node_modules/@remotion/renderer/dist/render-still.js`の`serializedResolvedPropsWithCustomSchema`と、`.claude/scripts/sns/render-data-card.ts`のスライドごとの解決・SHA検査。X/IG共通の描画元は`apps/remotion/src/features/data-cards/`。
