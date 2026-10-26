import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { LinkCardOgp, type LinkCardOgpProps } from '../../src/features/ogp/LinkCardOgp';
import { LINK_CARD_HEADLINES } from '../data/link-card-copy';

let background:string|undefined;
/** Dedicated external asset: never replace the background used by internal thumbnails. */
export function buildExternalCard(data:LinkCardOgpProps) {
  background??=`data:image/jpeg;base64,${readFileSync(join(import.meta.dirname??__dirname,'../../../../assets/ogp/link-card-pop-20261026.jpg')).toString('base64')}`;
  return createElement(LinkCardOgp,{...data,title:LINK_CARD_HEADLINES[data.title]??data.title,backgroundImage:background});
}
