---
title: Storage and data authority
description: Separate canonical history, derived consensus state, FILE archive bytes and disposable runtime data.
---

Riadchain separates authoritative history from data that can be reconstructed and from file bytes that require an independent archive. This distinction determines what to back up and how to recover safely.

[System requirements and sizing](/node/system-requirements/) explains how these
storage classes affect disk space, active-state memory and startup work.

## Four storage classes

| Class | Examples | Recovery source |
| --- | --- | --- |
| Canonical authority | Signed `genesis.json`, `canonical/blocks.log` | A trusted, verified copy of the same history |
| Replay-derived state and query data | UTXOs, contracts, tokens, protocol version, receipts, indexes, checkpoints | Deterministic replay of canonical history |
| Archival objects | Confirmed bytes in `files/objects/<cid>` | Verified archive backup or authenticated peer bytes |
| Ephemeral work | Mempool, staged uploads, temporary spools, peer-health observations | New admission or bounded runtime recovery |

UTXOs, contracts and the active protocol version are consensus state whose authority comes from history. A checkpoint is only an accelerator for reconstructing that state.

## Signed genesis and canonical blocks

Genesis binds the network configuration and initial block to its initial validator's signature. Nodes verify its body, hash and public-key identity. Network participants must also agree on the intended artifact through a trusted channel.

The canonical log is append-only, compressed, checksummed and hash-verified. Opening and verifying it checks record framing, linkage and canonical identities. A torn tail can be handled by the node's defined recovery procedure; interior corruption fails closed. Operators should not edit records or truncate history to make a state cache appear valid.

Committed blocks record the inputs required for deterministic replay. Canonical storage errors and validated fork evidence stop mutation rather than allowing a node to continue from uncertain authority.

## Derived data remains verifiable

Receipts, events and nested call traces are persisted for queries, but they are derived from canonical execution. A missing receipt tail can be reconstructed. Historical indexes provide bounded access without requiring all blocks or receipts to remain in memory.

Checkpoints hold a compressed state snapshot at a height. Format 13 streams
bounded records from a pinned database snapshot and loads them into a new derived
database. It has no 512 MiB aggregate state-size ceiling. Startup validates record
bounds, checksums, canonical bindings and semantic invariants before replaying the
suffix. Invalid cache contents never override or shorten canonical history;
filesystem and database failures remain distinct from invalid cache data.

Historical transactions, receipts, address history and FILE provenance use
Rust-owned embedded SQLite indexes managed by the node.

## Native execution state

The native daemon keeps growing execution tables on its data filesystem: UTXOs,
contracts and slots, tokens and balances, rewards, signers, schedules, capabilities
and FILE records. Address, balance, schedule and FILE-order indexes also live in
the derived database. Queries read selected owned records and bounded pages;
storage failures remain errors rather than appearing as missing data or zero
balances.

Candidates and simulations share pinned SQLite read snapshots and retain their
changed records in small overlays. After a canonical block is synchronized, its
validated table changes publish together. A publication failure halts mutation;
restart rebuilds the derived database from verified history or a validated
checkpoint. Signed history remains the recovery authority.

This trades whole-state RAM residency for database space, WAL writes and uncached
reads. Snapshot readers can retain older WAL pages on disk until they finish.
SQLite cache targets and transaction limits do not establish a fixed process RSS
ceiling. Browser examples retain the memory backend with the same Rust consensus
rules; they do not acquire the native daemon's disk-state scaling.

## Active contract state

Contract slots retain typed values with direct integers and ordered records.
Commitments and checkpoint values use canonical tagged CBOR. Native snapshots
share a stable database view instead of copying every stored value. Repeated
writes to one slot coalesce into its final commit, and unchanged final values avoid redundant
state changes. Each operation still consumes its gas and effect budgets.

`storageDelete(key)` removes a live slot. Storing `null` keeps the slot, and a
failed execution commits neither its writes nor its deletions. Smaller live state
reduces database and checkpoint work, but deleting a slot does not erase canonical
history, historical receipts or committed FILE objects.

There is no automatic contract expiry, storage rent or total state-growth quota.
Execution and per-value limits remain safeguards; unlimited retained history
still needs growing disk capacity. Follow
[contract resource practices](/build/resource-practices/) to remove avoidable
duplication while retaining data the application needs.

## FILE metadata is not file content

Canonical FILE transactions record CIDs, sizes and optional metadata. Provenance can include several transactions and accounts referring to the same content. A CID is a content identity, not a grant of private access or exclusive ownership.

Raw bytes live outside consensus state in the native archive. Confirmed FILE
records live in the derived execution database, but the separate operational
archive inventory still keeps metadata per object in RAM. File count therefore
remains a memory-growth driver even with disk-backed consensus state.

Before mining, the producer verifies local bytes and the required peer
availability commitments. Later loss of an object is archival degradation; it
does not retroactively invalidate its block.

The FILE worker rehydrates confirmed objects through authenticated, bounded peer transfers and verifies their CID, size and transaction context before adoption. This work is independent of canonical synchronization: catching up to the chain tip does not prove archive completeness.

Every confirmed object is intended to remain available. No automatic garbage collector removes confirmed objects, and replaying blocks cannot recreate their bytes. See [FILE archive operations](/node/file-archive/) for local status and scrubbing.

## Ephemeral data and recovery

Staged FILE content, upload spools and mempool entries are pre-confirmation work. Their existence does not prove a transaction succeeded. Runtime cleanup and bounded recovery handle temporary objects under the data-directory lock.

Peer health and nonce caches are operational observations. They can affect live admission or readiness without entering historical state commitments. Missing FILE bytes and unreachable peers must remain distinct from canonical corruption.

## Back up both authority and archive

The native offline backup verifies signed genesis, canonical history and replayed state. `--files all` also includes and verifies the objects currently present in the archive; the default `--files none` is chain-only.

Keep protected key and credential backups separately. Restore into a nonexistent or empty directory, preserve any fork evidence and verify readiness and archival health afterward. [Backup and recovery](/node/backup-recovery/) provides the commands and explains why copied blocks alone are insufficient for a complete network restore.
