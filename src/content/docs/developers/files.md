---
title: "FILE uploads and recovery"
description: "Describe bytes with the canonical UnixFS profile, submit and stage the original FILE transaction, and verify archive availability."
---

A FILE transaction commits a CID, size and optional filename/MIME metadata. The
object bytes live in the node's content-addressed archive, not inside a block.
Native storage and peer replication are part of the node: a remote IPFS service
is not required as the sole source of your file.

## Describe the exact bytes

Use the current canonical descriptor from the workspace SDK. It hashes the
UnixFS DAG with the repository's profile, including CIDv1, raw leaves, 1 MiB
chunks and balanced layout. Do not substitute a raw file hash or a different
importer profile.

```ts
import { describeFileBytes } from '@riadchain/sdk/internal/fileDescriptor';

const bytes = new TextEncoder().encode('hello from a local example');
const description = await describeFileBytes(bytes);
console.log(description.cid, description.size);
```

This computes a local description and sends nothing. UTF-8 byte length, not
JavaScript character count, determines text size. For encrypted attachments,
describe and upload the exact encrypted bytes; retain those same bytes for retry.

The FILE payload contains `cid`, `size`, `storage: 'helia'`, and optional
`filename`/`mimeType`. The storage tag is the canonical payload value; it does not
mean a client must start a Helia/libp2p daemon.

## Submission and staging order

1. Fetch actual chain identity, live limits, height and funded inputs.
2. Describe bytes and build the FILE transaction. Reject oversized files and
   apply a practical application memory budget.
3. Review the immutable intent, then sign and persist the original transaction
   ID plus recovery data before broadcast.
4. Submit the transaction, then stage its bytes against that same ID.
5. Check pending FILE readiness and the matching execution receipt.
6. Verify archive availability separately from the confirmed metadata.

Pass live parameters to `LocalSigner.buildFile` through its `protocolParams`
option, or as the final argument to `buildFileTx`. The builder validates the
chain's FILE size ceiling and reserves its current fees; repository defaults do
not override the selected chain's rules.
Do not sign automatically to obtain an unsigned FILE simulation preview.

After a known FILE submission, this helper stages bytes and checks the returned
CID. The signed transaction and bytes must be the original reviewed pair.

```ts
import { type RiadchainProvider, type Transaction } from '@riadchain/sdk/browser';

export async function stageOriginalFile(
  provider: RiadchainProvider,
  signedFile: Transaction,
  bytes: Uint8Array,
) {
  if (signedFile.type !== 'FILE') throw new Error('Expected FILE transaction');
  if (bytes.byteLength !== signedFile.payload.size) throw new Error('Size mismatch');
  const staged = await provider.uploadFileBytes(signedFile.id, bytes);
  if (staged.cid !== signedFile.payload.cid) throw new Error('CID mismatch');
  return staged;
}
```

`uploadFileText(txId, content)` is the text convenience wrapper. Upload responses
can report `staged`, `stored` or `already_present`; the latter is successful
deduplication, not an error.

## Browser, native and Node transport

Browser, React Native and Node clients use the same `FileService/StageFile` unary
RPC. Each request contains the original transaction ID, expected offset and at
most 1 MiB of content. The SDK checks upload status after an uncertain response
and verifies the final CID and size; acknowledged bytes alone do not prove a
verified complete upload.

Temporary prefixes survive requests but are discarded when the node restarts.
Retain the original signed transaction and content so its upload can resume or
restart without creating another transaction. `uploadFileBytes` still receives
a complete `Uint8Array`; it is not an arbitrary-size disk-stream API. Keep client
memory budgets separate from the node's maximum FILE size. Deploy the matching
node and SDK versions together so both use the same request format.

## Download verified binary content

`FileService.ReadContentChunk` serves confirmed archive bytes through the existing
authenticated Connect/protobuf path. Requests specify CID, offset and length,
with at most 64 KiB returned. Reads release the chain lock before archive I/O and
reuse the verified-object inventory rather than hashing an unchanged whole file
for every chunk. Missing archive bytes remain an availability error.

```ts
const encryptedBytes = await provider.getFileBytes(cid, {
  expectedSize: confirmedSize,
  maxBytes: 10 * 1024 * 1024 + 32,
});
```

`maxBytes` is mandatory. The helper checks every chunk's CID, offset and size and
verifies the completed canonical UnixFS CID before returning bytes. This example
uses a Notes-sized application bound; it does not limit node FILE storage.

`iterateFileBytes` supports bounded incremental consumers. Its yielded chunks are
not yet a verified complete object: finish a canonical CID check before trusting
or decrypting their content. `fileCatText` remains the UTF-8 convenience method;
the Explorer's small JSON/base64 preview is not a general binary download API.

## Readiness is not execution or permanent availability

For a transaction still pending, `getPendingFileStatus` exposes staging,
canonical availability, peer ACK count,
required ACKs and `mineable`. The validator may require fresh peer availability
ACKs before mining. Staging alone does not prove block inclusion or successful
execution.

After a [matching successful outcome](/developers/transactions/), query
`fileGetByCid(cid)` or `fileHasContent(cid)` to inspect availability. Metadata can
remain confirmed when a node's archive is missing bytes. That is an operational
recovery issue, not a reason to rewrite consensus history. FILE hydration and
chain synchronization are separate kinds of work.

## Retry the upload, not the spend

If staging fails, preserve the original ID and encrypted bytes. Reconcile the
transaction and upload status before retrying. The current node stages a complete
upload atomically and discards an incomplete upload; a buffered retry sends the
same full byte sequence against the same FILE transaction. Do not build a new
funded FILE transaction merely because an upload response was lost.

If the transaction is confirmed, recover missing content by CID and verify the
same size/content. If local bytes or encryption keys have been lost, say so;
an on-chain CID cannot reconstruct them or decrypt the attachment.

Source: [provider upload paths](https://github.com/nfl0/riadchain-sdk/blob/master/src/sdk/provider.ts),
[canonical UnixFS profile](https://github.com/nfl0/riadchain-sdk/blob/master/src/lib/unixfsCodec.ts),
[node FILE archive](https://github.com/nfl0/riadchain/blob/master/rust/riadchain-node/src/file_store.rs).
