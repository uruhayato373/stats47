import React from "react";

import { NoteCover } from "../NoteCover";
import type { NoteImageProps } from "../note-common";

/** note カバー画像 (1280x670)。props は render-ranking-images.mjs が chart-data.json から作る */
export const NoteCoverPreview: React.FC<NoteImageProps> = (props) => <NoteCover {...props} />;
