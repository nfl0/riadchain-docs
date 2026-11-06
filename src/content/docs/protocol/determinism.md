---
title: Determinism and execution
description: Understand canonical identities, replayable state transitions and the separation between chain time and live readiness.
---

Two nodes replaying the same signed genesis and canonical blocks must reconstruct the same consensus state, receipts and commitments. This property depends on explicit chain inputs and bounded Rust execution.

## Allowed execution inputs

Consensus execution uses the previous state, canonical transaction and block fields, trusted genesis and active protocol parameters. Block timestamp is an explicit signed field validated relative to the previous block.

Local wall time, peer reachability, machine scheduling, filesystem iteration order and random values do not decide historical execution. Live admission and readiness can check the receiver's clock and local operational state, but replay does not.

For example, a block can be temporarily rejected at the live boundary for being too far ahead of the receiving clock while its deterministic timestamp remains valid relative to its parent. These are separate checks, not competing replay rules.

## Canonical identity and numeric values

Transactions and blocks use canonical encodings for hashes and signatures. Money uses checked `u128` values in native execution and `bigint` in TypeScript clients. Charlie integers are bounded big integers.

State entries use explicit type tags and deterministic representations. Arrays are counted, object keys are ordered and numeric types remain distinct. JSON insertion order and floating-point rounding cannot substitute for canonical encoding.

Typed contract arguments deserve particular care. For high-level or Charlie transaction data, the SDK's `encodeContractArguments()` preserves integer values in the native representation; decimal strings are still strings. Contract-view RPC arguments use their own codec. Native system ABIs may intentionally require a string, so use the relevant typed builder instead of applying one conversion indiscriminately.

## Execute once through bounded effects

The high-level compiler is a client tool that emits Charlie source. The node recompiles deployed Charlie with its Rust compiler and executes the Rust VM.

Host requests are typed and bounded: storage access, events, native transfers, nested calls and internal deployments do not receive unrestricted mutable access to chain state. The VM emits an ordered effect plan; the executor applies those effects through the transition pipeline.

Gas, code size, instructions, stacks, arrays, integer width, nesting and aggregate effects all have limits. A contract cannot obtain unbounded work merely by moving an operation into a host request.

## Roll back payload effects and settle fees

A failed call rolls back its payload changes before deterministic settlement. Native value return, execution fees and gas refunds follow the transaction's authenticated sender and active parameters. Nested effects cannot leak out of a reverted payload.

Rollback does not mean the transaction disappears. An admitted transaction may be included with a failed execution receipt, as described in [fees](/protocol/fees/).

## Verify commitments and durable history

Nodes recompute execution and compare the resulting state commitment when accepting blocks. Ordered transition effects and deterministic state-entry encodings make changes to UTXOs, contract data, tokens, protocol version and other committed fields observable in that commitment.

Persistence establishes one durable history before derived query data is updated. A failure rebuilding a receipt cache is not permission to rebroadcast a transaction already durably included. Signed genesis and canonical blocks remain the source of truth; [storage](/protocol/storage/) explains the reconstructable data around them.

Development tools can model only part of the execution host. The web IDE's local sandbox runs the Rust Charlie VM with shared protocol word costs, but external state, signature operations and on-chain context may differ. See its [sandbox limits](/apps/web-wallet-and-ide/#run-locally-then-review-deployment). Use node read-only calls and simulation for the selected chain, then inspect the actual matching receipt after submission.
