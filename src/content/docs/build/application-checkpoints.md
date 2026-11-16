---
title: "Application checkpoints"
description: "Run trusted application operations locally, publish recoverable checkpoints, and execute explicit L1 actions separately."
---

The implemented checkpoint foundation lets an application execute its own
operations locally and publish bounded, recoverable results to Riadchain. An
ordinary contract accepts an authorized publisher's commitments. The publisher
is trusted for computation: a signed commitment identifies its author but does
not prove that arbitrary off-chain computation was correct.

This is a reference for building application runtimes, not a complete general L2
service, proof verifier or automatic asset bridge. L1 still uses Charlie and its
existing transaction, authorization and resource rules.
Application commitments are separate from the node's derived persistence
checkpoints used to accelerate startup.

## Track three outcomes

| Outcome | Evidence |
| --- | --- |
| Local operation completed | Your application runtime's result |
| Checkpoint accepted on L1 | Matching successful receipt for `accept` |
| Requested L1 action executed | Matching successful receipt for the separate `executeMessage` transaction |

An application may complete independent local work while an L1 action waits.
Accepting a checkpoint does not execute its L1 messages. A failed message leaves
the accepted checkpoint intact, and an RPC timeout leaves the original
transaction unresolved. Preserve its signed bytes and ID before broadcasting;
follow [transaction recovery](/developers/transactions/) before replacement.
Ten-second blocks do not guarantee confirmation within ten seconds.

## Use typed commitments and authenticated chain identity

| High-level API | Purpose |
| --- | --- |
| `typedHash(domain, value)` | Hash domain-separated canonical typed values |
| `ctx.chainId`, `ctx.genesisHash` | Read the execution chain's authenticated identity |
| `bytesSha256(hex)`, `bytesKeccak256(hex)` | Hash decoded binary bytes |
| `utf8ToHex`, `hexToUtf8` | Convert lossless UTF-8 and strict binary hex |
| `base64ToHex`, `hexToBase64` | Convert canonical padded standard Base64 and binary hex |

The [SDK](/developers/sdk/) exports equivalent hash and codec functions from
`@riadchain/sdk/browser`. Binary hex is lowercase, even-length and has no `0x`;
an empty string represents zero bytes. Malformed hex, noncanonical Base64 and
invalid UTF-8 are rejected. Values remain subject to execution limits and gas.

`typedHash` hashes the prefix `riadchain/typed-data/v1` plus one zero byte and the
canonical `ContractValue` CBOR encoding of `{domain, value}`. Its wrapper is bounded
to 64 KiB. The domain is 1–128 printable ASCII bytes without spaces. Integers,
decimal strings, null and omitted fields are distinct; ordinary JSON encoding is
not a replacement. Use the SDK implementation rather than hand-building bytes.

A signed application envelope must explicitly bind the verified chain ID,
genesis hash, deployed contract, schema/version, actor or publisher epoch, nonce
and validity bounds. Hashing alone supplies no replay protection or authority.
The contract's context is authenticated by signed genesis; a client-supplied
identity string is only a claim until checked against the intended network.

## Observe one L1 snapshot

