// Prepares the site for one Barynt release; `astro build` then builds it.
//
//   BARYNT_VERSION=1.0.13 bun run build    # a given release
//   bun run build                          # the newest published release
//
// Everything version-bound comes from that release:
// - the start page (src/template.html → public/index.html): the version in
//   the header, footer and commands, the "Latest release" widget and the
//   release notes page, read from releases/<version>.md (+ .de.md) at the tag
//   v<version> of the Barynt repository — the same files the app shows. Their
//   images are copied next to it (public/releases/assets/…), and a release
//   that ships the installer (install.sh as a release asset) gets its links.
// - the docs: Barynt's docs/guide/ at that tag → .barynt/docs/guide/, which
//   Starlight reads. A tag from before the docs moved there falls back to
//   DOCS_REF (default main). BARYNT_DOCS_DIR skips the download and uses a
//   local folder instead.

import { existsSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { marked } from "marked";

const REPO = process.env.BARYNT_REPO || "Jafoson/Barynt";
const NOTES_SHOWN = 5;
const SEMVER = /^\d+\.\d+\.\d+$/;

const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "barynt-site" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

interface GhRelease { tag_name: string; draft: boolean; prerelease: boolean; published_at: string; html_url: string; assets: { name: string; browser_download_url: string }[] }
interface Installer { script: string; sums?: string; signature?: string }
interface Note { version: string; date: string; url: string; en: string; de: string; summaryEn: string; summaryDe: string; installer?: Installer }

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function rawRes(tag: string, path: string): Promise<Response | null> {
  const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${tag}/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`raw ${tag}/${path}: ${res.status}`);
  return res;
}
const raw = async (tag: string, path: string) => (await rawRes(tag, path))?.text() ?? null;

/** The installer's download links, when the release ships one. */
function installerOf(r: GhRelease): Installer | undefined {
  const url = (name: string) => r.assets.find((a) => a.name === name)?.browser_download_url;
  const script = url("install.sh");
  return script ? { script, sums: url("SHA256SUMS"), signature: url("install.sh.sigstore.json") } : undefined;
}

