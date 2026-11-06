---
title: "Encode contract arguments"
description: "Preserve typed Charlie integers through transaction JSON and protobuf without confusing them with view or native-system codecs."
---

Charlie integers and decimal text are different runtime values. A typed method
such as `add(by: u64)` rejects the string `"5"`; converting a `bigint` to decimal
text everywhere can therefore produce a validly signed transaction that fails
execution.

## Encode before building a Charlie call

```ts
import {
  encodeContractArguments, decodeContractArguments,
} from '@riadchain/sdk/browser';

const data = encodeContractArguments({
  by: 5n,
  metadata: { label: 'batch', ids: [1n, 2n] },
});
// data is JSON-compatible and preserves native integer types.
const inspected = decodeContractArguments(data);
console.log(inspected.by === 5n); // true
```

Pass `data` to the data argument of `LocalSigner.buildContractCall` or the
workspace's `buildContractCallTx`. The method selector is a separate builder
argument. Encode once before building: changing call data after the builder has
computed the ID changes the signed intent.

The encoder preserves nested integers using the native marker understood by
the Rust transaction/VM adapter. Safe JavaScript integer numbers are normalized
to integers as well; use `bigint` for values beyond `Number.MAX_SAFE_INTEGER`.
Strings remain strings. Never hand-author the reserved marker object.

## Use the live integer limit

```ts
import {
  encodeContractArguments, type RiadchainProvider,
} from '@riadchain/sdk/browser';

export async function encodeForNode(provider: RiadchainProvider) {
  const params = await provider.getProtocolParams();
  return encodeContractArguments({ id: 1n }, {
    maxBigIntBits: params.vmLimits.maxBigIntBits,
  });
}
```

Here `provider` is your configured SDK provider. The helper defaults to the
repository VM limit when no option is supplied. The current helper also bounds
nesting, nodes and encoded bytes; it rejects unsafe numbers, unsupported values,
cycles, accessors, symbol keys and user-supplied reserved markers. Protocol and
application limits still apply after encoding.

The helper's bit limit is separate from the compiler's declared integer width.
A `u64` public parameter has generated checks for the exact range 0 through
2^64 − 1. Signed `i64` parameters accept −2^63 through 2^63 − 1. These checks
run in Rust before the public method body. Intermediate calculations and storage
assignments still require application checks when they must fit a fixed width.

## Decode recovered intent, then validate it

`decodeContractArguments` is for inspecting the encoded data inside an original
transaction. It converts canonical integer markers and safe integer numbers into
`bigint`, leaves strings unchanged, and rejects malformed markers.

After decoding, verify the exact method and expected field types/values. Also
verify the transaction's canonical ID, chain, owner, contract and signatures or
capability binding as appropriate. Decoding alone is not authentication.

This matters for a recovered invitation or attachment message: the original
transaction must refer to the same conversation, participant and CID before its
receipt can settle that recovery record.

## Keep three boundaries separate

| Boundary | What to supply |
| --- | --- |
| Signed Charlie contract call | `encodeContractArguments(logicalData)` before the builder |
| `provider.callView` | Logical arguments; the provider applies its RPC value codec |
| Native/system ABI | Its documented fields and encodings, including explicit decimal strings |

For example, a native reward claim amount is a decimal string by design. Native
token amount fields also have native decoding rules. Transaction metadata such
as call value and token-spend intents is not an arbitrary Charlie argument record.
Do not rewrite these fields with the Charlie helper.

Contract storage retains integers directly in compact binary values; SDKs and
dapps format labels, units and readable text. Public views return logical values,
including `bigint`, through the provider's codec. `storageDelete(key)` removes a
retained slot, while storing `null` keeps a slot with a null value. These compact
representations and explicit deletions reduce retained data; they do not expire
state or cap the number of active contracts. See
[contract resource practices](/build/resource-practices/) for state layout and
cleanup choices.

Test the exact built call through protobuf and the current native runtime.
A direct VM call with a `bigint` can pass while a differently serialized SDK call
fails its generated argument guard.

Source: [argument codec](https://github.com/nfl0/riadchain-sdk/blob/master/src/lib/contractArguments.ts),
[builder/native wire regressions](https://github.com/nfl0/riadchain/blob/master/tests/bun/unit/dapp-contract-wire.unit.test.ts).
