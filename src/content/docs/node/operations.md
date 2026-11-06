---
title: Operate and enroll nodes
description: Monitor readiness, enroll authenticated followers and respond to faults without rewriting chain history.
---

For a private home or company network, run one active producer and, where practical, at least one follower on a separate machine and storage device. A follower independently verifies blocks and can hold another copy of confirmed FILE objects. Eligibility to take over is governed by [succession](/protocol/succession/).

Examples use `riadchain-cli` for operator commands and `riadchaind` for startup. With a source build, use the matching executable under `./target/release/`.

Manager is optional. You can configure, run, monitor, update and recover a node
using its local tools without the appliance service or phone app. On Debian,
installing `riadchain-node` does not require `riadchain-appliance`; ordinary
systemd start/stop commands and the node's own safety checks work independently.

## Monitor readiness and convergence

Use the actual node responses, not the presence of a process, to decide whether a node is usable:

```sh
riadchain-cli --config ./node.toml healthcheck
riadchain-cli --config ./node.toml status
```

| Surface | What to inspect |
| --- | --- |
| `/health` or `Health.Check` | Serving status, readiness and fault indications |
| `NodeService.GetStatus` | Chain identity, tip, role, producer and upgrade state |
| `NodeService.GetSyncHealth` | Peer reachability, comparison availability, catch-up status and lag |
| `NodeService.GetOperatorHealth` | Consolidated readiness, canonical storage, derived data, FILE archive and alarms |
| `/metrics` | Authenticated Prometheus measurements for trends and alerts |

The SDK provides corresponding typed methods, including `getOperatorHealth()`. `Health.Watch` sends one framed snapshot and closes; it is not a continuous alert stream. Poll health for monitoring. The authenticated `/events` stream is a separate, resumable contract-event surface.

Alert on persistent lag, lost peer contact, a stalled tip, a fork alarm, canonical storage errors, missing FILE bytes and low disk space. Interpret missing comparison data as unknown: a node cannot prove that it is caught up to peers it cannot reach. A healthy active validator may remain serving during a peer outage, so serving status alone does not prove replication health.

Track resource trends against active-state counts and workload. [System
requirements and sizing](/node/system-requirements/) explains the starting
allocation, host-versus-guest memory and how history affects restart and storage
capacity.

Run full integrity verification at an interval appropriate to the archive size. `StorageService.VerifyIntegrity` reads durable history and FILE objects; it is intentionally I/O intensive and needs authentication. A denied request is not a successful integrity result.

### Monitor native state storage

The native daemon keeps growing execution tables and indexes in derived SQLite
databases on its data filesystem. Snapshots share a stable database view and
transactions retain their changed records, so active payload growth does not
require the same growth in RAM. Database caches, current execution and requests,
allocator overhead and the per-object FILE archive inventory still use memory.

Monitor free disk space and I/O pressure alongside memory. State publication adds
WAL writes, uncached reads need disk access, and an older checkpoint or simulation
reader can retain WAL pages until it closes. A database is reconstructed from
verified history or a validated checkpoint at startup; it does not replace signed
history. A failure publishing state after a durable block stops mutation, and the
original transaction may already be committed. Reconcile its original ID before
retrying any action.

Offline replay and backup verification use separate temporary databases. Set
`TMPDIR` to an existing private directory on a disk-backed filesystem for these
CLI invocations when the system temporary directory is memory-backed. A tmpfs
scratch directory consumes RAM as replayed state grows. Preserve the original
history and FILE archive throughout verification.

### A node stopped for low memory

The Linux daemon checks available RAM and visible cgroup-v2 limits, keeping a
128 MiB reserve for shutdown. If headroom reaches that reserve, it stops accepting
work, drains active storage work and exits with status 75. The packaged service
leaves it stopped instead of repeatedly restarting it.

```sh
sudo systemctl status riadchaind.service
sudo journalctl -u riadchaind.service -b --no-pager -n 100
free -h
sudo systemctl show riadchaind.service -p MemoryMax -p ExecMainStatus -p NRestarts
```

The log identifies the limiting host or cgroup counter. The 128 MiB reserve is
available headroom, not a preallocated buffer. Increase the VM/machine RAM or its
service/container limit, then explicitly start the service:

```sh
sudo systemctl start riadchaind.service
```

