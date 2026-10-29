// Remark plugins for Barynt's docs: plain Markdown that reads the same on
// GitHub, rendered the Starlight way.
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const walk = (node, fn) => {
  node.children?.forEach((child, i) => fn(child, i, node) !== false && walk(child, fn));
};
/** The page's path inside the docs folder, e.g. `de/getting-started/intro.md`. */
const pageIn = (docs, file) => relative(docs, file.path || file.history?.[0] || "");

/** `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` → Starlight asides. */
export function githubAlerts() {
  const KIND = { NOTE: "note", TIP: "tip", IMPORTANT: "note", WARNING: "caution", CAUTION: "danger" };
  return (tree) =>
    walk(tree, (node, i, parent) => {
      if (node.type !== "blockquote") return;
      const first = node.children[0]?.children?.[0];
      const m = first?.type === "text" && first.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/);
      if (!m) return;
      first.value = first.value.slice(m[0].length);
      const kind = KIND[m[1]];
      parent.children[i] = {
        type: "aside",
        data: { hName: "aside", hProperties: { className: ["starlight-aside", `starlight-aside--${kind}`], ariaLabel: m[1][0] + m[1].slice(1).toLowerCase() } },
        children: [{ type: "div", data: { hName: "div", hProperties: { className: ["starlight-aside__content"] } }, children: node.children }],
      };
      return false;
    });
}

/** `[Install](install.md#unattended)` → `/docs/getting-started/install/#unattended`
 *  (`/de/docs/…` from a German page), so the same link works on GitHub. */
export function mdLinks(docs) {
  return () => (tree, file) => {
    const page = pageIn(docs, file);
    walk(tree, (node) => {
      if (node.type !== "link" || /^(https?:|mailto:|#|\/)/.test(node.url)) return;
      const [path, hash] = node.url.split("#");
      if (!path.endsWith(".md") && !path.endsWith(".mdx")) return;
      const target = relative(docs, resolve(docs, dirname(page), path)).replace(/\.mdx?$/, "");
      const url = target.startsWith("de/") ? `/de/docs/${target.slice(3)}/` : `/docs/${target.slice(3)}/`;
      node.url = url + (hash ? `#${hash}` : "");
    });
  };
}

/** `{{version}}` in text and code → the release the site is built for. */
export function version(v) {
  return () => (tree) => {
    const each = (node) => {
      if (typeof node.value === "string") node.value = node.value.replaceAll("{{version}}", v);
      node.children?.forEach(each);
    };
    each(tree);
  };
}
