// The sidebar, read from Barynt's docs folder: one group per folder, in the
// order and with the names of _groups.json; pages ordered by `sidebar.order`.
// (Starlight's `autogenerate` only looks inside src/content/docs/.)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function sidebarFrom(dir) {
  const file = join(dir, "_groups.json");
  if (!existsSync(file)) throw new Error(`No docs at ${dir} — run scripts/build.ts or set BARYNT_DOCS_DIR.`);
  const groups = JSON.parse(readFileSync(file, "utf8"));
  return Object.entries(groups).map(([folder, label]) => {
    const path = join(dir, "en", folder);
    const pages = existsSync(path) ? readdirSync(path).filter((f) => /^[^_].*\.mdx?$/.test(f)) : [];
    const items = pages
      .map((f) => ({
        order: Number(readFileSync(join(path, f), "utf8").match(/^\s+order:\s*(\d+)/m)?.[1] ?? 999),
        slug: `docs/${folder}/${f.replace(/\.mdx?$/, "")}`,
      }))
      .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
      .map(({ slug }) => ({ slug }));
    return { label: label.en, translations: { de: label.de }, items };
  });
}
