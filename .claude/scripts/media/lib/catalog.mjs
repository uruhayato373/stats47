import { CATALOGS } from '../../lib/svg-classify.mjs';
import { filenameTemplate } from './classification.mjs';
import { VISUAL_TEMPLATES, canonicalTemplate } from './taxonomy.mjs';

export const IMAGE_USES = { body:'本文図版', cover:'noteカバー', ogp:'OGP', card:'リンクカード', background:'背景素材', social:'SNS投稿', material:'共通素材' };
export const SVG_TEMPLATE = Object.fromEntries(CATALOGS.map(c=>[c.key,c.key==='unknown'?'unclassified':canonicalTemplate('svg-'+c.key)]));

/** Classify the recorded output, not the caption's rhetorical template or its dimensions. */
export function snsImageTemplate(post, asset) {
  const source = (asset.source ?? '').replaceAll('\\', '/').toLowerCase();
  const name = source.split('/').at(-1) ?? '';
  // Carousel cover / CTA / source slides are not automatically examples of their data chart.
  const named = filenameTemplate(name);
  if (named !== 'unclassified') return named;
  const template = post.template?.toLowerCase();
  if (template === 'ranking') return 'ranking';
  if (['buzz-map', 'buzzmap-a', 'buzzmap-c'].includes(template)) return 'map';
  if (template === 'household-receipt') return 'household';
  if (['rank-routes', 'tile-change'].includes(template)) return 'time-series';
  return 'unclassified';
}
export const catalogTemplates = () => [
  ...VISUAL_TEMPLATES,
  {id:'boxplot',label:'箱ひげ図・分布',policy:'四分位・中央値・外れ値の定義と固定入力を照合する。スマホで軸と凡例が読めるようにする。',renderer:null},
  {id:'waterfall',label:'ウォーターフォール',policy:'増減の符号・基準値・累積値を照合する。項目名と増減をスマホ幅で追えるようにする。',renderer:null},
  {id:'radar',label:'レーダーチャート',policy:'各軸の尺度・方向・正規化を照合する。比較対象と軸名を明瞭に示す。',renderer:null},
  {id:'pie',label:'円・ドーナツグラフ',policy:'母数・構成比の合計・分類の重複を照合する。小さな区分には本文や数表を併用する。',renderer:null},
  {id:'heatmap',label:'ヒートマップ',policy:'行列の意味・色の尺度・欠損の表現を照合する。凡例とラベルをスマホ幅で確認する。',renderer:null},
  {id:'sankey',label:'サンキー・流れの量',policy:'流入・流出・枝の合計を照合する。量と方向を誤読しないラベルにする。',renderer:null},
  {id:'note-cover',label:'noteカバー',policy:'カテゴリ別の既存カバー方針・制作IDを使う。カバー制作画面で生成・採用・公開を管理する。',renderer:null},
  {id:'title-card',label:'表紙・タイトルカード',policy:'主題とタイトルを大きく示す。統計グラフの見本と混在させず、媒体別の切り抜きを確認する。',renderer:null},
  {id:'source-card',label:'出典・注記カード',policy:'出典・年・対象範囲を簡潔に示し、読める文字サイズと参照先を確認する。',renderer:null},
  {id:'cta-card',label:'案内・CTAカード',policy:'次の行動とリンク先の一致を確認する。文字を絞り、スマホ幅で読めるサイズにする。',renderer:null},
  {id:'summary-card',label:'まとめカード',policy:'根拠のある要点を短く示す。図や数値との一致とスマホでの可読性を確認する。',renderer:null},
  {id:'caution-card',label:'注意事項カード',policy:'注意・制約を短く明示し、誤解を避けるために必要な条件を残す。',renderer:null},
  {id:'diagram',label:'説明図・関係図',policy:'関係や手順の向き・ラベル・根拠を確認し、スマホ幅で追える量にする。',renderer:null},
  {id:'photo',label:'写真',policy:'被写体・権利・使用目的を確認し、媒体の比率に応じて構図を調整する。',renderer:null},
  {id:'logo-icon',label:'ロゴ・アイコン',policy:'正規の素材と使用条件を確認する。縮小時の判別性と背景とのコントラストを確認する。',renderer:null},
  {id:'ogp',label:'OGP・タイトル画像',policy:'共有時にタイトルと主題が読める構図にする。生成manifestと背景の根拠を保持する。',renderer:'apps/web/scripts/data/image-generator-registry.ts'},
  {id:'link-card',label:'リンクカード',policy:'使用箇所の比率に合わせ、light/darkの両方でタイトルと主題を確認する。',renderer:'apps/web/scripts/lib/blog-thumbnail-render.ts'},
  {id:'pref-silhouette',label:'正確な県の輪郭',policy:'県コードと地理データを照合し、媒体別の比率を維持する。',renderer:'apps/web/scripts/lib/pref-silhouette-render.ts'},
  {id:'background',label:'背景・写真・イラスト素材',policy:'使用先の文字や図を妨げない構図にする。生成根拠・権利・採用履歴を保存する。',renderer:null},
].map(t=>({...t,version:1,profiles:{note:'本文幅320pxで確認する。',x:'投稿時のトリミングと可読性を確認する。',instagram:'スライドの比率と可読性を確認する。',web:'使用ページの幅とlight/dark表示を確認する。'}}));
