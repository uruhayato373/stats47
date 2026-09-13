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

## 2026-09-13 世界範囲と背景を含む初期表示

**問題**: S10aの海外経路が初期表示と「区画全体に戻す」で収まらず、縮尺を直すだけでは背景が灰色になった。

**原因**: 有効な原典bboxは経度約354度に及ぶ。地図のminZoom=3では全域fitが不可能で、幅262pxではzoom0でも左右18pxの余白は取れない。さらに地理院paleはnative zoom0/1を提供せず、実GETは404だった。公式一覧の全球提供範囲はZL2–8。

**対策**: `fit-geo-source-bounds.ts`でzoom0まで許可した地図の実寸と投影範囲から余白を決め、初期・reset・非表示からの復旧で共有する。`GeoSourceMap`は`GEO_BASEMAP.minNativeZoom=2`の実画像を低縮尺へ縮小し、既存VMAP0出典を表示する。回帰テストは実Leafletで世界範囲のcontain・reset・県別の従来fit・単地点の上限を検査する。画面では地物だけでなく背景のHTTP・naturalWidth・スクショも確認し、fit helperとprovider設定も監査fingerprintへ含める。

**証拠**: 2026-09-13、原典11,581候補を320/1440pxで確認。native zoom2画像は全200/256px、地図zoom0/1で表示。初回100件95PASS・機能再確認8PASS・背景修正後2PASSを別履歴で保持し、一つの全件成功runとは呼ばない。正典は`.claude/state/metrics/releases/2026-09-13-all-sessions.json`。提供範囲は https://maps.gsi.go.jp/development/ichiran.html 。

## 2026-09-13 本番の全国GIS転送

**問題**: L01/L02の保存元JSONは完全だが、本番の公開URL転送APIはHTTP200の途中で終了し、初期地図が表示されなかった。L01はAPIが2,093,056 bytesでJSON解析に失敗し、保存元は展開後74,673,426 bytesで正常だった。

**原因の境界**: 公開URL転送経路の欠損は再現済み。切断を起こすランタイム内部の機序と、別画面の503・React418との関連は未確定。gzipの格納サイズ6,248,864 bytesと展開サイズを区別する。

**対策と検証**: 本番は既存R2 bindingのraw bodyをoctet-streamとして返し、gzipはブラウザworkerだけで展開する。Content-Encodingを付けず、古い不完全200の再利用をno-storeで止める。実routeをMiniflare/workerdとnative R2で実行し、入力・出力6,248,864 bytes/SHA一致、展開74,673,426 bytes/SHA/JSON一致を確認した。object.arrayBuffer/public fetchは0回。本番再確認はrelease正典へ別途記録する。監査では画面に解析エラーが出たら長い描画timeoutを待たず記録し、document/API/RSCの本文・headers・cf-ray・pageerror時刻/stackを初回から残す。
