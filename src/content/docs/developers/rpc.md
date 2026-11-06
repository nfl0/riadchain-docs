---
title: "Typed RPC and contract views"
description: "Use Connect and protobuf queries, handle wire types and pagination, and understand the synthetic context of public views."
---

Node queries use Connect RPC with the schema in `proto/riadchain.proto`. The SDK
wraps generated services and converts their values into application-facing types.
Use this path rather than adding a parallel REST contract for ordinary queries.

## SDK wrappers first

```ts
import { type RiadchainProvider, type EthAddress } from '@riadchain/sdk/browser';

export async function readAccountPage(
  provider: RiadchainProvider,
  account: EthAddress,
  pageToken = '',
) {
  const page = await provider.getUtxosPage(account, { limit: 50, pageToken });
  return { utxos: page.utxos, nextPageToken: page.nextPageToken };
}
```

Request one page when the UI needs one page. Use the returned cursor, preserve
account/chain scope, and reject repeated cursors or malformed responses. Native
query APIs use different pagination shapes: UTXOs use a page token, contract
storage uses a cursor, and indexed events use offset plus `hasMore`.

Contract storage pages also bound encoded entries to 8 MiB. A page can contain
fewer entries than requested; follow its returned cursor rather than assuming a
short page is the end. Prefer a specific public view when the UI needs one known
value, instead of fetching all storage to find it.

SDK amounts often become `bigint`; some public DTO fields remain decimal strings.
Generated protobuf `int64`/`uint64` fields are generally JavaScript `bigint`, while
SDK wrappers may expose safe application heights as numbers. Inspect the declared
type at the boundary instead of converting every number or string generically.
Protobuf booleans are actual booleans, including `false`.

## Direct generated clients

For custom integrations, this function uses the generated Node service directly.
The relative import assumes a TypeScript file at the repository root.

```ts
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { NodeService } from './lib/gen/proto/riadchain_pb.ts';

export async function readRawStatus(nodeUrl: string) {
  const transport = createConnectTransport({
    baseUrl: nodeUrl, useBinaryFormat: true, defaultTimeoutMs: 10_000,
  });
  const node = createClient(NodeService, transport);
  const status = await node.getStatus({});
  return { ready: status.ready, height: status.latestBlockIndex };
}
```

The service-qualified HTTP route for this method is
`/riadchain.v1.NodeService/GetStatus`. Use the generated client for framing and
errors; do not treat protobuf request bodies as arbitrary JSON.

## Public contract views

```ts
import { type RiadchainProvider, type EthAddress } from '@riadchain/sdk/browser';

export async function readCounter(provider: RiadchainProvider, address: EthAddress) {
  const result = await provider.callView(address, 'get', {});
  if (typeof result.returnValue !== 'bigint' || result.returnValue < 0n) {
    throw new Error('Invalid counter result');
  }
  return result.returnValue;
}
```

`callView` handles its contract-value codec. Pass logical values such as `{ id:
1n }`; do not pass transaction argument markers pre-encoded for this path.
Validate the returned value's actual shape; a TypeScript generic is not runtime
validation.

Contract-view and storage RPCs carry bounded JSON values inside protobuf. Their
integer envelope is
`{"$riadchain.type":"bigint","$riadchain.value":"42"}`; the SDK returns
JavaScript `bigint`. Those two keys are reserved at this RPC boundary. Integer
text must be canonical, with no whitespace, plus sign, leading zero or negative
zero. Use the provider codec instead of constructing envelopes yourself.

The signed transaction argument marker is a different adapter. A record shaped
like that marker remains ordinary data in typed RPC views; the browser's direct
JSON bridge retains its signed-marker restriction. See
[contract arguments](/developers/contract-arguments/) for the correct input path.

The public view RPC provides no wallet sender override. The node uses the contract
address as synthetic sender, zero native value, a synthetic transaction ID, and
the local tip's block/time context. Execution effects are not committed. A view
cannot prove that an authenticated write by a specific account will succeed.
Expose genuine public read methods and fetch per-account state through explicit
validated arguments where the contract supports it.

## Snapshot-pinned contract reads

Ordinary contract reads observe a moving tip. When several views or storage pages
must agree, use `provider.withReadSession(callback, options)` to acquire one
authenticated immutable contract-read snapshot. Inside the callback, call
`session.callView(contract, method, args)` and
`session.getContractState(contract, { storageCursor, storageLimit })` sequentially.
Their `readAnchor` must match `session.anchor`; the restricted SDK client checks
that match automatically. The [checkpoint guide](/build/application-checkpoints/#observe-one-l1-snapshot)
contains a complete example with network-identity checks.

The anchor includes chain ID, genesis hash, block height/hash, state hash, protocol
and timestamp. `session.expiresAtUnixMs` reports expiry. The native node retains at
most eight sessions, each for a fixed 30 seconds and at most 128 blocks of lag.
There are two simultaneous snapshot reads per node and one active read per handle.
Close promptly so retained state readers can be released. `withReadSession` closes
on exit; manual `openReadSession` users must call `session.close()` in `finally`.

The generated `ContractService.OpenReadSession` accepts an optional exact current
block hash; SDK `openReadSession({ expectedBlockHash })` and the second argument
to `withReadSession` expose that check. It does not select arbitrary historical
state. `GetState` and `CallView` carry `read_session_id` and return `read_anchor`;
`CloseReadSession` releases the handle. Normal node authentication applies to
opening, reading and closing. Configure it through the provider's protected token
or an explicitly permitted relay; never embed a private node token in a public
frontend.

Restart, expiry or excess lag invalidates the handle. Capacity exhaustion is not
an empty result. Do not reopen automatically midway through a logical read or mix
partial pages with a new snapshot. A handle grants no mutation or simulation
authority, and its anchor is not a portable proof of state or finality. These
operational RPC limits are independent of protocol activation.

## Errors and freshness

Catch RPC failures and distinguish unavailable data from an empty result. A failed
balance query is not zero. Scope in-flight results to the entity and chain that
started the read; a late response must not overwrite a new route or account.

The provider wraps typed Connect failures in `RiadchainNodeError`, exported from
`@riadchain/sdk/browser` and the main SDK entry point. For generated Connect
calls, its `code` is a numeric Connect status, such as `Code.NotFound` from
`@connectrpc/connect`. Other failures can remain ordinary errors, and FILE HTTP
helpers can report HTTP status codes instead.

Do not interpret a transaction `NotFound` response as proof that a broadcast
never occurred. Preserve its original ID and reconcile the outcome before any
retry. Set deadlines and bound response processing, concurrency and total
pagination work.

## Schema changes

Edit the protobuf source and regenerate the tracked TypeScript bindings:

```sh
npm run proto:generate
```

This requires `protoc` and the installed generator. Rust bindings generate through
the node's `build.rs`; keep the Rust handler, generated client and SDK conversion
in agreement. Hand-editing generated TypeScript will not survive regeneration.

Source: [protobuf services](https://github.com/nfl0/riadchain-sdk/blob/master/proto/riadchain.proto),
[provider conversions](https://github.com/nfl0/riadchain-sdk/blob/master/src/sdk/provider.ts),
[native view context](https://github.com/nfl0/riadchain/blob/master/rust/riadchain-node/src/node.rs).
