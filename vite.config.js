import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      devOptions: {
        enabled: true, // Enables the service worker in dev mode
        type: "module",
      },
      registerType: "autoUpdate",
      manifest: {
        name: "MailGen",
        short_name: "MailGen",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#426006",
        theme_color: "#c9f66f",
        icons: [
          {
            purpose: "any",
            sizes: "144x144",
            src: "/img/icon144_rounded.png",
            type: "image/png",
          },
          {
            purpose: "any",
            sizes: "512x512",
            src: "/img/icon512_rounded.png",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/img/screenshot-mobile.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
          },
          {
            src: "/img/screenshot-wide.png",
            sizes: "2560x1440",
            type: "image/png",
            form_factor: "wide",
          },
        ],
      },
    }),
  ],
  define: {
    "process.env.STRIPE_SECRET_KEY": JSON.stringify(
      process.env.STRIPE_SECRET_KEY
    ),
    "process.env.NODE_ENV": '"production"',
  },
  // server: {
  //   https: {
  //     key: fs.readFileSync('./localhost-key.pem'),
  //     cert: fs.readFileSync('./localhost.pem'),
  //   }
  // },
  // proxy: {
  //   '/api': {
  //     target: 'https://localhost:26',
  //     changeOrigin: true,
  //     rewrite: (path) => path.replace(/^\/api/, ''),
  //   },
  // },
  build: {
    outDir: "build",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
