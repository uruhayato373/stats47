export type PublishedScopeManifest = {
  files?: Array<{ key?: unknown }>;
};

export type PublishedScopeInspection =
  | {
      action: 'skip';
      staleKeys: string[];
    }
  | {
      action: 'reacquire';
      deleteKeys: string[];
      reason: string;
    };

/**
 * manifest を commit marker として、scope が完全かを判定する。
 *
 * 完全な scope では manifest が宣言した TopoJSON だけを残す。manifest 欠損・不正・
 * 宣言ファイル欠損は scope 全体を再取得し、途中 PUT や旧形式 object を残さない。
 */
export function inspectPublishedScope(options: {
  prefix: string;
  manifestKey: string;
  manifest: PublishedScopeManifest | null;
  remoteKeys: ReadonlySet<string>;
}): PublishedScopeInspection {
  const { prefix, manifestKey, manifest, remoteKeys } = options;
  const scopePrefix = `${prefix}/`;
  const actualKeys = [...remoteKeys].filter((key) =>
    key.startsWith(scopePrefix)
  );
  const reacquire = (reason: string): PublishedScopeInspection => ({
    action: 'reacquire',
    deleteKeys: actualKeys,
    reason,
  });

  if (
    !manifest ||
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0
  ) {
    return reacquire('manifestが欠損またはfilesが空');
  }

  const declaredKeys: string[] = [];
  for (const file of manifest.files) {
    if (
      typeof file?.key !== 'string' ||
      !file.key.startsWith(scopePrefix) ||
      !file.key.endsWith('.topojson')
    ) {
      return reacquire('manifestの出力keyが不正');
    }
    declaredKeys.push(file.key);
  }
  if (new Set(declaredKeys).size !== declaredKeys.length) {
    return reacquire('manifestの出力keyが重複');
  }

  const expectedKeys = new Set([manifestKey, ...declaredKeys]);
  const missingKeys = [...expectedKeys].filter((key) => !remoteKeys.has(key));
  if (missingKeys.length > 0) {
    return reacquire(`manifest宣言objectが欠損: ${missingKeys.length}`);
  }

  return {
    action: 'skip',
    staleKeys: actualKeys.filter((key) => !expectedKeys.has(key)),
  };
}
