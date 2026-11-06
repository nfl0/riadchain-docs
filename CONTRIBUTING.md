# Contributing

Small fixes, clearer examples and verified walkthroughs are welcome. Open an
issue for a substantial navigation or product-documentation change before
rewriting a whole section.

1. Install Node 24 and Bun 1.3.11, then run `bun install --frozen-lockfile`.
2. Edit the relevant Markdown/MDX page under `src/content/docs/`. Include `title`
   and `description` frontmatter; add new pages to the explicit sidebar.
3. Check terminology, commands and prerequisites against the current product.
   Keep runnable SDK examples separate from source-only compiler/native examples.
4. Run `bun run build` and `git diff --check`. For config or packaging changes,
   run `bun run verify` as well. Describe what you changed and checked in the PR.

Use concise prose, tables and code examples; the public site intentionally has
no diagrams. Keep customer appliance walkthroughs in **Your appliances**, separate
from technical network operations. Images must have descriptive alt text and
explicit dimensions; use actual application captures and state what they show.

The six images in `public/images/appliances/` were captured on a disposable
Android 15/API 35 emulator: Manager 0.4.3/code 9 and the Riadchain 2.0.0/code 12
testing build. They show unpaired or setup-entry screens, not completed customer
operations. Wallet Settings contains its built-in Local regtest profile. They
are 720 × 1440 WebP images, about 223 KiB total; no secrets were generated or
entered for the captures. Apply the same privacy standard to new screenshots.

Never include credentials, recovery phrases, private deployment records or
customer data. If you find a security issue, report it privately to
[contact@riadchain.com](mailto:contact@riadchain.com) rather than posting sensitive
details in a public issue. Submitting a contribution licenses it under [MIT](LICENSE).

Maintainers publish the official site separately. Pull-request CI performs an
authentication-free build and packaging dry run; it does not deploy.