Authenticated [read sessions](/developers/rpc/#snapshot-pinned-contract-reads)
retain one contract-read snapshot while blocks advance. This example accepts a
configured provider, a verified deployed checkpoint address and the expected
network identity; it supplies no public endpoint or universal contract address.

```ts
import { type RiadchainProvider, type EthAddress } from '@riadchain/sdk/browser';

export async function readCheckpoint(
  provider: RiadchainProvider,
  checkpoint: EthAddress,
  expected: { chainId: string; genesisHash: string },
) {
  return provider.withReadSession(async (session) => {
    if (session.anchor.chainId !== expected.chainId
      || session.anchor.genesisHash !== expected.genesisHash) {
      throw new Error('Unexpected checkpoint network');
    }
    // One read at a time on each session.
    const metadata = await session.callView(checkpoint, 'getMetadata', {});
    const head = await session.callView(checkpoint, 'getHead', {});
    return { anchor: session.anchor, metadata: metadata.returnValue,
      head: head.returnValue };
  });
}
```

Validate view return shapes and the contract's expected code/metadata before
using them in application decisions. The SDK verifies that every session response
matches its original anchor, and `withReadSession` closes the handle on exit.
A handle is an observation from your authenticated RPC, not a portable state
proof or finality guarantee. It grants no signing, submission or simulation API.

The initial native limits are eight sessions per node, a fixed 30-second lifetime,
128 blocks of maximum lag, two simultaneous snapshot reads and one active read per
session. Expiry or restart invalidates the handle. Discard partial results rather
than silently reopening and mixing snapshots. `expectedBlockHash` can require an
exact current tip when opening; it does not select arbitrary historical state.

## Recover data and execute messages

The [Checkpoint reference](https://github.com/nfl0/riadchain/tree/master/dapps/Checkpoint)
binds initialization to a rendered bootstrap account. Its admin NFT controls
publisher rotation and receiver pause/resume. Transferring the NFT changes those
administrative rights; it does not rotate the publisher automatically. None of
these roles controls chain rules.

`accept` checks the publisher, authority epoch, next sequence and previous root.
It accepts at most 8,192 inline payload bytes and eight fixed `record` messages
for one configured receiver. The contract stores its current head and pending
message digests; exact payloads remain in committed transaction history instead
of being duplicated in active state. A root alone cannot recover application data.
Native FILE storage remains available, but this reference needs no FILE upload or
external data-availability service.

The example runtime replays bounded, canonical `json-v1` additions and checks the
manifest, sequence, previous base and recomputed next root. Feed recovery only
confirmed canonical transaction inputs and matching successful acceptance
receipts from the intended chain and contract. A matching hash supplied by an
unverified source does not establish acceptance.

The recorded snapshot anchor is the publisher's assertion. L1-dependent actions
recheck their conditions at execution time. `executeMessage` checks the exact
pending message and consumes it before calling the receiver. Failure rolls that
message back without undoing the checkpoint; success prevents duplicate execution.
The receiver sees the checkpoint contract as caller, not an impersonated L1 user.
This reference records non-financial values and cannot spend user assets.

## Build and qualify the reference

These reference build commands require the
[monorepo setup](/developers/sdk/#develop-in-the-monorepo), including its
compiler and tests; installing the SDK alone is insufficient. Compilation and
focused tests do not deploy contracts:

```sh
bun dapps/Checkpoint/contracts/build.ts
bunx tsc --noEmit -p dapps/Checkpoint/tsconfig.json
bun test dapps/Checkpoint/runtime.test.ts dapps/Checkpoint/contracts/checkpoint.contract.test.ts dapps/Checkpoint/scripts/deploy.test.ts
```

After building current `riadchaind` and `riadchain-cli`, qualify the native SDK/RPC
path in a fresh private directory:

```sh
bun dapps/Checkpoint/scripts/qualify.ts --state-dir /absolute/fresh/private/qualification
```

This starts a disposable loopback-only regtest with test keys and funds. It checks
publication/recovery, rejected or duplicate operations, failed/retried messages,
NFT administration, FILE retrieval and restart/replay. It cannot target a live
RPC. `--bin-dir PATH` selects an extracted executable pair. Keep failed-run
journals; use a fresh directory for another run. These checks are correctness
evidence, not throughput qualification.

## Prepare a separate deployment

Copy the repository's
[deployment template](https://github.com/nfl0/riadchain/blob/master/dapps/Checkpoint/scripts/deploy.config.example.json)
into protected local storage. Replace every fixture with verified network,
account and credential-file references; set an explicit aggregate fee ceiling.
The helper renders account-bound source rather than deploying checked-in fixture
artifacts. Its default mode prepares the next signed original without broadcasting:

```sh
bun dapps/Checkpoint/scripts/deploy.ts --config /absolute/private/deployment-config.json
```

Preparation is not a dry run: it needs the owner vault and preserves signed bytes
in a private journal. Review actual fees and authorize the target deployment before
adding `--apply`, which permits four serialized deployment/initialization
transactions within the configured ceiling. The admin NFT mints directly to
`adminRecipient`; the initial publisher is the deployment owner. Further checkpoint
publication, outbox execution, publisher rotation and NFT transfer are separate
actions. No accounts are funded automatically. Uncertain or expired originals
block replacement until reconciled.

Source: [contract and deployment guide](https://github.com/nfl0/riadchain/blob/master/dapps/Checkpoint/README.md),
[checkpoint specification](https://github.com/nfl0/riadchain/blob/master/docs/protocol/APPLICATION_CHECKPOINT_FOUNDATION.md).
