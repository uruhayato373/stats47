import React from "react";

import { NoteBarChart } from "../NoteBarChart";
import type { NoteImageProps } from "../note-common";

/** 全47県の順位バー (1200x630) */
export const NoteBarChartPreview: React.FC<NoteImageProps> = (props) => <NoteBarChart {...props} />;
