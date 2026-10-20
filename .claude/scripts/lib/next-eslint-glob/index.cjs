const path = require('node:path');
const { globSync: findDirectories } = require('tinyglobby');

// Next ESLint uses only this directory query. Fail on a changed upstream API.
exports.globSync = (pattern, options) => {
  if (typeof pattern !== 'string' || options?.onlyDirectories !== true ||
      Object.keys(options).some(key => key !== 'onlyDirectories')) {
    throw new Error('Unsupported Next ESLint glob query; review the scoped compatibility override.');
  }
  return findDirectories(pattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: path.isAbsolute(pattern),
  }).map(directory => directory === path.parse(directory).root ? directory : directory.replace(/\/$/, ''));
};
