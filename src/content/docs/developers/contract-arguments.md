---
title: "Encode contract arguments"
description: "Keep Charlie values typed when preparing signed calls and reading contract views."
---

A Charlie integer and its decimal text are different values. A typed method
such as `add(by: u64)` accepts `5n`; the string `"5"` is a different type.
Use the [revision 59 workspace SDK](/developers/sdk/#connect-to-revision-59) to
prepare calls and apply the correct encoding.

## Prepare a typed call

```ts
import type { NetworkClient } from '@riadchain/sdk/network';

export function prepareAdd(
  client: NetworkClient,
  owner: string,
  contractAddress: string,
  gasLimit: number,
  maxFee: bigint,
) {
  return client.prepareContractCall({
    owner, contractAddress, method: 'add', args: { by: 5n }, gasLimit, maxFee,
  });
}
```

The client encodes the logical argument record and checks the returned draft
against it. Nested arrays and records can contain integers. Use `bigint` for
values beyond JavaScript's safe integer range and avoid building wire markers
by hand. Review and sign the returned draft as described in
[transactions and recovery](/developers/transactions/).

A declared `u64` argument is checked for the range 0 through 2^64 − 1 before
the public method runs. The generated check for signed `i64` accepts −2^63
through 2^63 − 1. Intermediate calculations and storage assignments need
application checks when they must fit a fixed width.

## Read views and inspect retained drafts

For `client.callView({ contractAddress, method, args })`, pass the same logical
values. The SDK applies the read-only RPC codec and returns logical values such
as `bigint`. Inspect a retained signed-call draft with `decodeNetworkDraft` and
compare its method, owner, contract, chain and exact arguments to the intended
operation. Decoding alone does not authorize a call.

Native operations such as transfers and reward claims have their own typed
inputs. Use the network SDK's operation builders for those fields. In contract
storage, `storageDelete(key)` removes the slot, while storing `null` keeps a
slot with a null value.

[Revision 59 contract SDK](https://github.com/nfl0/riadchain/blob/a54ba6e54f167b0a90d7cf182d2290375af8aca1/sdk/network.ts)
