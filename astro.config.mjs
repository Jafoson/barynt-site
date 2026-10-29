// @ts-check
// The start page is plain HTML (src/template.html → public/index.html by
// scripts/build.ts); the docs under /docs/ are Starlight, read from Barynt's
// docs/guide/ at the release tag.
import { unified } from "@astrojs/markdown-remark";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { githubAlerts, mdLinks, themedImages, version } from "./src/plugins/markdown.mjs";
import { sidebarFrom } from "./src/plugins/sidebar.mjs";
import { DOCS_DIR, VERSION } from "./src/site.mjs";

export default defineConfig({
  site: process.env.SITE_CNAME ? `https://${process.env.SITE_CNAME}` : undefined,
  // GitHub Pages leaves `_`-folders alone only with .nojekyll; a plain name is simpler.
  build: { assets: "astro" },
  redirects: { "/docs": "/docs/getting-started/intro/", "/de/docs": "/de/docs/getting-started/intro/" },
  markdown: { processor: unified({ remarkPlugins: [githubAlerts, themedImages(), mdLinks(DOCS_DIR), version(VERSION)] }) },
  integrations: [
    starlight({
      title: "Barynt Docs",
      defaultLocale: "root",
      locales: { root: { label: "English", lang: "en" }, de: { label: "Deutsch", lang: "de" } },
      editLink: { baseUrl: "https://github.com/Jafoson/Barynt/edit/main/docs/guide/" },
      sidebar: sidebarFrom(DOCS_DIR),
      components: {
        Header: "./src/components/Header.astro",
        PageTitle: "./src/components/PageTitle.astro",
        EditLink: "./src/components/EditLink.astro",
      },
      customCss: ["./src/styles/barynt.css"],
      head: [
        { tag: "link", attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" } },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
          },
        },
      ],
    }),
  ],
});
