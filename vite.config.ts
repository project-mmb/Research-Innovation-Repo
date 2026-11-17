import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pagesBasePath = "/markham-home-dynamics";
const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const base = isGitHubPagesBuild ? `${pagesBasePath}/` : "/";
const routerBasePath = base.replace(/\/$/, "") || "/";

export default defineConfig({
  base,
  plugins: [
    tanstackStart({
      router: { basepath: routerBasePath },
      pages: ["/", "/listings", "/insights", "/settings"].map((path) => ({ path })),
      prerender: { enabled: true },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
});
