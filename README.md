# barynt-site

Start page and documentation for [Barynt](https://github.com/Jafoson/Barynt),
the open-source issue tracker you host yourself. English and German.

The site is built for one Barynt release at a time. Everything that depends on
it comes from that release: the version in the header, footer and commands,
the "Latest release" widget and the release notes page (read from
`releases/<version>.md` and `.de.md` at the tag, the same files the app shows).

## How a release reaches the site

```
Barynt: Actions → Release (publish)
  → GitHub release vX.Y.Z, Docker image, Helm chart
  → repository_dispatch "barynt-release" { version: "X.Y.Z" } to this repo
barynt-site: "Build and deploy"
  → bun run build with BARYNT_VERSION=X.Y.Z → dist/
  → GitHub Pages
```

The dispatch is the last job of Barynt's `release.yml`. It needs the secret
`SITE_DISPATCH_TOKEN` in the Barynt repository: a fine-grained token for
`Jafoson/barynt-site` with **Contents: read and write** (that's what
`repository_dispatch` requires). Without the secret the release still runs and
only skips this step.

## Setup (once)

1. Settings → Pages → Source: **GitHub Actions**.
2. Optional: a custom domain as the repository variable `SITE_CNAME`
   (Settings → Secrets and variables → Actions → Variables), e.g. `barynt.dev`.
3. In the Barynt repository: the secret `SITE_DISPATCH_TOKEN` (see above).

## Local

```sh
bun install
bun run build                        # newest Barynt release
BARYNT_VERSION=1.0.12 bun run build  # a given one
```

`dist/index.html` is the whole site. Set `GITHUB_TOKEN` if you hit the API's
rate limit.

## Where things are

| Path                             | What                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/template.html`              | The page: start page, docs, widgets, German dictionary. `__VERSION__` and the release data block are filled in by the build |
| `scripts/build.ts`               | Picks the release, reads its notes, fills the template, writes `dist/`                          |
| `.github/workflows/deploy.yml`   | Build and deploy on dispatch, by hand or on push                                                |
| `public/media/`                  | Screenshots and videos of the app, copied into `dist/` as they are                              |
| `scripts/capture/`               | Records `public/media/` from a running Barynt                                                   |

### Translations

English is the source. German lives in the `DE` dictionary at the end of
`src/template.html`, keyed by the English text. A new or changed English sentence
needs its German entry too, otherwise it stays English on the German page.
Commands and code (`curl …`, `barynt …`) are never translated. Release notes
aren't in the dictionary: they come in both languages from Barynt.

### Screenshots and videos

Real recordings of Barynt, in English and German, under `public/media/<lang>/`
(`.webp` screenshots, `.mp4` loops with a `.webp` poster). The page picks the
folder for the language it shows. They're recorded with Playwright from a
running Barynt with seed data, see `scripts/capture/README.md`; record again
when the app's look changes.
