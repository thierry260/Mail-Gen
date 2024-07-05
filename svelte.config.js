import { sveltePreprocess } from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
  preprocess: sveltePreprocess({
    scss: {
      prependData: `@import 'src/styles/global.scss';` // Optional: Prepend global styles
    }
  })
};

export default config;
