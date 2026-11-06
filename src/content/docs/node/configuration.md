---
title: Configure a node
description: Use native node.toml for local settings while keeping signed network identity and credentials separate.
---

Signed genesis defines the chain. Each machine's `node.toml` defines where its daemon stores data, listens and connects. Use the [quickstart](/node/quickstart/) for a new network; joining an existing one requires its exact signed artifact.

## Local runtime settings

Create a template with `riadchain-cli config init --output ./node.toml`, edit it, then validate its structure with `riadchain-cli config check --config ./node.toml`. It also validates already-existing referenced artifacts, while allowing missing bootstrap files. It does not replay canonical history or establish runtime readiness. Start the daemon with:

```sh
riadchaind --config ./node.toml
```

Without an explicit path, the daemon checks `./node.toml`, then `/etc/riadchain/node.toml`. It accepts only `--config`, `--recover`, help and version options. Individual startup flags and environment variables are not configuration sources. The daemon rejects known obsolete startup variables without printing their values.

```toml
data_dir = "./data/node"
genesis_file = "./genesis.json"
key_file = "./keys/node.key"
listen = "127.0.0.1:8545"
peers = []
peer_sync_interval_ms = 500
checkpoint_interval_blocks = 2048
p2p_allowed_addresses = []
# rpc_token_file = "./secrets/rpc-token"
# p2p_shared_secret_file = "./secrets/p2p-secret"
# protocol_upgrades_file = "./upgrades.json"
```

Configuration is strict UTF-8 TOML, limited to 64 KiB; unknown fields are rejected. Relative paths resolve against the directory containing `node.toml`. Public peer addresses and endpoints may appear in TOML. Private keys, RPC tokens and P2P secrets must live in protected files referenced by their paths.

| Setting | Purpose |
| --- | --- |
| `data_dir` | Exclusive persistent chain and archive directory |
| `genesis_file` | Exact signed network artifact |
| `key_file` | Protected file containing the node's 64-hex secp256k1 key |
| `production_owner` | Optional funded owner represented by an authorized operational key |
| `listen` | Listener address; defaults to `127.0.0.1:8545` |
| `peers` | Array of authenticated peer HTTP endpoints |
| `peer_sync_interval_ms` | Local peer polling; default `500`, minimum `100` |
| `checkpoint_interval_blocks` | Checkpoint cadence; default `2048`, `0` disables |
| `rpc_token_file` | Protected client bearer-token file |
| `p2p_allowed_addresses` | Array of admitted public peer account addresses |
| `p2p_shared_secret_file` | Protected shared peer HMAC-secret file |
| `protocol_upgrades_file` | Participant-agreed public JSON activation schedule |

Credential files must be regular UTF-8 files, at most 4,096 bytes. Restrict them to mode `600` on Unix and keep them out of source control, images and support bundles. A template does not create signing keys or authenticate a network for you.

Production follows the owner's aggregate confirmed spendable balance, key authorization, leadership and readiness automatically. An unfunded owner or unauthorized key remains an archive replica; there are no role or mining switches. Unclaimed rewards do not count toward eligibility.

