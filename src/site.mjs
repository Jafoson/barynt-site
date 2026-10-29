// Where the docs come from and which release the site is built for. Both are
// prepared by scripts/build.ts (.barynt/), or set by hand for a local preview:
//   BARYNT_DOCS_DIR=../Barynt/docs/guide bun run dev
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DOCS_DIR = resolve(process.env.BARYNT_DOCS_DIR || ".barynt/docs/guide");
const release = existsSync(".barynt/release.json") ? JSON.parse(readFileSync(".barynt/release.json", "utf8")) : {};
export const VERSION = process.env.BARYNT_VERSION || release.version || "0.0.0";
