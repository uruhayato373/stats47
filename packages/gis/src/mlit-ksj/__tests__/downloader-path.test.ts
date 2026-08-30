import { describe, expect, it } from 'vitest';

import { sanitizeArchiveBaseName } from '../downloader';

describe('sanitizeArchiveBaseName', () => {
  it('Shift-JIS由来の不正な日本語名を行政コードだけのASCII名にする', () => {
    expect(sanitizeArchiveBaseName('01662_���݌S���ݒ�.geojson', 1)).toBe('01662');
  });

  it('英数字の意味あるファイル名は維持する', () => {
    expect(
      sanitizeArchiveBaseName(
        'A42-18_Preservation_Area_of_Historic_Landscape.geojson',
        1
      )
    ).toBe('A42-18_Preservation_Area_of_Historic_Landscape');
  });
});
