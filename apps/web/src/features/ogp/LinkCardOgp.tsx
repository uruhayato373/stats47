import { FONT, LINK_CARD_PALETTE as COLORS } from './brand';

/** External cards only. Keep every word inside the central square. */
export const LINK_CARD_IMAGE = { width:1200, height:630, safeLeft:285, safeWidth:630, textWidth:560, noteWidth:220, noteHeight:150, version:'note-family-20261026-v1' } as const;

export function resolveLinkCardTitleLayout(title:string) {
  const text=title.trim();
  if(!text)throw Error('OGPの主題が空です');
  const units=Array.from(text).reduce((sum,c)=>sum+(/^[\x20-\x7e]$/.test(c)?0.58:1),0);
  // 5 lines at 64px remain readable in the observed 220x150 note crop.
  const lines=Math.min(5,Math.max(1,Math.ceil(units/8)));
  const fontSize=Math.min(108,Math.floor(550/Math.ceil(units/lines)));
  if(fontSize<64)throw Error(`意味を保つ短い見出しを指定してください: ${text}`);
  return {text,fontSize,lines};
}

export interface LinkCardOgpProps {
  title:string;
  eyebrow?:string;
  detail?:string;
  subtitle?:string|null;
  backgroundImage?:string;
}

export function LinkCardOgp({title,eyebrow='都道府県のデータ',detail='stats47',subtitle,backgroundImage}:LinkCardOgpProps) {
  const layout=resolveLinkCardTitleLayout(title);
  const showSubtitle=Boolean(subtitle && subtitle.length<=90 && layout.lines<5);
  return <div style={{width:1200,height:630,display:'flex',position:'relative',overflow:'hidden',background:COLORS.background,fontFamily:FONT.sansJP}}>
    {backgroundImage?<img alt="" src={backgroundImage} width={1200} height={630} style={{position:'absolute',inset:0,objectFit:'cover'}}/>:null}
    <div style={{position:'absolute',left:292,top:96,width:616,height:450,background:COLORS.accent,borderRadius:30,transform:'rotate(2deg)'}}/>
    <div style={{position:'absolute',left:294,top:84,width:612,height:450,background:COLORS.paper,border:'5px solid '+COLORS.ink,borderRadius:28}}/>
    <div style={{position:'absolute',left:320,top:38,width:560,height:60,display:'flex',alignItems:'center',justifyContent:'center',background:COLORS.ribbon,border:'3px solid '+COLORS.ink,borderRadius:16,color:COLORS.white,fontSize:30,fontWeight:900}}>{eyebrow}</div>
    <div style={{position:'absolute',left:320,top:112,width:560,height:showSubtitle?330:370,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontSize:layout.fontSize,lineHeight:1.04,fontWeight:900,color:COLORS.ink,wordBreak:'break-all'}}>{layout.text}</div>
    {showSubtitle && subtitle?<div style={{position:'absolute',left:326,top:450,width:548,height:70,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontSize:subtitle.length>65?20:24,lineHeight:1.2,fontWeight:700,color:COLORS.ink,wordBreak:'break-all'}}>{subtitle}</div>:null}
    <div style={{position:'absolute',left:320,top:558,width:560,display:'flex',justifyContent:'center',color:COLORS.ink,fontSize:34,fontWeight:900}}>{detail}</div>
  </div>;
}
