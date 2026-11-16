---
title: "Contract resource practices"
description: "Reduce unnecessary state, memory use and I/O while preserving application data, history and native FILE availability."
---

Riadchain supplies bounded execution and efficient storage primitives. Contracts
choose which state their applications need. Compact values reduce overhead;
they do not automatically expire user data or impose a total growth quota.

Native execution tables and their growing indexes live on disk behind SQLite
caches. Contract storage no longer requires all active values in node RAM, but
large or scattered reads still cost I/O, decoding and VM working memory. Candidates
and simulations retain their changed records; checkpoints stream a pinned view.
Compact state and bounded access therefore remain useful. Browser examples use
the memory backend with the same Rust execution rules, so measure the intended
native deployment when assessing capacity.

## Read only what you need

Public parameters, direct `ctx.data.field` access and `msg(key)` read one incoming
field. Standalone `ctx.data` materializes the complete message, including fields
the method may never use. Complete inputs still pass admission and argument
bounds; selected values retain the VM's execution limits.

Read a repeated storage value into a local once. A local is a snapshot: read it
again if a nested call could have changed storage. Separate reads create
independent mutable records and lists, and changing a local requires an explicit
write to affect state.

For clients, use a specific `callView` method for a known value. Request bounded
storage or event pages when a list is needed. Fetching the whole state to locate
one record adds conversion, transport and parsing work.

## Lay out state around its updates

Overwrite a stable slot for a current setting or record. Appending every old
version to a live list increases active state and makes later reads and updates
more expensive. Independently updated entities can use separate slots; fields
normally read and written together can share a record. Extra slots also carry
key and commitment overhead, so splitting every field is not always cheaper.

Calculate locally and write the intended final value once. The node coalesces
repeated slot writes, but each write still checks its value and consumes gas and
effect budgets. Keep intermediate writes when a nested call must observe them.

Use `storageDelete(key)` when the application's explicit lifecycle makes a slot
unnecessary. Null and empty values retain slots. Preserve balances, outstanding
claims, authorization and markers needed to prevent reuse. Deletes use the same
rollback and commit pipeline as writes.

## Page records and remove fields

Store independently updated entities under keys such as `records/<id>`.
`storageScan("records/", null, 20)` returns
`{ entries: [{ key, value }], next }` in UTF-8 byte order. Pass `next` as the
exclusive cursor for the next page; null means completion. This avoids retaining
and rewriting a duplicate ID list solely for enumeration.

Scans read the executing contract's current slots, including staged writes and
deletions. Stored nulls remain entries. Limits are 1–256, additionally bounded by
the chain's VM array limit, gas and a 64 KiB canonical page size. A page can be
shorter than requested; use its cursor. An entry that cannot fit with its cursor
requires a point read. Existing value-depth and VM limits apply to the page
envelope too; deeply nested entries can require point reads. Changes between
calls can change subsequent pages.

`valueDelete(record, key)` removes a field and returns the same local record.
Missing fields are harmless; other null fields remain. Persist the result with
`storageSet` when needed.

## Separate current state from history and object bytes

Retain the data needed by future execution. SDKs and dapps can derive display
labels, formatted amounts and units instead of maintaining duplicate
presentation fields on-chain. The high-level `bytes` alias remains a string;
there is no separate native byte-buffer value yet.

Events can describe completed actions without an append-only duplicate in live
contract storage. SDK `getContractEvents` and `subscribeContractEvents` read the
ordinary node's historical events. These are receipt data derived from canonical
execution; contracts cannot read them as live storage. Keep any information that
later mutations or authorization checks need in current state.

Use [native FILE storage](/developers/files/) for larger objects whose bytes need
serving. Keep their CID and required metadata in contract state. Ordinary nodes
retain, serve and replicate the archive bytes; this requires no external
custodian or special node type. The operational archive inventory still keeps
metadata per object in RAM. Reuse an existing CID for unchanged content instead
of creating unnecessary new objects.

Updating stable slots and deleting unnecessary rows reduces live state and the
work required to read, checkpoint and replay it. Freed database space can be
reused; deletion does not necessarily shrink the database file immediately.
Historical blocks, receipts and FILE objects still occupy disk. Removing
duplication improves efficiency without promising that unlimited history fits a
fixed disk. See
[storage and data authority](/protocol/storage/) for backup and recovery duties.

Source: [compiler](https://github.com/nfl0/riadchain/blob/master/tools/highlevel/compiler.ts),
[native host](https://github.com/nfl0/riadchain/blob/master/rust/riadchain-node/src/vm.rs),
[contract values](https://github.com/nfl0/riadchain/blob/master/rust/riadchain-core/src/contract_value.rs),
[SDK queries](https://github.com/nfl0/riadchain-sdk/blob/master/src/sdk/provider.ts).
