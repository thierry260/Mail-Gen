import sveltePreprocess from "svelte-preprocess";
import vercel from "@sveltejs/adapter-vercel"; // Make sure this is imported
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: vercel(),
  },
  preprocess: sveltePreprocess({
    scss: {
      includePaths: ["src/styles"],
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
