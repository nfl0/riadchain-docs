---
title: "Typed RPC and contract views"
description: "Use the native NetworkService with a trusted chain identity, bounded history pages, and snapshot-pinned contract reads."
---

Revision 59 serves Connect/protobuf methods under `/riadchain.v1.NetworkService/`.
For example, the status route is `/riadchain.v1.NetworkService/GetStatus`.
Use the generated client for framing and errors. The [workspace NetworkClient](/developers/sdk/#connect-to-revision-59)
verifies the response against the configured chain or genesis pin and converts
protobuf values to application types.

| Read | Workspace SDK |
| --- | --- |
| Status and account balance | `getStatus()`, `getAccount(address)` |
| Signed blocks and original transaction details | `listBlocks({ limit })`, `getBlock({ height, expectedBlockHash })` |
| Account transactions | `listAccountTransactions({ address, limit, anchor, before })` |
| Execution receipts, events and call tree | `getBlockExecution({ height, expectedBlockHash, offset, limit })` |
| Contract events | `listEvents({ contractAddress, eventName, anchor, ... })` |
| Contract view | `callView({ contractAddress, method, args })` |
| FILE references and content | `listFiles()`, `readFile()` |

## Account history and block execution

```ts
import type { NetworkClient } from '@riadchain/sdk/network';

export async function accountHistory(client: NetworkClient, address: string) {
  const latest = await client.listAccountTransactions({ address, limit: 10 });
  const older = latest.before
    ? await client.listAccountTransactions({
        address, limit: 10, anchor: latest.anchor, before: latest.before,
      })
    : undefined;
  return { latest, older };
}
```

Account history is newest first by signed block height and transaction position.
It includes signed originals involving the queried account as input owner,
output recipient or signer. A row's `success` reports execution. Keep the
original anchor for every continuation. If the node can no longer verify that
anchor, start a new list and discard the old continuation.

Read a block's signed transaction page with `getBlock`. For full execution
details, call `getBlockExecution` with the same block height and hash and follow
`nextOffset`. The node serves recent execution output from its receipt cache.
For older blocks it finds a suitable checkpoint and replays signed history.
`replayed` identifies this slower path. Cache eviction leaves signed blocks
available. Execution details can be bounded by the
response size, as indicated by each receipt's `detailsComplete` flag.

## Contract events

Start with `listEvents({ contractAddress })` for the recent cache. To continue
within the same event window, pass its returned `anchor`, `fromHeight` and
`offset`. To inspect an older window, request `historical: true` with the anchor
and `beforeHeight`. With no `fromHeight`, the node chooses a checkpoint-aligned
start for the requested window. Keep the same contract and event filter across
pages. Historical replay shares a bounded worker with old execution queries, so
allow a longer deadline and avoid issuing many replay requests at once.

## Public contract views

```ts
import type { NetworkClient } from '@riadchain/sdk/network';

export async function readCounter(client: NetworkClient, contractAddress: string) {
  const result = await client.callView({ contractAddress, method: 'get' });
  if (typeof result.returnValue !== 'bigint' || result.returnValue < 0n) {
    throw new Error('Invalid counter result');
  }
  return { count: result.returnValue, height: result.height };
}
```

Pass logical arguments such as `{ id: 1n }`. The SDK handles the RPC codec and
returns typed values. Validate the actual return shape. A view uses a synthetic
execution context and commits no effects. A view can expose explicit,
contract-validated account arguments; it cannot impersonate a caller or
establish that a signed write will succeed.

## Snapshot-pinned contract reads

Use `client.withReadSession(callback, options)` when several views must agree
on one state. Call `session.callView({ contractAddress, method, args })` and
`session.getContractCodeIdentity(contractAddress)` sequentially. The returned
values are checked against the session anchor, which includes the chain, genesis,
block height and hash, state root, protocol and time.

The session begins at the current tip. Pass `{ expectedBlockHash }` to require a
specific current tip. Each session lasts up to 30 seconds and permits up to
128 blocks of lag. A node retains up to eight sessions and serves up to two
concurrent reads across them. `withReadSession` closes on exit, while manual
`openReadSession` use needs `session.close()` in `finally`. Read promptly within
the expiry. If the session expires, falls behind or is lost on node restart,
discard the partial result and repeat the whole read. Snapshot handles grant no
write authority and are scoped to the node that issued them.

## Errors and freshness

Distinguish failure from absence. A failed balance query is unknown. Preserve
the original ID if a transaction cannot be found, and reconcile it before any
retry. Set deadlines, bind responses to the initiating chain and entity, and
bound pagination and concurrency.

For source changes, edit `proto/riadchain.proto` and run `npm run proto:generate`
with the repository's pinned generator and `protoc`. Rust bindings are generated
by the node build. Keep the schema, handler and SDK conversion aligned.

[Revision 59 protobuf schema](https://github.com/nfl0/riadchain/blob/a54ba6e54f167b0a90d7cf182d2290375af8aca1/proto/riadchain.proto)
