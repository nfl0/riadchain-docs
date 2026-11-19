---
title: Back up and recover
description: Verify complete signed history and active FILE bytes, then restore the original node identity to a new location.
---

Keep verified backups outside the node's storage. They contain the complete signed history and bytes for active FILE references. The machine credentials and client RPC token require separate protected copies.

## Choose what the backup contains

Stop the daemon before inspecting or backing up its data. Run these commands as the owner of that data with a protected backup destination:

```sh
riadchain-cli --config /etc/riadchain/node.toml inspect
riadchain-cli --config /etc/riadchain/node.toml backup /backups/riadchain-new
```

`inspect --height <height>` selects a signed block for inspection. The backup contains `history.log`, a manifest and verified active FILE bytes. Derived checkpoints, indexes, staged uploads and credentials are outside it. The backup fails if required bytes are missing or signed history is invalid. Retain the verified tip height and full block hash independently so that you can identify older backups.

Save the machine's original `node.json`, `peer.seed` and `producer.seed` separately. Retain the public genesis pin and local storage and network settings. Store any RPC token with your other protected service credentials.

## Verify before relying on it

Set `GENESIS_PIN` to the full 96-character hash from your trusted setup record.

```sh
riadchain-cli verify-backup /backups/riadchain-new --genesis "$GENESIS_PIN"
```

Verification checks canonical signed history and the CID and size of every required object against its replayed state. It does not modify the input backup. Verify a second copy on an independent device and periodically rehearse restoration.

## Restore to a new directory

Stop and fence the original machine before starting a recovered copy with the same identity. Supply its separate credential directory and an unused output path:

```sh
riadchain-cli restore /backups/riadchain-new /private/original-node /restore/new-node
```

For a node that has only ever started standalone, check `standaloneBootstrap` in the backup verification report and add `--standalone` to recover that same authorization. A producer that has already started with peers needs its paired routes even when restoring a backup made earlier.

Provision the resulting directory on the intended pinned mount. Restore reviewed network settings, ensure the storage identity matches the new volume and start the daemon. Check the original ordinary block hash, readiness, synchronization and FILE content before resuming application writes.

## Restore a wallet identity

Recover the account with the trusted wallet that created its recovery phrase. For rotated keys, keep the original stable address and the recovery record for its current signing authority. The wallet phrase recovers authority over an account. A replacement machine still needs its own original node credentials, verified signed history and FILE bytes.

## Resume production with unavailable peers

A peer-configured node normally needs successful authenticated startup synchronization. To replace a permanently unavailable node, fence it first. Retain an ordinary block's height and full hash that you independently observed. Back up the surviving peer and prepare a protected directory containing its public `node.json`.

```sh
riadchain-cli restore-from-peer /backups/survivor /private/lost-node /restore/new-node \
  --donor-identity /private/survivor-public \
  --confirmed-height "$LAST_CONFIRMED_HEIGHT" --confirmed-hash "$LAST_CONFIRMED_HASH"
```

The command verifies both machine bindings and requires that exact ordinary block in the surviving history. Install and start the restored node with its paired routes and verify synchronization. For ordinary succession after an outage, an enrolled successor needs a previously confirmed qualifying balance and a fresh authenticated startup sync. An offline network cannot confirm a transfer to fund a successor.

## Preserve conflict evidence

Normal backup refuses an unresolved ordinary-branch conflict. A single-branch backup would omit competing signed history. Preserve both stopped nodes' history logs and FILE archives and compare them through the network's agreed recovery process.

## Recover FILE availability

Canonical history only contains the commitments to file bytes. Recover missing required content from an authenticated peer or a verified backup. See [FILE archive operations](/node/file-archive/) for verification and retirement.
