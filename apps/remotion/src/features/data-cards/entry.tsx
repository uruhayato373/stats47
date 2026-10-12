import { registerRoot } from 'remotion';
import { DataCardCompositions } from './Compositions';

// CLI and Studio share the same compositions; this entry avoids bundling unrelated videos.
registerRoot(DataCardCompositions);
