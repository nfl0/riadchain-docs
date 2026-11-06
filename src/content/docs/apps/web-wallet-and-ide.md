---
title: Web wallet and contract studio
description: Use the extension-backed web wallet and develop reviewed Charlie contracts in the browser IDE.
---

Both applications use [Riad Keychain](/apps/keychain/) for accounts, signing and
approval. They are source applications for configured development networks;
these instructions do not supply public deployments.

## Web wallet

Connect Keychain and select its network. **Assets** shows RDC, watched tokens and
a receive address. The token watchlist accepts up to 20 positive decimal token
IDs. A failed token balance remains unavailable; missing metadata and failed
balance reads are reported separately.

**Send** prepares an RDC or token transfer for review. Check the recipient,
amount, account, network and native fee before continuing to extension approval.
Account or network changes invalidate an old draft. **Activity** distinguishes
pending submission, inclusion and execution receipts. Unknown confirmation is a
reason to inspect the original transaction, not to repeat it immediately.

The web wallet uses Keychain's public node URL without its bearer token. Direct
read access must be available at that endpoint.

## Contract studio workspace

The browser IDE edits `.hl` source and compiles it to Charlie locally. Choose
**Compile** explicitly; editing source does not compile each keystroke. The plain
source editor works without the optional rich editor loading.

A workspace holds up to 20 files with 64 KB per source. Export a JSON workspace
backup before clearing browser data. Imports are bounded and validated before
replacement. If stored data is malformed or storage fails, the IDE preserves the
original recovery data and keeps open source in memory.

Blocks have a separate draft. Switching to **Blocks** does not overwrite source.
**Apply block draft to source** explicitly replaces it and retains the previous
source for restoration; arbitrary edited source is not automatically converted
back into blocks.

## Run locally, then review deployment

The local WASM sandbox runs the Rust Charlie VM under protocol 2 rules, including
bounded storage scans and record-field deletion. It accepts a caller, block
height, timestamp and gas limit, keeps its own storage and balance, and submits
no network transaction. Word gas costs come from the same Rust protocol rules
used by the node.

Its UI discloses missing external-contract, account-balance, capability,
scheduling, chain-fee and signature behavior, plus caller/self-transfer
differences. Local success is not proof of node acceptance or consensus
execution. The selected chain must activate protocol 2 before accepting contracts
that use its new native words; the sandbox cannot activate a network upgrade.

Deployment review shows the source and compiled fingerprints, account, chain,
predicted contract address, fee, gas, expiry and local transaction ID. Calls use
the selected deployment's verified source and ABI. Pasted targets must match the
compiled code before calls. Saved deployment records are scoped to account and
chain, with a maximum of 20 records.

Public view methods use a read-only node call without a signature. Their sender
is the target contract, with zero value at the current tip; they do not use the
connected wallet as caller. Storage reads use pages of 20 slots.

Writes save their local ID before asking Keychain to submit. Unknown outcomes
remain available through **Check receipt** and block another write. The IDE never
automatically rebuilds or resends an uncertain operation.

## Developer commands

From the repository root:

```sh
bun run wallet:web
bun run wallet:web:test
bun run wallet:web:build
```

For the IDE, use `bun run dev`, `bun run test`, `bun run lint` and `bun run build`
inside `apps/web-ide`. Its separate generated Charlie WASM bridge is a local build
prerequisite; a fresh checkout may need the root `bun run rust:build:wasm` command.
Ordinary IDE validation does not rebuild that runtime or deploy a contract.