On managed appliances, Manager remains a separate service and shows
**Stopped: insufficient RAM**. After increasing memory, review **Start node** in
[Maintenance](/appliances/everyday-use/#check-machines-in-manager). The start job
binds the existing signed network and retains its data; it does not initialize a
new chain. Completion requires the original job and healthy original network.

Restarting with the same insufficient resources can stop it again. Native active
UTXOs and contract rows may grow naturally on disk; execution working data, caches
and FILE archive inventory still need RAM. This protection adds no state cap or
fixed RSS guarantee. Sudden allocations or a kernel OOM kill can still interrupt
draining.

## Enroll a follower

Enrollment shares public chain identity and endpoints, not validator secrets. The issuer is a bootstrap peer you explicitly trust out of band; it need not be the original genesis signer or a funded producer. First create a distinct key for the joining machine and obtain its account address. Agree on the issuer's identity and genesis hash over a trusted channel within your home or company.

Stop the issuing node before using its data directory for this command. Replace the joining-account placeholder and endpoint with your own values:

```sh
RIAD_JOINING_ACCOUNT="<joining machine's lowercase account address>"

riadchain-cli peer invite \
  --data-dir /var/lib/riadchain \
  --key-path /secure/issuer-node.key \
  --joining-address "$RIAD_JOINING_ACCOUNT" \
  --endpoint http://validator.home:8545 \
  --output ./follower.invite.json
```

Add the reported joining address to the issuer's TOML `p2p_allowed_addresses`, then transfer the invitation over the trusted channel. On the joining machine:

```sh
riadchain-cli peer verify --bundle ./follower.invite.json

riadchain-cli peer join \
  --bundle ./follower.invite.json \
  --data-dir /var/lib/riadchain-follower \
  --key-path /secure/follower-node.key
```

Join requires the key controlling the invited address and a nonexistent or empty destination. It atomically installs public genesis and invitation material. Verify the reported chain ID, hash and issuer before starting the daemon.

Configure the follower's peer allowlist for the issuer, its P2P shared secret and its own client RPC token through your protected runtime configuration. Start it using the endpoint from the invitation:

```toml
# follower-node.toml; replace the issuer account with its verified address.
data_dir = "/var/lib/riadchain-follower"
genesis_file = "/var/lib/riadchain-follower/genesis.json"
key_file = "/secure/follower-node.key"
listen = "127.0.0.1:8545"
peers = ["http://validator.home:8545"]
p2p_allowed_addresses = ["<verified issuer account>"]
p2p_shared_secret_file = "/secure/p2p-secret"
# rpc_token_file = "/secure/rpc-token"
```

```sh
riadchain-cli config check --config ./follower-node.toml
riadchaind --config ./follower-node.toml
```

Peer invitations do not change funded eligibility or modify allowlists automatically. In particular, creating an invitation does not admit the joining address to the issuer's peer ACL; the issuer's operator must do that separately. A potential successor needs its own key, the minimum aggregate confirmed spendable balance and verified readiness. A loopback-only follower is suitable for local checks; configure an authenticated reachable listener when other machines need to request its FILE objects.

## Handle a non-serving node

Inspect health and logs first. Distinguish a reachability or clock problem from an archival problem and from a canonical storage or fork alarm.

For missing FILE content, preserve canonical data and repair the archive through verified peer hydration or a [file-inclusive backup](/node/file-archive/). Missing bytes do not authorize replacing valid chain history.

For canonical corruption or validated equivocation, preserve the entire data directory and diagnostic evidence. The daemon fail-stops mutation and production. Restarting or using `--recover` is not a fork-resolution procedure, and removing an alarm file is not a safe recovery. Establish the trusted history out of band, then use a [verified restore](/node/backup-recovery/) into a new directory.

## Choose manual or automatic recovery

An archive node below the funding threshold does not produce blocks. Fund its wallet before an outage to enable automatic succession when it is ready. Otherwise retain an independent genesis-funded rescue key for operator-controlled restart on a replacement machine.

If every producer is down, a transfer to an empty recovery wallet cannot confirm. Use an already-funded identity and [verify isolated recovery](/node/backup-recovery/#resume-production-with-unavailable-peers). Never run two machines with the same production key.

## Plan software changes

Participants agree on a numeric protocol ID and activation height outside the chain. Install a release implementing those rules and reference the same agreed JSON schedule through `protocol_upgrades_file` in native TOML on every producer and recovery machine. Software package versions remain separate release metadata; protocols 1, 2 and 3 are implemented.

Back up canonical history, FILE objects and the public schedule, verify release artifacts, then upgrade followers and the producer before activation. `NodeService.GetProtocolInfo` reports whether the installed node supports the next block's protocol. Unknown rules stop production and acceptance at activation; changing a historical schedule fails validation. See [protocol upgrades](/protocol/upgrades/).
