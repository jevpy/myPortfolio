import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import vercel from "@astrojs/vercel/serverless";

import react from "@astrojs/react";
import { readFileSync } from "node:fs";

// The 3D scene preloads three.js from the <head> (PortfolioLayout), so its
// chunk needs a stable name; the version keeps immutable caches correct.
const threeVersion = JSON.parse(
  readFileSync(new URL("./node_modules/three/package.json", import.meta.url), "utf8"),
).version;
const threeChunk = `_astro/three-${threeVersion}.js`;

// https://astro.build/config
export default defineConfig({
  integrations: [
    {
      // Client build only: the server bundle must keep Astro's own chunk layout,
      // or the Vercel function cannot find its modules at runtime.
      name: "stable-three-chunk",
      hooks: {
        "astro:build:setup": ({ vite, target }) => {
          if (target !== "client") return;
          vite.build ??= {};
          vite.build.rollupOptions ??= {};
          const output = vite.build.rollupOptions.output ?? {};
          vite.build.rollupOptions.output = {
            ...(Array.isArray(output) ? output[0] : output),
            chunkFileNames: (chunk) =>
              chunk.name === "three.module" ? threeChunk : "_astro/[name].[hash].js",
          };
        },
      },
    },
    tailwind(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: "server",
  adapter: vercel(),
  vite: {
    define: { __THREE_CHUNK__: JSON.stringify(`/${threeChunk}`) },
  },
});