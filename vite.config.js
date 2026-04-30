import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

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
        version: '1.0.0',
        license: 'MIT',
      },
      build: {
        externalGlobals: {},
      },
    }),
  ],
});
