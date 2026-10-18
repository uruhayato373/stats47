/** SVG uploads are data-only; preview always rasterizes and download is an attachment. */
export function assertStaticSvg(bytes){
  const source=bytes.toString('utf8').replace(/<!--[\s\S]*?-->/g,'');
  const withoutFragments=source.replace(/url\(\s*(['"]?)#[\w-]+\1\s*\)/gi,'');
  if(!/<svg[\s>]/i.test(source)||/<!|<\s*(?:script|foreignObject|iframe|object|embed)\b|\b(?:[\w-]+:)?href\s*=|\son\w+\s*=|@import|\\/i.test(source)||/url\s*\(/i.test(withoutFragments))throw Error('SVGには外部参照・スクリプトを含められません。');
}
