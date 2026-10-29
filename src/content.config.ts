import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { DOCS_DIR } from "./site.mjs";

// Barynt's docs/guide/: `x/y.md` is served at /docs/x/y/, `de/x/y.md` at
// /de/docs/x/y/. README.md (the authors' guide) and `_`-files aren't pages.
export const collections = {
  docs: defineCollection({
    loader: glob({
      base: DOCS_DIR,
      pattern: ["**/[^_]*.{md,mdx}", "!README.md"],
      generateId: ({ entry }) => {
        const path = entry.replace(/\.mdx?$/, "").toLowerCase();
        return path.startsWith("de/") ? `de/docs/${path.slice(3)}` : `docs/${path}`;
      },
    }),
    schema: docsSchema(),
  }),
};
