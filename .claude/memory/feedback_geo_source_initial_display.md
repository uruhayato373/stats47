---
name: geo_source_initial_display
description: GISの表示確認は操作前・区画切替・ページ間移動を分けて検証する
type: feedback
---

**問題**: 単体GISの代表区画を50ページ確認済みと報告した後、L03-aの初期画面に地図がないと指摘された。

**原因**: `GeoSourceExplorer`は`opened=null`で開始し、地図ボタンを押すまで描画しなかった。L03-aの既定選択は先頭の海上区画3036。一方、監査は5339を検索してボタンを押してから検査しており、利用者が最初に見る状態を通っていなかった。

**対策**: 初期区画の選択は`apps/web/src/features/geo-analysis/lib/geo-source-initial-asset.ts`で一元化し、容量上限以内の1ファイルを自動表示する。区画変更UIは初期表示時に折りたたむ。GISを変える際はdataId/versionのkeyで選択・検索・地図の状態を初期化する。`apps/web/scripts/audit-geo-source-pages.ts`は自動表示対象を操作せずに検査し、L03-aでは手動区画変更と一覧リンクによるGIS往復も検査する。台帳の`map.initialDisplay`で自動表示と手動読込を区別する。

**証拠**: 2026-09-09にL03-aを直接開くと地図DOMなし、ボタン後は3036の200地物を描画。修正後は操作なしで5339の6,300地物を取得・描画した。検証の実行結果は`.claude/state/geo/source-pages.json`、手順は`.claude/todo/backlog.md`のGEO-SOURCE-PAGES-01を参照する。

**追加の原因と対策（非表示パネル）**: 地図の要素が`display:none`の状態で読み込まれると、Leafletは描画サイズを0として保持した。表示を戻してもcanvasは0×0のまま、区画全体へ戻す操作でも復旧しなかった。`GeoSourceMap`では`ResizeObserver`で地図要素の寸法を監視し、正のサイズになるまで初回の`fitBounds`を待つ。表示後は`invalidateSize`と表示対象の再取得を行い、observerはworkerとともに破棄する。監査ではL03-aを非表示で再マウントし、windowのresizeやズーム操作なしに表示を戻して、canvasの実描画と6,300地物の対象範囲を確認する。

**検証環境の区別**: Chrome DevTools/Playwrightの検証用ブラウザはCodex内部ブラウザとは別。合格しても利用者が開いているタブの復旧を確認したとは扱わない。内部ブラウザへのopen操作が`queued`の場合も、画面が切り替わった根拠にはしない。
