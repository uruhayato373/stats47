import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { HouseholdNote } from './HouseholdNote';
import { HOUSEHOLD_CANVAS } from './model';

const Root = () => <><Composition id="NoteHousehold" component={HouseholdNote} {...HOUSEHOLD_CANVAS} fps={1} durationInFrames={1} defaultProps={{ slide: 'x' as const }} /><Composition id="NoteHousehold-Note" component={HouseholdNote} {...HOUSEHOLD_CANVAS} fps={1} durationInFrames={1} defaultProps={{ slide: 'note' as const }} /></>;
registerRoot(Root);
