---
title: "SDK setup"
description: "Install the public Riadchain SDK, choose browser or Node entry points, and make typed read-only queries."
---

Install `@riadchain/sdk` to build an application without cloning the Riadchain
monorepo. The public package contains compiled ES modules and TypeScript
declarations. Use Node.js **22.14 or later**, or a modern browser with a bundler
supporting ES modules and `bigint`.

## Install the SDK

```sh
npm install @riadchain/sdk
```

The [standalone SDK repository](https://github.com/nfl0/riadchain-sdk) provides
readable source, independent builds and read-only examples. It is generated from
the authoritative monorepo SDK/client sources; there is one implementation.
Installing or importing it does not start a node or submit transactions.

## Choose the runtime entry point

| Import | Use |
| --- | --- |
| `@riadchain/sdk/browser` | Browser and portable clients; default Connect web transport |
| `@riadchain/sdk` | Shared provider, signer, wallet and utility exports |
| `@riadchain/sdk/node` | Node transport factories and options |
| `@riadchain/sdk/gateway` | Named application rules, bounded token-spend selectors and current NFT administration |

Use the browser entry point in dapps and React Native code. Node-specific
transport options, host headers and process configuration belong in controlled
Node applications, not in a browser bundle.

This function creates a provider and performs only reads when called. Supply an
actual configured endpoint; no public deployment is implied.

```ts
import { RiadchainProvider } from '@riadchain/sdk/browser';

export async function inspectNode(nodeUrl: string) {
  const provider = new RiadchainProvider(nodeUrl, undefined, {
    nodeTimeoutMs: 10_000,
  });
  const [status, params] = await Promise.all([
    provider.getStatus(),
    provider.getProtocolParams(),
  ]);
  return { chainId: status.chainId, height: status.latestBlockIndex,
    ready: status.ready, maxFileBytes: params.maxFileBytes };
}
```

For a Node service:

```ts
import { createNodeProvider } from '@riadchain/sdk/node';

export function connectService(nodeUrl: string, nodeToken?: string) {
  return createNodeProvider(nodeUrl, nodeToken, {
    nodeTimeoutMs: 10_000,
    maxInFlightRequests: 4,
  });
}
```

Here `nodeUrl` and `nodeToken` are configuration supplied by your service. The
token is a credential: do not expose it in public wallet network metadata,
frontend bundles, query strings or logs. Public dapps can use a configured relay
that permits only the intended read methods.

## Provider, signer and wallet session

- `RiadchainProvider` reads state, submits transactions and stages FILE bytes. It
  holds no signing key.
- `LocalSigner` owns a private key, builds transactions and signs them. Instantiate
  it only where your application deliberately manages that key.
- `WalletSession` combines provider and signer convenience operations and caches
  spend state. It does not replace your user review, session scoping or durable
  recovery journal.

An injected wallet keeps keys inside the wallet. Build and review unsigned
transactions, request explicit approval through that wallet, and validate the
returned transaction identity. Never ask a dapp user to paste a private key into
an ordinary web form.

For [limited machine production keys](/protocol/succession/#owner-and-machine-keys),
`provider.getProductionSigner(owner)` reads the additional signer or `null`.
`LocalSigner` and `WalletSession` expose `buildProductionSignerSet` and
`buildProductionSignerRevoke`; both produce unsigned owner transactions for
review and the usual sign/submit/receipt flow. Delegation grants block signing
only; it does not give the machine the owner's spending key.

## Amounts and chain identity

```ts
import { toSatoshis, formatSatoshisAsRdcString } from '@riadchain/sdk/browser';

const amount = toSatoshis('0.01'); // 1_000_000n base units
console.log(formatSatoshisAsRdcString(amount));
```

Use decimal text at UI input boundaries and `bigint` internally. A wallet network
selection ID is not the consensus chain ID. Query `getChainId()` and compare it
with the expected chain before reads used for an approval and again before a
write. Two RPC URLs may serve the same chain; equal URLs alone prove neither
identity nor freshness.

## Typed hashing and pinned reads

The browser and shared SDK entry points export `typedHash`,
`encodeCanonicalContractValue`, `bytesSha256`, `bytesKeccak256`, `utf8ToHex`,
`hexToUtf8`, `base64ToHex` and `hexToBase64`. These match protocol 3's canonical
typed hashing and strict byte operations. They do not implement an application's
signature, nonce or authorization policy. Use verified chain/genesis and contract
identity in signed envelopes; do not substitute ordinary JSON hashing.

`provider.withReadSession(async session => { ... })` acquires and closes an
authenticated contract-read snapshot. The restricted client exposes
`session.anchor`, `session.callView` and `session.getContractState`; it has no
submission, signing or simulation methods. Read sequentially within each session,
and discard partial results if it expires. See [pinned reads](/developers/rpc/#snapshot-pinned-contract-reads)
for limits and [application checkpoints](/build/application-checkpoints/) for a
complete use case and executable workspace commands.

Continue with [transactions and recovery](/developers/transactions/),
[typed RPC and views](/developers/rpc/) and [FILE uploads](/developers/files/).

## Develop in the monorepo

App, contract compiler and native qualification examples elsewhere in these
guides require authorized access to the private Riadchain checkout rather
than only the npm SDK. That access is not required to build this documentation:

```sh
git clone https://github.com/nfl0/riadchain.git
cd riadchain
bun install --frozen-lockfile
bun sdk/scripts/build-dts.mjs
```

Run those commands with the repository-pinned Bun and required native tools.
Rebuild declarations after SDK API changes before checking workspace consumers.
The workspace package resolves TypeScript source; the standalone npm package
resolves compiled JavaScript. Submit SDK changes to the canonical repository and
regenerate the standalone distribution instead of maintaining a separate copy.

Source: [public SDK source and release details](https://github.com/nfl0/riadchain-sdk).
