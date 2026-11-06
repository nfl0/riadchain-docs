---
title: "ABI, guards and initialization"
description: "Understand public method dispatch, generated parameter guards, view and pure restrictions, and safe initialization."
---

The ABI is the contract's callable method surface and named argument schema.
Keep it tied to the exact source and compiled Charlie you deploy. A saved ABI
with the right method names does not prove that the node runs the same code.

## Public entry points and helpers

`method` declares a callable entry point. `fn` declares an internal helper, which
is emitted as Charlie code but excluded from the public `main` dispatcher. Calls
use named fields rather than positional ABI bytes.

```text
contract Calculator {
  pure fn twice(value: u64) { return value * 2 }
  view method preview(value: u64) { return twice(value) }
}
```

`preview` is public; `twice` is not. The generated dispatcher rejects unknown
method names. Tooling should derive methods from the parsed source and exclude
`fn` helpers, rather than guessing entry points from all Charlie definitions.

## What guards guarantee

The compiler inserts guards when extracting typed public parameters. Missing
arguments become invalid for guarded types. Numeric parameters must be integers
within their declared range: `uN` accepts 0 through `2^N - 1`; `iN` accepts
`-2^(N-1)` through `2^(N-1) - 1`. A decimal string is not an integer argument.
Addresses must satisfy the address predicate, and containers must have the
expected kind. Enum arguments must match a declared qualified variant. The
current `bytes` annotation checks a string, not a raw byte buffer.

Guards do not supply all business rules:

- A guarded input width does not constrain arithmetic results automatically.
- `address` does not prove account ownership, deployed code or chain identity.
- `list` and `record` do not validate their elements or fields.
- An annotation on storage or a return value does not enforce every assignment.
- Internal helper calls do not pass through the public parameter extractor.

Add explicit bounds, ownership, lifecycle and nested-data checks where the
contract relies on them. The active VM limit can be lower than a declared width;
a `u256` parameter still accepts small integers under a lower VM bit limit.

## `view` and `pure`

`view method` permits reads but the compiler rejects storage writes, transfers,
events and mutating external operations. `pure fn` also excludes storage reads,
execution-context access and world-state reads. `view` belongs on methods and
`pure` on helpers; `pure method` is invalid syntax.

These are source-level checks, not a permission system for arbitrary Charlie.
The RPC [view path](/developers/rpc/) executes without committing returned
effects. It has a synthetic sender and zero call value, so a view is not a
simulation of an authenticated owner's transaction.

## A constructor is a public `init` method

```text
constructor(owner: address) {
  storage.owner = owner
  return true
}
```

The compiler lowers this declaration to a callable method named `init`. It does
not automatically run once, and the current deploy builder carries code, salt and
optional upgrade authority without an atomic constructor call. The unguarded
example above is therefore unsafe: any caller could initialize or replace the
owner.

When setup is needed, bind it to the intended deployment owner and enforce
one-time initialization. Existing deployment helpers render an owner into a
contract template before compiling. Use the owning helper and a validated actual
account address; do not deploy unresolved placeholders. If all initial state is
derived from default values, removing an unnecessary initializer is simpler.

For example, an owner-bound initializer needs checks equivalent to:

```text
require(ctx.origin == EXPECTED_OWNER, "deployment owner required")
require(storage.initialized != true, "already initialized")
storage.initialized = true
```

This fragment assumes `EXPECTED_OWNER` was rendered as a validated literal before
compilation. Decide whether immediate sender checks are also needed for your
contract's call graph. Setup ownership is separate from an upgrade authority and
from chain-wide protocol upgrades.

## Bind client metadata to deployed code

Store source, compiled code, fingerprint, account, chain, address and original
deployment transaction ID together. Before using a restored deployment, compile
its source again, compare its stored code/fingerprint, and verify the selected
node's contract code. A local record or a contract-shaped address alone is not
deployment evidence.

Source: [compiler dispatch and guards](https://github.com/nfl0/riadchain/blob/master/tools/highlevel/compiler.ts),
[deploy transaction builder](https://github.com/nfl0/riadchain-sdk/blob/master/src/lib/txUtils.ts).