For limited machine keys, set `production_owner = "<funded owner account>"` at the top level and reference the operational key in `key_file`. The binding must already exist in signed genesis or a confirmed owner transaction; local configuration grants no authority. The owner retains spending, reward claims and direct signing for deliberate recovery. Peer admission still uses the actual machine key. [Succession](/protocol/succession/#owner-and-machine-keys) explains the boundary.

`--recover` authorizes verified cold recovery with unavailable peers. Fence the previous producer and isolate the recovery machine first; [recovery](/node/backup-recovery/#resume-production-with-unavailable-peers) explains its history and FILE checks. It does not resolve partitions or clear fork alarms.

## Dedicated packaged storage

The packaged service requires a pre-existing writable mount at
`/var/lib/riadchain`, defined by `var-lib-riadchain.mount` before startup. Select
one storage identity. [Direct Linux installation](/node/direct-install/) uses:

```toml
[storage]
kind = "zfs"
dataset = "riadchain/data"
guid = "12345678901234567890" # replace with the actual quoted decimal GUID
```

The [Proxmox VM route](/node/proxmox/) uses the dedicated guest filesystem:

```toml
[storage]
kind = "ext4"
uuid = "12345678-1234-1234-1234-123456789abc" # replace with the actual lowercase UUID
```

Set top-level `data_dir = "/var/lib/riadchain"` before either section. The strict
configuration accepts exactly one kind; ZFS fields and ext4 fields cannot be
mixed. The guard checks actual identity, exact mount root and writability before
history can open. It rejects symlinked ancestors, descendant mounts and ext4
subdirectory bind mounts or the OS root device. Missing storage cannot fall back to the boot disk.

`riadchain-cli --config /etc/riadchain/node.toml config check-storage` performs the
read-only check; run it as the `riadchain` service user. The daemon repeats it,
and systemd binds service lifetime to the mount. A structural `config check`
does not replace storage verification. Recreated datasets or reformatted
filesystems need deliberate identity rebinding after verification. Packages and
Manager never format disks. A manual native deployment can omit this optional
section; the packaged appliance service cannot.

## Network identity and genesis

For a new network only, an optional section supplies bootstrap inputs to `riadchain-cli genesis init --config ./node.toml`:

```toml
[genesis]
chain_id = "home-or-company-network"
timestamp_ms = 1750000000000 # replace with your agreed timestamp
network_mode = "private"
file_min_peer_acks = 1 # choose 0 for an explicitly standalone archive
# initial_validator = "<lowercase initial owner account controlling the genesis signing key>"
# allocations_file = "./allocations.json"
# production_signers_file = "./production-signers.json"
# succession_timeout_ms = 120000
```

If `initial_validator` is omitted, initialization derives it from the configured key. Public allocations use `[{ "address": "<account>", "amount_satoshis": "<integer base units>" }]`. Include independently backed-up primary and rescue identities before signing; never include private keys or phrases.

`production_signers_file` is a public JSON object mapping lowercase owner accounts to distinct operational signer accounts, bounded to 64 KiB. The signed map permits up to 4096 bindings. Genesis requires the initial owner's signature. When `key_file` references an operational key, sign with `riadchain-cli genesis init --config ./node.toml --key-path /protected/owner.key`; do not copy that owner key onto the appliance for routine operation.

`file_min_peer_acks` sets the number of verified peer acknowledgements needed to publish a FILE: `0` through `8`, defaulting to `1` for private networks and `0` for regtest. For a standalone private machine, explicitly choose `0` before signing genesis. Local CID/size verification still applies; this removes the independent peer-copy requirement. Mirrored drives within one machine do not count as peer acknowledgements. For a nonzero policy, enroll enough reachable peers before publishing files.

The section is creation input, not a runtime override. Genesis binds chain identity, mode, cadence, initial producer, allocations and bounded parameters. Every node verifies its body, hash and signature. An existing data directory must agree with the supplied artifact. Local edits cannot change established history.

## Authenticate client and peer traffic

One listener carries typed Connect/protobuf client and peer RPCs. The retained HTTP surfaces include `/health`, `/metrics`, `/events` and bounded FILE previews; ordinary queries use Connect services.

Configure `rpc_token_file` before exposing a listener beyond loopback. The daemon refuses unauthenticated non-loopback exposure. Clients supply that token as a bearer credential through the SDK or a trusted proxy. Do not embed an operator token in a public browser bundle.

When configured, the token protects all client queries and submissions, including explorer data, contract views, simulation, FILE previews, metrics and event subscriptions. Only CORS preflight and the minimal `/health` response (`status` and `ready`) are public. Keep detailed status checks on authenticated RPCs. A credential-free loopback listener must never be forwarded publicly; pinned read sessions require a configured token even on loopback.

Peer authentication is separate: `p2p_allowed_addresses` admits public identities, and an optional `p2p_shared_secret_file` adds the shared HMAC secret. Requests carry timestamped secp256k1 authentication and replay protection. Native `peers` accepts HTTP and HTTPS origins; HTTPS validates the server certificate. Keep plaintext HTTP on trusted private links or encrypted tunnels. The native listener can sit behind a trusted HTTPS proxy; that proxy can observe the traffic. Use distinct node keys and trusted enrollment; a peer invitation does not update either machine's allowlist automatically.

## Limits and storage planning

Genesis parameters bound transactions, blocks, FILE size, gas and VM resources. Local transport also bounds request bodies, responses, uploads and concurrent work. A proxy cannot override those limits.

Read actual parameters when building transactions. FILE fees are paid once, while confirmed bytes remain archival obligations. Plan continued storage growth and keep [file-inclusive backups](/node/backup-recovery/#choose-what-the-backup-contains). Checkpoints accelerate startup and do not replace canonical history or archive backups.

## Private and regtest modes

Signed genesis selects `private` with 10,000 ms blocks or `regtest` with 100 ms blocks. Set `network_mode = "regtest"` only when creating a separate development network, or use the CLI's one-off `genesis init --regtest` option. The daemon loads the artifact's authenticated mode; it has no mode override. Keep separate genesis, keys and data for [regtest](/node/regtest/).
