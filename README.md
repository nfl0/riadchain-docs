# Riadchain documentation

The source for [docs.riadchain.com](https://docs.riadchain.com), built with
[Astro Starlight](https://starlight.astro.build/). Riadchain is a private,
permissioned blockchain for homes and companies. The guides cover operating a
network, writing contracts, using the SDK and working with Riadchain applications.

This repository builds independently. You do not need access to the Riadchain
implementation repository, a running node, credentials or funds to contribute
to the documentation. Some product and compiler walkthroughs describe separate
source-access prerequisites; building this site does not execute those examples.

## Develop

Use **Node 24** and **Bun 1.3.11**, matching CI:

```sh
git clone https://github.com/nfl0/riadchain-docs.git
cd riadchain-docs
bun install --frozen-lockfile
bun run dev
```

The development server listens on loopback. Public guides are Markdown and MDX
files in `src/content/docs/`; static assets are in `public/`. Add new pages to the
explicit sidebar in `astro.config.mjs`. See [CONTRIBUTING.md](CONTRIBUTING.md) for
content and screenshot guidance.

The landing page starts with reader tasks, then SDK installation and platform
guides. Shared reading styles live in `src/styles/theme.css`: warm light surfaces,
a complete dark theme, clear current-page navigation and readable code and tables.
Keep Starlight’s native search, sidebar, table of contents, copy controls and page
navigation instead of replacing them with custom client code.

## Verify

```sh
bun run build
bun run verify
```

`build` compiles every page and the Pagefind search index, then checks local
links, heading anchors, assets, canonical URLs and the 404 page. `verify` also
checks Wrangler's upload packaging with a dry run. It needs no Cloudflare login,
starts no blockchain node and spends no funds. CI runs that same focused check.

Dependencies and security overrides stay pinned in `package.json` and `bun.lock`.
Recheck the Vite and Zod overrides when deliberately upgrading Astro; do not
change them as part of an unrelated documentation edit.

## Publish

The official site is the existing assets-only Cloudflare Worker
`riadchain-docs`, serving `docs.riadchain.com`. Deployment remains a maintainer
operation, separate from public pull-request verification:

```sh
# Select the existing account privately; do not put credentials in this repository.
export CLOUDFLARE_ACCOUNT_ID='<existing Riadchain Cloudflare account ID>'
bun run deploy
```

Use an authorized local Wrangler login or a scoped deployment token supplied
outside Git. No account identifier or credential is included in this repository.
The config has no Worker entry point, SSR adapter, database, storage binding or
paid service: Cloudflare serves `dist/` directly, and search runs in the browser.
For a fork, replace the Worker name, site origin, custom domain and verification
origin before deploying to an account you control.

After an authorized deployment, verify the public root, a deep page, a missing
page (HTTP 404) and the search index. A local build or packaging dry run is not
proof of public delivery. CI does not deploy or contain Cloudflare credentials.

Only the public documentation collection and its assets belong here. Private
operator records, unreleased product guides and unpublished Cloud drafts are not
part of this repository or automatically included in the site.

## License

[MIT](LICENSE), copyright 2026 Riadchain contributors.
