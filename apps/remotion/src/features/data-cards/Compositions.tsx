import React from 'react';
import { Composition, Folder } from 'remotion';
import { DataCard } from './DataCard';
import { CARD_COMPOSITIONS, dataCardPropsSchema } from './model';

export function DataCardCompositions() {
  return (
    <Folder name="DataCards">
      {Object.values(CARD_COMPOSITIONS).map((id) => (
        <Composition
          key={id}
          id={id}
          component={DataCard}
          schema={dataCardPropsSchema}
          width={1080}
          height={1350}
          fps={1}
          durationInFrames={1}
          defaultProps={{ slide: 'detail' as const }}
        />
      ))}
    </Folder>
  );
}
