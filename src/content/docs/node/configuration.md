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
| `network.rpc` | Optional client RPC listener, protected bearer file and browser origin allowlist |
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
```

The bearer file contains a separately generated token with 32 to 256 visible ASCII characters. Use a mode-0600 file readable by the service account. All native RPC methods require the token. Browser origin checks are separate. Give trusted wallets and internal services the exact chain ID and genesis pin. Use HTTPS outside loopback and keep the native operator token out of public browser bundles.

### Browser origin allowlist

The wallet RPC uses Connect and Protobuf over HTTP. Chrome extensions and web
apps can call the same RPC methods as native clients. When a request carries an
`Origin` header, the node checks it against `network.rpc.allowed_origins` before
checking the bearer token. The origin identifies the browser context. The token
grants access to RPC methods, and wallet signatures authorize transactions.

The default list is empty. Omitting `allowed_origins` or setting it to `[]`
rejects all requests that carry an origin. Clients that omit the header
authenticate with the bearer token. The rule is local to each node’s client RPC
listener. Peer connections use their own machine authentication.

Add the origins you use to the existing `[network.rpc]` table. This example
includes [Riad Keychain](/apps/keychain/) and an example website. The same
Keychain entry works for every installation of its stable build.

```toml
allowed_origins = [
  "chrome-extension://nblognglcdkmbeikggjngllgbkllokfh",
  "https://dashboard.example.org",
]
```

Use up to 16 exact origins. For a website, copy its scheme, hostname and any
non-default port. Use HTTPS, or HTTP on `localhost`, `127.0.0.1` or `[::1]` for
local development. Use `chrome-extension://` followed by the extension ID for
Chrome extensions. Entries are bare origins, with no trailing slash, path,
query, fragment or wildcard.

Check the updated configuration and restart that node. For a packaged
installation, run the check as the service account, then restart the service
or use [Manager's Maintenance tab](/appliances/everyday-use/).

```sh
sudo -u riadchain riadchain-cli --config /etc/riadchain/node.toml config check
sudo systemctl restart riadchaind.service
sudo -u riadchain riadchain-cli --config /etc/riadchain/node.toml status
```

### Diagnose browser access

If a browser reports a connection error, check the origin against the actual RPC
endpoint. This preflight uses an example address and carries no token. Substitute
your RPC URL and the calling app's exact origin.

```sh
curl -i -X OPTIONS \
  -H 'Origin: https://dashboard.example.org' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type,connect-protocol-version' \
  https://rpc.example.org/riadchain.v1.NetworkService/GetStatus
```

| Response | Meaning |
| --- | --- |
| `204 No Content` with a matching `Access-Control-Allow-Origin` | The node accepted the origin for preflight. Check the actual RPC call for authentication and readiness. |
| HTTP `403` with `browser origin is not allowed` | Check the exact origin, the active node configuration and whether the node restarted. |
| HTTP `401` on the actual RPC call | The request reached the token check. Verify the RPC token supplied to the client. |

If an HTTPS proxy fronts the node, preserve the `Origin` and `Authorization`
headers and forward `OPTIONS` requests and CORS response headers. Keep the bearer token in the wallet or
authorized service. See [Connect's browser CORS reference](https://connectrpc.com/docs/cors/).

## Limits and storage planning

Genesis parameters bound transactions, blocks, FILE size and VM execution. Transport-specific limits also bound chunk size, read concurrency and request duration. Confirmed history is kept on every node. [Checkpoints and the recent execution cache](/node/operations/#read-recent-and-historical-execution) accelerate reads without replacing the signed log. Keep [verified FILE backups](/node/backup-recovery/) on independent storage.
