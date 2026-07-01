import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      cookieName: "PARAGLIDE_LANG",
      strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],

      urlPatterns: [
        {
          pattern: "/:path(.*)?",

          localized: [
            ["en", "/en/:path(.*)?"],
            ["ar", "/ar/:path(.*)?"],
          ],
        },
      ],
    }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    viteReact(),
  ],
});
