import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mapRows, parseCompositions, videoRows } from '@/lib/server/media-unification';

const ROOT = path.resolve(__dirname, '../../../..');

describe('地図と動画の共通化の状況', () => {
  it('Root の構成を読み、1 コマの静止画と動画を見分けられる値を返す', () => {
    const source = `<Composition\n  id="A-Reel"\n  component={Reel as never}\n  durationInFrames={300}\n/>\n<Composition\n  id="B-Still"\n  component={Still}\n  durationInFrames={1}\n/>\n`;
    expect(parseCompositions(source)).toEqual([
      { id: 'A-Reel', component: 'Reel', frames: '300' },
      { id: 'B-Still', component: 'Still', frames: '1' },
    ]);
  });
  it('地図の処理は全て土台を通っている', () => {
    const rows = mapRows(ROOT);
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.filter((row) => !row.geometry).map((row) => row.file)).toEqual([]);
  });
  it('動画の一覧は実際の構成を読み、バズ地図が地図の土台へ届く', () => {
    const buzz = videoRows(ROOT).find((row) => row.id === 'BuzzMap-Reel-916');
    expect(buzz).toMatchObject({ map: 'base', rendered: true });
    expect(mapRows(ROOT).map((row) => row.file)).not.toContain('apps/admin/lib/server/media-unification.ts');
    expect(videoRows(ROOT).find((row) => row.id === 'RankingInstagram-Reel')?.feature).not.toContain('index');
  });
});
