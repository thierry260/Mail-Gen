import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // default options are shown
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false
    }),
  },
  preprocess: preprocess({
    scss: {
      includePaths: ['src/styles'],
      prependData: `@import 'global.scss';`, // Ensure this is correct
    },
  }),
  onwarn: (warning, handler) => {
    if (warning.code === "css-unused-selector") {
      return;
    }
    handler(warning);
  },
};

export default config;