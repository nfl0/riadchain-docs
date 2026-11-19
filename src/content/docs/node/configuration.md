---
title: Configure a node
description: Set native node.toml paths, peer routes and RPC access while keeping signed network identity and credentials separate.
---

The signed genesis defines the chain and its rules. A machine's `node.toml` names its prepared directory, trusted genesis pin and local network routes. Use the [quickstart](/node/quickstart/) to prepare a new network.

## Local runtime settings

Start with this minimal standalone configuration. Replace the genesis pin with the full 96-character lowercase hexadecimal hash reported by the trusted setup:

```toml
data_dir = "./node-a"

[network]
genesis = "replace-with-the-full-genesis-pin"
peers = []
```

```sh
riadchain-cli --config ./node.toml config check
riadchaind --config ./node.toml
```

Without an explicit path, the daemon checks `./node.toml`, then `/etc/riadchain/node.toml`. Use `--config` to select a file. Runtime flags and environment variables cannot override the signed rules. Configuration is strict TOML and relative paths resolve against the configuration file's directory.

| Setting | Purpose |
| --- | --- |
| `data_dir` | Prepared directory with this machine's credentials, complete signed history and FILE archive |
| `network.genesis` | Full trusted genesis hash, independently checked against this machine's prepared record |
| `network.peers` | Exact authenticated peer routes. Use `[]` for an approved standalone setup |
| `network.rpc` | Optional authenticated client listener and protected bearer file |
| `storage` | Pinned filesystem identity for packaged deployments |

Keep credential files and the RPC token outside source control and restrict access to the node service account. Configure peer routes using the enrolled account and endpoints described in [peer enrollment](/node/operations/#enroll-a-follower).

## Dedicated packaged storage

The packaged service requires a pre-existing writable mount at `/var/lib/riadchain`, defined by `var-lib-riadchain.mount` before startup. Set `data_dir = "/var/lib/riadchain"` and keep the required `[network]` section. A [direct Debian installation](/node/direct-install/) can use ZFS:

```toml
[storage]
kind = "zfs"
dataset = "riadchain/data"
guid = "12345678901234567890" # replace with the actual quoted decimal GUID
```

A [Proxmox VM](/node/proxmox/) uses its dedicated guest filesystem:

```toml
[storage]
kind = "ext4"
uuid = "12345678-1234-1234-1234-123456789abc" # replace with the actual UUID
```

Check the local mount before startup:

```sh
sudo -u riadchain riadchain-cli --config /etc/riadchain/node.toml config check-storage
```

The guard verifies the filesystem identity, exact mount root and writability. Systemd binds the service lifetime to that mount. Missing storage cannot fall back to the boot disk. Recreating it changes its identity and requires a separately verified restore. Packages and Manager do not format a disk.

## Network identity and genesis

Set funding and consensus parameters when preparing the signed genesis. `riadchain-cli protocol capabilities` reports the installed binary's default parameters and supported rule IDs. Use `riadchain-cli init --help` for native setup options. Manager and the Android wallet use a separate [signed setup workflow](/appliances/first-network/).

An existing directory must match the configured genesis pin. Editing TOML cannot change the original allocations, the one-hour default succession timeout configured at genesis, the FILE acknowledgement policy or historical blocks.

## Authenticate client and peer traffic

Peers use dedicated, mutually authenticated connections established from the machine identity prepared for each peer. Keep them on a private link or protected tunnel. Enable optional unary Connect/protobuf client RPC as follows:

```toml
[network.rpc]
listen = "127.0.0.1:8545"
token_file = "./secrets/wallet-rpc-token"
# Need this only for clients that send Origin:
# allowed_origins = ["chrome-extension://your-installed-extension-id"]
```

The bearer file contains a separately generated token with 32 to 256 visible ASCII characters. Use a mode-0600 file readable by the service account. All native RPC methods require the token. Browser origin checks are separate. Give trusted wallets and internal services the exact chain ID and genesis pin. Use HTTPS outside loopback and keep the native operator token out of public browser bundles.

## Limits and storage planning

Genesis parameters bound transactions, blocks, FILE size and VM execution. Transport-specific limits also bound chunk size, read concurrency and request duration. Confirmed history is kept on every node. [Checkpoints and the recent execution cache](/node/operations/#read-recent-and-historical-execution) accelerate reads without replacing the signed log. Keep [verified FILE backups](/node/backup-recovery/) on independent storage.
