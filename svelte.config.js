import preprocess from "svelte-preprocess";
import adapter from "@sveltejs/adapter-node"; // Change to Node adapter
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // options for Node adapter
      out: "build", // specify build output directory if needed
    }),
  },
  preprocess: preprocess({
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
