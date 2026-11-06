---
title: "High-level language"
description: "Learn the contract structure, runtime values, storage, control flow and execution context of the current compiler."
---

A source file contains one `contract`. Top-level declarations include `const`,
`enum`, `storage`, `event`, `method`, `fn` and `constructor`. The language is small:
it is not TypeScript, Solidity or a general-purpose process runtime.

## Values and types

Charlie runtime values are `null`, booleans, integers, strings, lists and records.
Integers have arbitrary precision within the active VM bit limit; there is no
floating-point runtime value or `undefined`.

| Annotation | Meaning at a public parameter boundary |
| --- | --- |
| `u8` … `u256` | Integer from 0 through `2^N - 1` for the declared width `N` |
| `i8` … `i256` | Integer from `-2^(N-1)` through `2^(N-1) - 1` |
| `bool` | Boolean |
| `string`, `bytes` | String; `bytes` does not imply a distinct byte-array value |
| `address` | Address string accepted by the runtime address predicate |
| `list`, `record` | Container kind, without a nested element schema |
| `any` | No generated parameter guard |
| Declared enum | One of that enum's qualified string variants |

Public numeric parameters enforce their declared width in Rust before the method
body: `u8` accepts 0–255 and `i8` accepts -128–127. The selected VM integer limit
also applies. Storage, helper parameters, event fields and return annotations do
not add automatic runtime range or nested-schema checks. Add checks for the
application's own rules and calculated results. See
[ABI and guards](/build/abi-and-guards/).

```text
contract Limits {
  enum Mode { Waiting, Ready }
  const MAX_BATCH: u64 = 20

  method validate(count: u64, mode: Mode) {
    require(count <= MAX_BATCH, "batch too large")
    return { count: count, mode: mode }
  }
}
```

The enum value is the string `"Mode.Ready"`, not a numeric ordinal.

## Locals and control flow

Use `let` for an immutable binding and `let mut` for a binding you will assign
again. Locals are scoped; declarations cannot shadow parameters or outer locals.
Constants are literal aliases expanded during compilation.

```text
pure fn boundedSum(values: list) {
  require(length(values) <= 20, "too many values")
  let mut total = 0
  for (let mut i = 0; i < length(values); i = i + 1) {
    require(isInteger(values[i]), "integer required")
    total = total + values[i]
  }
  return total
}
```

This is the supported C-style `for` form. `while`, `if`, `else if` and `else` are
also available. There is no `foreach`, `for … in` or `match` syntax. Bound loops
and collections explicitly: gas and VM limits are a final execution limit, not a
substitute for a predictable API.

## Storage and effects

Declare a slot with `storage total: u64`, read it with `storage.total`, and assign
with `storage.total = value`. An unset slot reads as `null`. Handle that case
before arithmetic or comparisons.

For dynamic keys, use `storageGet(key)`, `storageSet(key, value)` and
`storageDelete(key)`. Deletion removes the slot; storing `null` retains an occupied
slot with a null value. Both read as `null` through Charlie after the operation.
Deletion is allowed only in mutating methods or helpers and rolls back with a
failed call. Choose cleanup from the application's explicit lifecycle; preserve
any balances, claims and authorization markers that later calls still need.

`require(condition, "literal message")` and `assert` compile to the same guard.
A failing guard throws. Failed payload effects roll back; an included failed
transaction can still incur fees.

Declare events with named fields and emit them in declaration order:

```text
event Updated(indexed actor: address, value: u64)
// Inside a method:
emit Updated(ctx.sender, 10)
```

`transfer(to, amount)` requests native coin transfer from the executing contract.
`call(target, methodName, data)` performs a synchronous contract call;
`callValue(target, methodName, data, amount)` forwards native value. These are
native host effects, subject to balance, gas and execution rules.

## Execution context

| Field | Meaning |
| --- | --- |
| `ctx.sender` | Immediate caller of this frame |
| `ctx.origin` | Original transaction actor; do not confuse it with the immediate caller |
| `ctx.address` | Executing contract address |
| `ctx.topCaller` | Top-level contract entered by the transaction |
| `ctx.value` | Native base units passed to this frame |
| `ctx.data` | Current message data |
| `ctx.txId` | Transaction ID |
| `ctx.block` | Execution block index |
| `ctx.timestamp` | Execution timestamp in milliseconds |
| `ctx.chainId` | Signed-genesis chain identity; protocol 3 |
| `ctx.genesisHash` | Authenticated genesis block hash; protocol 3 |

Public parameters, direct `ctx.data.field` access and `msg(key)` read only the
selected message field. Standalone `ctx.data` creates the full message record;
assigning it to a local just to read one field does extra work. The `method` field
comes from the actual method selector, even if the input record contains a field
with that name. Independent record/list reads produce separate mutable values.

Nested calls change the immediate sender to the calling contract. Choose
authorization checks deliberately; checking `origin` everywhere can let an
intermediary exercise authority the user did not intend to grant.

## Typed commitments and binary codecs

Protocol 3 adds `typedHash(domain, value)` for canonical typed-value commitments,
plus `bytesSha256`, `bytesKeccak256`, `utf8ToHex`, `hexToUtf8`, `base64ToHex` and
`hexToBase64`. Binary values use lowercase, even-length hex without `0x`; strict
decoders reject invalid UTF-8 and noncanonical encodings. `typedHash` preserves
integer/string/null distinctions and does not hash JSON text. Include verified
chain, genesis, contract and application replay fields in the value yourself.

The new VM operations require active protocol 3; compilation or a software
update alone does not activate them. Existing text helpers retain their earlier
meaning. See [application checkpoints](/build/application-checkpoints/) for the
digest format, snapshot reads and the implemented trusted-publisher reference.

See [contract resource practices](/build/resource-practices/) for efficient reads,
state layouts and cleanup without automatic retention policies.

Source: [parser, analyzer and lowering](https://github.com/nfl0/riadchain/blob/master/tools/highlevel/compiler.ts).
