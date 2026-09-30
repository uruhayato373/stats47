import React from "react";

import { NoteMap } from "../NoteMap";
import type { NoteImageProps } from "../note-common";

/** 記事内コロプレス地図 (1080x1080) */
export const NoteMapPreview: React.FC<NoteImageProps> = (props) => <NoteMap {...props} />;
