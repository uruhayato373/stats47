const path = require('path');
const { Config } = require('@remotion/cli/config');

console.log('--- Remotion Config Loading ---');
const srcPath = path.resolve(process.cwd(), 'src');
console.log('Resolved Source Path (using process.cwd()):', srcPath);

Config.overrideWebpackConfig((config) => {
  console.log('--- Overriding Webpack Config ---');
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
    console.log('--- Overriding Vite Config ---');
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
} else {
  console.log('Config.overrideViteConfig is not available in this version.');
}
