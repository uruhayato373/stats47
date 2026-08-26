declare function imageSizeDisabled(input?: unknown): never;

declare namespace imageSizeDisabled {
  const imageSize: typeof imageSizeDisabled;
  const disableFS: () => void;
  const disableTypes: (...types: string[]) => void;
  const setConcurrency: (concurrency: number) => void;
  const types: readonly string[];
}

export = imageSizeDisabled;
