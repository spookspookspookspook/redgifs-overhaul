import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'Redgifs Overhaul',
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.redgifs.com/*'],
        description: 'Massively overhaul the redgifs.com experience',
        author: 'spookspookspookspook',
        version: pkg.version,
        license: 'MIT',
      },
      build: {
        externalGlobals: {},
      },
    }),
  ],
});
