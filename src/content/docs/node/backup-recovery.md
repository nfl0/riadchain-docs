---
title: Back up and recover
description: Create offline verified backups, preserve FILE bytes and restore into a clean directory.
---

A Riadchain backup protects two assets: signed canonical chain history and confirmed FILE bytes. History can reconstruct consensus state; it cannot recreate missing file contents.

The native backup commands operate offline and take the node's exclusive data-directory lock. Stop the daemon before creating a backup or verifying a data directory. The examples assume `riadchain-cli` and `riadchaind` are in your `PATH`.

## Choose what the backup contains

`--files none` is the default. It captures canonical authority without file bytes and reports incomplete archive recovery coverage. Use explicit `--files all` when preserving the archive:

```sh
riadchain-cli backup create \
  --data-dir /var/lib/riadchain \
  --output /mnt/riadchain-backups/riadchain-snapshot \
  --files all
```

Choose a new output directory for each backup. `--files all` includes and verifies the objects currently present under `files/objects/` and requires every committed FILE at the included chain tip to be present with its exact size. A missing or corrupt committed object rejects creation before the final backup directory is installed. Inspect [archive health](/node/file-archive/) as well as backup verification.

Keep the operator-agreed protocol schedule in your recovery kit. Pass `--protocol-upgrades /path/upgrades.json` to backup create, verify, restore and replay verify when the chain uses it, or use `--config <node.toml>` with the same `protocol_upgrades_file`; the archive does not automatically include that external file.

The backup contains a versioned manifest, signed `genesis.json`, `canonical/blocks.log`, any durable fork evidence and, when selected, FILE objects. It deliberately omits derived receipts, indexes, checkpoints, staged uploads and temporary data.

Keys, RPC tokens and other credentials are not part of this chain backup. Keep separate protected recovery copies and document how to restore the node's configuration without publishing those secrets.

## Verify before relying on it

```sh
riadchain-cli backup verify \
  --backup /mnt/riadchain-backups/riadchain-snapshot
```

Verification checks signed genesis, the strict archive layout, canonical framing and checksums, block hashes and continuity, fork evidence and included FILE CIDs. It then replays the blocks, compares the recorded tip and state commitment, and independently recomputes committed FILE coverage. An all-files backup cannot pass by editing its inventory or coverage to hide a missing committed object. Verification leaves the backup unchanged.

The manifest's `fileArchive.coverage` reports expected and verified committed object/byte totals, with `complete` true only for an all-files backup covering every committed FILE. Additional valid local objects may be included, but do not increase committed coverage. A chain-only backup reports zero verified FILE bytes and `complete: false`; successful verification of that backup does not mean your documents or photos are protected.

Missing committed objects and invalid history reject an all-files backup; verification does not repair or truncate its copied log. Keep another copy on a separate storage device or failure domain. Periodically test a restore rather than assuming a copied directory is sufficient evidence of recoverability.

## Restore to a new directory

Restore accepts a nonexistent or completely empty destination. It never merges with an existing chain directory:

```sh
riadchain-cli backup restore \
  --backup /mnt/riadchain-backups/riadchain-snapshot \
  --data-dir /var/lib/riadchain-restored

riadchain-cli replay verify \
  --data-dir /var/lib/riadchain-restored
```

The restore command verifies the source, stages the destination beside its final path, replays it, verifies included objects, synchronizes the files and installs it atomically. Keep the original damaged or suspect directory for investigation instead of overwriting it.

Prepare a restored-node TOML configuration with the matching genesis artifact, new data path, correct protected key and original peer/schedule settings. Start it through `riadchaind --config <path>`. Production eligibility follows its confirmed spendable balance automatically. Check its chain ID, tip, health and peer convergence. Derived receipts, indexes and checkpoints can be rebuilt from canonical history; allow for that work during recovery.

## Restore a wallet identity

Use the offline native command to turn a backed-up seed into a new node key file. Put the phrase in a protected local UTF-8 file using your trusted editor; never put it in command arguments, environment variables, shell history or support messages.

```sh
chmod 600 /protected/phrase.txt
RIAD_RECOVERY_ACCOUNT="<backed-up lowercase account address>"

riadchain-cli wallet restore \
  --mnemonic-file /protected/phrase.txt \
  --expected-address "$RIAD_RECOVERY_ACCOUNT" \
  --key-path /secure/surviving-funded-node.key
```

The command validates the English BIP39 checksum and defaults to the SDK path `m/44'/60'/0'/0/0`. Supply `--account-index <index>` for another account under that prefix. For a BIP39 passphrase, add `--passphrase-file /protected/passphrase.txt` and restrict that file to mode `600` too. Its exact content is used, including any newline; match your original passphrase precisely.

Each secret file is limited to 4,096 bytes. Recovery refuses an address mismatch or an existing output key, writes a protected key file, and prints only public address/path metadata. Check those values against your recovery record before using the key.

This recovers identity, not funding, chain history or FILE bytes. Restore the signed genesis, canonical history and archive separately using the verified backup workflow above. Preserve the original seed securely after use and remove temporary plaintext copies through your local custody procedure.

## Resume production with unavailable peers

After a cold restart, a node with configured peers normally needs successful authenticated synchronization before succession. If those machines are unavailable, an operator may explicitly authorize isolated recovery:

```toml
# recovery-node.toml
data_dir = "/var/lib/riadchain-restored"
genesis_file = "/var/lib/riadchain-restored/genesis.json"
key_file = "/secure/surviving-funded-node.key"
listen = "127.0.0.1:8545"
peers = ["http://unavailable-peer.home:8545"]
# Retain the agreed allowlist, protected P2P credentials and protocol schedule.
```

```sh
riadchaind --config ./recovery-node.toml --recover
```

Before running this, fence the old producer and isolate the recovery machine. Check the intended signed network and latest recoverable history; an unreachable peer may still be producing elsewhere. The option is not automatic partition resolution.

Startup independently replays signed genesis and canonical blocks, compares the resulting tip/state, and verifies every committed FILE's CID and size. Checkpoints are not recovery authority. Missing objects, invalid history and durable fork alarms block recovery. These checks can take time for a large archive.

You still need a surviving funded signing identity. Keep at least two independent genesis-funded wallet seeds and a distinct seed per recovery machine. A previously unfunded key cannot be funded while the entire chain is stalled; restore a funded identity first. Seed phrases restore keys, while verified backups and replicas restore history and files. Use `wallet restore` above to derive the protected raw key file consumed by native startup.

## Fork evidence survives recovery

If a backup includes `fork-alarm.json`, the restored node retains the fail-stop condition. A verified backup proves the integrity of its recorded evidence and history; it is not permission to erase evidence or silently choose between conflicting histories.

An operator must decide how to resolve a validated fork using the home or company's agreed recovery process. Preserve evidence and compare independently verified histories before changing operational trust anchors.

## Recover FILE availability

A chain-only backup can restore valid consensus state while leaving the archive incomplete. Confirmed references will still exist, but the bytes must come from an independently verified archive or authenticated peers. [FILE archive operations](/node/file-archive/) explain status, scrubbing and rehydration.
