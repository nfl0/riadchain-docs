---
title: "Charlie and native host boundaries"
description: "Separate contract execution from native consensus, understand token authorization, and evaluate local sandbox results."
---

The high-level compiler emits Charlie source. The Rust node compiles that source
into a process-local program and executes it within the governed VM limits.
Deployed source is part of chain state; the compiled cache is an execution aid.

## Execution and effects

The interpreter handles values, stack operations and control flow. Operations
such as storage writes, transfers, nested calls, token operations and scheduling
cross a typed native host boundary. The host produces ordered effects for the
node's transition pipeline; contracts do not receive mutable access to chain
state.

Nested calls are synchronous and consume the transaction's execution budget.
Payload failure rolls back its state effects. The final transaction receipt
still matters: inclusion and fee settlement can occur even when execution fails.
Use the [outcome flow](/developers/transactions/) rather than treating a block
lookup as success.

Keep caller identities distinct. A nested callee sees the calling contract as
`ctx.sender`; the original actor remains `ctx.origin`. Calling another contract
does not grant it unlimited access to that actor's assets.

## Typed values and resource limits

Rust keeps contract values as null, booleans, bounded integers, strings, lists and
sorted string-keyed records. Storage and nested Charlie calls carry these values
directly. Integers retain their type; SDKs and dapps choose display labels, units
and formatting.

State snapshots share immutable value buffers. Reading a stored record or list
creates an independent mutable value: modifying it does not update storage or
another read until an explicit write. Stored and returned values are limited to
64 KiB of canonical tagged CBOR, in addition to gas, effect and selected VM
limits. This per-value safeguard does not cap the number of slots or contracts.

Signed arguments, RPC responses, events and scheduled payloads have their own
transport adapters. Event and schedule limits count their JSON representation;
compact storage does not make every boundary binary. See
[resource practices](/build/resource-practices/) for avoiding duplicate state and
unnecessary copying.

## Native coin and tokens

RDC native coin uses UTXOs and 100,000,000 base units per RDC. Use `bigint` for
amounts and the SDK's decimal parsing helpers; never compute financial values
with floating-point arithmetic.

Tokens are a native protocol feature exposed at the reserved system address
exported as `TOKEN_SYSTEM_CONTRACT_ADDRESS`. Import the constant rather than
inventing a deployment address. The reward vault has its own
`REWARD_VAULT_SYSTEM_CONTRACT_ADDRESS`.

| Token method | Key rule |
| --- | --- |
| `create` | Defines name, symbol, type and positive maximum supply |
| `mint` | Token creator authorization; supply stays within the maximum |
| `transfer` | Authorized source spend and sufficient balance |
| `burn` | Authorized source spend and sufficient balance |
| `balance`, `supply`, `metadata` | Read-only token queries |

Type `0` is fungible; type `1` is an NFT with maximum supply `1` and transfer/mint
amount `1`. Native quantities are checked `u128`, even though Charlie integers
can be wider.

An application spending a user's tokens through a contract supplies a bounded
transaction `tokenSpend` intent: operation, token ID, maximum amount, allowed
contract, allowed method, and optionally recipient. A user signature or
`ctx.origin` by itself is not a blanket approval. This intent is separate from
contract ownership and from a sponsored device capability.

## Different value boundaries

Charlie call data uses [contract argument encoding](/developers/contract-arguments/)
to preserve integer values. Native/system methods have their own ABI: for
example, a reward claim amount is explicitly encoded as a decimal string. Native
token decoders also accept their documented decimal-string amount fields. Do not
apply a Charlie schema blindly to every native payload or replace all decimal
strings in transaction metadata.

For token reads, the SDK provides methods such as `getTokenBalance(tokenId,
owner)`, `getTokenSupply(tokenId)` and `getTokenMetadata(tokenId)`. These perform
typed RPC queries rather than guessing reserved storage slots.

## What a local sandbox establishes

The web IDE's Charlie bridge uses the Rust compiler and interpreter under
protocol 2, with the same Rust protocol word costs as the node. Its local host
is an adapter: storage, balances and caller context are supplied locally. It
does not reproduce a persistent node's funded-input validation, native asset
ledger, selected-chain upgrade activation, FILE admission or scheduling
lifecycle. Unmodeled host and chain operations still need node simulation.

A passing sandbox run proves only the behavior it actually exercised. Test
compiler lowering locally, then test native host effects with a current native
fixture. Client integrations should include the exact built transaction and
protobuf round trip. A signed node simulation adds node validation evidence but
does not reserve inputs or guarantee execution against future state.

Source: [native VM host](https://github.com/nfl0/riadchain/blob/master/rust/riadchain-node/src/vm.rs),
[transaction executor](https://github.com/nfl0/riadchain/blob/master/rust/riadchain-node/src/executor.rs),
[IDE sandbox](https://github.com/nfl0/riadchain/blob/master/apps/web-ide/src/localSandbox.ts).
