---
title: "FILE uploads and recovery"
description: "Prepare a FILE reference, stage the signed original, and verify confirmed archive bytes."
---

A FILE transaction commits a content identifier (CID) and byte count. The node
stores the object in its content-addressed archive and replicates it to peers.
The block stores the reference, and archive availability can be checked
separately. The examples use the
[revision 59 workspace SDK](/developers/sdk/#connect-to-revision-59).

## Prepare the exact bytes

`client.prepareFile({ owner, content, maxFee })` describes the content with the
canonical UnixFS profile, prepares an unsigned transaction and checks the fee
limit. Supply a `Uint8Array` or a `NetworkFileSource` with an exact size and
bounded random-access read. The network limit is **300 MiB**; applications can
set a smaller limit. For encrypted attachments, prepare the exact ciphertext
and retain it through recovery.

Review the draft CID, size, signer, fee and chain before requesting the
signature. One CID may have several upload references.

## Stage the signed original before submitting

```ts
import {
  encodeNetworkSubmission,
  type NetworkClient,
  type NetworkSignedTransaction,
} from '@riadchain/sdk/network';

export async function publishReviewedFile(
  client: NetworkClient,
  signed: NetworkSignedTransaction,
  content: Uint8Array,
  save: (id: string, artifact: Uint8Array, content: Uint8Array) => Promise<void>,
) {
  await save(signed.id, encodeNetworkSubmission(signed), content);
  await client.stageFile(signed, content);
  return client.submit(signed);
}
```

`NetworkService.StageFile` carries the signed original, offset and at most
**1 MiB** per request. The SDK verifies that the content matches the original
CID and size and checks the returned offset. Staging precedes submission and
does not broadcast. A completed stage still needs a matching successful
[transaction outcome](/developers/transactions/#interpret-outcomes-precisely).
Networks that require peer acknowledgements can keep a submit queued while
peers fetch and validate the bytes.

After a staging error, recover the same signed artifact and bytes. Retry staging
that original. After an uncertain submission, check `getTransaction(signed.id)`
on the same pinned genesis before resending or preparing anything new.
Retain the bytes through node restart or incomplete staging.

## Read verified archive content

Use the confirmed CID and an explicit application byte budget.

```ts
const bytes = await client.readFile(cid, {
  expectedSize: confirmedSize,
  maxBytes: 10 * 1024 * 1024,
});
```

`readFile` checks returned offsets, byte counts and the canonical CID before it
returns. For larger content, `readFileTo` streams chunks to your temporary
destination. Publish that destination only once the promise resolves and the
full CID is verified. A missing object is an archive recovery issue even if the
signed upload is confirmed.

`listFiles` returns upload metadata, including owner, upload ID, CID and
retirement state. To continue, pass the original page's anchor block hash as
`expectedTipHash` and its `afterUploadId`. Start a new list if the tip changes.
An owner can use `prepareFileRetirement` to retire their specific upload ID.
The signed upload remains in history. Other live upload references to the same
CID remain valid.

[Revision 59 FILE SDK](https://github.com/nfl0/riadchain/blob/a54ba6e54f167b0a90d7cf182d2290375af8aca1/sdk/network.ts)