const cmp = (a: string, b: string) => {
  const [x, y] = [a.split(".").map(Number), b.split(".").map(Number)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/** The hand-written part of a notes file, like the app shows it: without the
 *  heading, HTML comments and the generated changes block. Images under
 *  releases/assets/ are served by the site itself (collected into `images`),
 *  other relative links point at the tag's files. */
function prepare(md: string, version: string, images: Set<string>): { html: string; summary: string } {
  const body = md
    .replace(/<!--\s*changes:start\s*-->[\s\S]*?<!--\s*changes:end\s*-->/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#\s.*\n/m, "")
    .replace(/\]\((?!https?:|#|\/)(?:\.\/)?(assets\/[^)\s]+)/g, (_, path: string) => {
      if (path.includes("..")) return `](https://raw.githubusercontent.com/${REPO}/v${version}/releases/${path}`;
      images.add(path);
      return `](releases/${path}`;
    })
    .replace(/\]\((?!https?:|#|\/|releases\/assets\/)(\.\/)?/g, `](https://raw.githubusercontent.com/${REPO}/v${version}/releases/`)
    .trim();
  const summary = (body.match(/^\*\*(.+?)\*\*/m)?.[1] ?? "").replace(/\.$/, "");
  return { html: marked.parse(body, { async: false }) as string, summary };
}

async function main() {
  const releases = (await gh<GhRelease[]>(`/repos/${REPO}/releases?per_page=30`))
    .filter((r) => !r.draft && !r.prerelease && SEMVER.test(r.tag_name.replace(/^v/, "")));
  if (!releases.length) throw new Error(`No published releases in ${REPO}.`);

  const wanted = (process.env.BARYNT_VERSION || "").trim().replace(/^v/, "");
  const version = wanted || releases.map((r) => r.tag_name.replace(/^v/, "")).sort(cmp).at(-1)!;
  if (!SEMVER.test(version)) throw new Error(`Not a version: ${version}`);
  if (!releases.some((r) => r.tag_name === `v${version}`)) throw new Error(`v${version} isn't a published release of ${REPO}.`);

  // The release itself and the ones before it, newest first.
  const shown = releases
    .filter((r) => cmp(r.tag_name.slice(1), version) <= 0)
    .sort((a, b) => cmp(b.tag_name.slice(1), a.tag_name.slice(1)))
    .slice(0, NOTES_SHOWN);

  const notes: Note[] = [];
  const images: { tag: string; path: string }[] = [];
  for (const r of shown) {
    const v = r.tag_name.slice(1);
    const [en, de] = await Promise.all([raw(r.tag_name, `releases/${v}.md`), raw(r.tag_name, `releases/${v}.de.md`)]);
    if (!en) { console.warn(`! ${r.tag_name} has no releases/${v}.md — skipped`); continue; }
    const own = new Set<string>();
    const pe = prepare(en, v, own), pd = de ? prepare(de, v, own) : { html: "", summary: "" };
    for (const path of own) images.push({ tag: r.tag_name, path });
    notes.push({ version: v, date: r.published_at, url: r.html_url, en: pe.html, de: pd.html, summaryEn: pe.summary, summaryDe: pd.summary, installer: installerOf(r) });
  }

  const latest = notes.find((n) => n.version === version);
  const titleEn = latest?.summaryEn ? `${version}: ${latest.summaryEn}` : `Barynt ${version}`;
  const titleDe = latest?.summaryDe ? `${version}: ${latest.summaryDe}` : `Barynt ${version}`;
  const data = { version, title: { en: titleEn, de: titleDe }, dict: { [titleEn]: titleDe }, notes };

  // `<` escaped so nothing in the notes can close the surrounding <script>.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  let page = await readFile(new URL("../src/template.html", import.meta.url), "utf8");
  page = page
    .replace(/\/\*__RELEASE_DATA__\*\/[\s\S]*?\/\*__END__\*\//, () => json)
    .replaceAll("__RELEASE_TITLE__", escapeHtml(titleEn))
    .replaceAll("__VERSION__", version);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="barynt-version" content="${version}">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${page}
</body>
</html>
`;
  // Generated next to the committed media; Astro copies public/ into dist/.
  await writeFile("public/index.html", html);
  await writeFile("public/release.json", JSON.stringify({ version, title: data.title, notes: notes.map((n) => ({ version: n.version, date: n.date, url: n.url })) }, null, 2));
  await mkdir(".barynt", { recursive: true });
  await writeFile(".barynt/release.json", JSON.stringify({ version }));
  await rm("public/releases", { recursive: true, force: true });
  // The notes' images, from the tag that ships them.
  for (const { tag, path } of images) {
    const res = await rawRes(tag, `releases/${path}`);
    if (!res) { console.warn(`! ${tag} has no releases/${path}`); continue; }
    const out = `public/releases/${path}`;
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, new Uint8Array(await res.arrayBuffer()));
  }
  if (process.env.SITE_CNAME) await writeFile("public/CNAME", `${process.env.SITE_CNAME}\n`);

  let docs = "";
  if (process.env.BARYNT_DOCS_DIR) {
    await rm(".barynt/docs", { recursive: true, force: true });
    await cp(process.env.BARYNT_DOCS_DIR, ".barynt/docs/guide", { recursive: true });
    docs = `local ${process.env.BARYNT_DOCS_DIR}`;
  } else {
    const fallback = process.env.DOCS_REF || "main";
    if (await fetchDocs(`v${version}`)) docs = `v${version}`;
    else if (await fetchDocs(fallback)) docs = fallback;
    else throw new Error(`Neither v${version} nor ${fallback} has docs/guide/ in ${REPO}.`);
  }
  await fillMissingImages(".barynt/docs/guide");
  console.log(`Prepared Barynt ${version}: ${notes.length} release notes, ${images.length} images, docs from ${docs}.`);
}

/** docs/guide/ of the Barynt repository at `ref` → .barynt/docs/guide/. */
async function fetchDocs(ref: string): Promise<boolean> {
  const res = await fetch(`https://codeload.github.com/${REPO}/tar.gz/${ref}`, { headers });
  if (!res.ok) throw new Error(`Barynt at ${ref}: ${res.status}`);
  await rm(".barynt/docs", { recursive: true, force: true });
  await mkdir(".barynt", { recursive: true });
  await writeFile(".barynt/source.tar.gz", new Uint8Array(await res.arrayBuffer()));
  const tar = Bun.spawnSync(["tar", "-xzf", ".barynt/source.tar.gz", "-C", ".barynt", "--strip-components=1", "--wildcards", "*/docs/guide/*"]);
  await rm(".barynt/source.tar.gz");
  return tar.exitCode === 0 && existsSync(".barynt/docs/guide/_groups.json");
}

/** A picture missing from one language's folder (assets/en, assets/de) is
 *  copied over from the other one, so a forgotten translation never breaks a
 *  page. */
async function fillMissingImages(root: string) {
  const pages = (await readdir(root, { recursive: true })).filter((f) => /^(en|de)\//.test(f) && f.endsWith(".md"));
  for (const page of pages) {
    const text = await readFile(join(root, page), "utf8");
    for (const [, url] of text.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|\/)/.test(url) || !/assets\/(en|de)\//.test(url)) continue;
      const target = join(root, dirname(page), url);
      if (existsSync(target)) continue;
      const other = target.replace(/assets\/(en|de)\//, (_, l) => `assets/${l === "en" ? "de" : "en"}/`);
      if (!existsSync(other)) continue;
      await mkdir(dirname(target), { recursive: true });
      await cp(other, target);
      console.warn(`! ${page}: ${url} missing, using the other language's picture`);
    }
  }
}

const escapeHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

await main();
