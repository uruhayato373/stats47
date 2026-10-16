import { CATALOGS } from '../../lib/svg-classify.mjs';

export const IMAGE_USES = { body:'本文図版', cover:'noteカバー', ogp:'OGP', card:'リンクカード', background:'背景素材', social:'SNS投稿', material:'共通素材' };
export const SVG_TEMPLATE = Object.fromEntries(CATALOGS.map(c=>[c.key,c.key==='unknown'?'unclassified':'svg-'+c.key]));
export const catalogTemplates = () => [
  ...CATALOGS.filter(c=>c.key!=='unknown').map(c=>({id:SVG_TEMPLATE[c.key],label:c.label,policy:'既存SVGカタログの '+c.desc+' を使用する。固定入力・単位・年を維持し、原寸と320pxで文字と凡例を確認する。',renderer:'packages/svg-builder/src/'})),
  {id:'ogp',label:'OGP・タイトル画像',policy:'共有時にタイトルと主題が読める構図にする。生成manifestと背景の根拠を保持する。',renderer:'apps/web/scripts/data/image-generator-registry.ts'},
  {id:'link-card',label:'リンクカード',policy:'使用箇所の比率に合わせ、light/darkの両方でタイトルと主題を確認する。',renderer:'apps/web/scripts/lib/blog-thumbnail-render.ts'},
  {id:'pref-silhouette',label:'正確な県の輪郭',policy:'県コードと地理データを照合し、媒体別の比率を維持する。',renderer:'apps/web/scripts/lib/pref-silhouette-render.ts'},
  {id:'background',label:'背景・写真・イラスト素材',policy:'使用先の文字や図を妨げない構図にする。生成根拠・権利・採用履歴を保存する。',renderer:null},
].map(t=>({...t,version:1,profiles:{note:'本文幅320pxで確認する。',x:'投稿時のトリミングと可読性を確認する。',instagram:'スライドの比率と可読性を確認する。',web:'使用ページの幅とlight/dark表示を確認する。'}}));
