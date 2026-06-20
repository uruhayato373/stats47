const path = require('path');
const { Config } = require('@remotion/cli/config');

const srcPath = path.resolve(process.cwd(), 'src');

Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@': srcPath,
      },
    },
  };
});

if (typeof Config.overrideViteConfig === 'function') {
  Config.overrideViteConfig((config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          '@': srcPath,
        },
      },
    };
  });
}
