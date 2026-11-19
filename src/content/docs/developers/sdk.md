---
title: "SDK setup"
description: "Choose the published SDK or the revision 59 workspace client, then connect to a private network with a trusted chain identity."
---

## Install the published SDK

```sh
npm install @riadchain/sdk
```

The [published package](https://www.npmjs.com/package/@riadchain/sdk) is currently
**2.0.2**. It ships ES modules and TypeScript declarations for Node.js **22.14
or later**, or a modern browser with a bundler and `bigint` support. Its older
provider is available through `@riadchain/sdk/browser`; Node transport helpers
are available through `@riadchain/sdk/node`.
See the [standalone SDK repository](https://github.com/nfl0/riadchain-sdk).

**Node revision 59 uses the native `NetworkService` RPC.** The published 2.0.2
package does not contain `NetworkClient`. The examples below and in the revision
59 guides use the current workspace SDK (3.0.0 source) and require an authorized
checkout. Installing the npm package alone cannot run those examples on
revision 59.

## Connect to revision 59

From the workspace, import the portable `@riadchain/sdk/network` entry point.
Provide the chain ID and full, 48-byte genesis hash from trusted network setup.
Store the RPC token in protected configuration and use HTTPS for connections
outside a trusted private link.

```ts
import { NetworkClient } from '@riadchain/sdk/network';

export async function inspectNode(
  nodeUrl: string,
  chainId: string,
  genesisHash: string,
  nodeToken: string,
) {
  const client = new NetworkClient(nodeUrl, {
    chainId, genesisPin: genesisHash, nodeToken, nodeTimeoutMs: 10_000,
  });
  const { height, ready, provisional, archiveVerified } = await client.getStatus();
  return { height, ready, provisional, archiveVerified };
}
```

Use `isNetworkAccountAddress` to check `riad1…` account addresses and
`isNetworkContractAddress` to check `rct1…` contract addresses. An address
does not independently identify a network. Use the pinned genesis and chain ID
for reads and signing approvals. Heights and base-unit amounts use `bigint`;
format them at the display boundary. One RDC equals 100,000,000 base units.

`getAccount(address)` returns the spendable balance and the active key epoch.
Validator rewards are a separate `rewardBalance` field, which can be `null`
when the node omits it. The account can receive before the first spend opens
its signing-key commitment. A public key rotation preserves the account
address. Use a separate funded account or a narrowly scoped capability to
delegate authority.

Keep owner keys in a wallet or a protected signer. Public frontends should use
a relay that exposes only their intended operations, or a private connection
configured by the user. Never embed the node token in a public bundle or URL.

Continue to [typed RPC and views](/developers/rpc/),
[transactions and recovery](/developers/transactions/), or
[FILE uploads](/developers/files/).

## Develop in the monorepo

With authorized source access:

```sh
git clone https://github.com/nfl0/riadchain.git
cd riadchain
bun install --frozen-lockfile
bun sdk/scripts/build-dts.mjs
```

Use the checkout's pinned Bun and native tools. The workspace resolves the SDK's
TypeScript source. The standalone npm distribution is generated from the same
implementation and ships compiled JavaScript. Building this documentation does
not require access to the implementation checkout.

[Revision 59 SDK source](https://github.com/nfl0/riadchain/blob/a54ba6e54f167b0a90d7cf182d2290375af8aca1/sdk/network.ts)
