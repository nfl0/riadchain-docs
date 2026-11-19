---
title: Operate a network
description: Monitor the native node, read signed history, connect a reserved peer and plan maintenance.
---

Use `riadchaind` for startup and `riadchain-cli` for local operations. Android Manager is optional. Installing the Debian node package alone is enough to run and monitor the daemon through systemd and the native tools.

## Monitor readiness and convergence

Once [authenticated RPC is configured](/node/configuration/#authenticate-client-and-peer-traffic), use:

```sh
riadchain-cli --config ./node.toml status
riadchain-cli --config ./node.toml healthcheck
```

The CLI checks the pinned chain. `NetworkService.GetStatus` and SDK `NetworkClient.getStatus()` report height, readiness, provisional succession state, archive verification and production information. Check for advancing ordinary blocks. Compare each peer's signed block hash at the same height to verify convergence. An unreachable peer's condition remains unknown.

For a packaged node, inspect recent service logs and storage when status is unavailable:

```sh
systemctl status riadchaind.service --no-pager
journalctl -u riadchaind.service -n 80 --no-pager
df -h /var/lib/riadchain
```

Alert on persistent lag, stalled production, archive verification failures and low disk space. [Sizing guidance](/node/system-requirements/) explains why startup, verification and historical reads can need additional memory and I/O.

## Read recent and historical execution

Every node retains the full signed history. Checkpoints, indexes and cached execution results are derived from it. Applications and explorers use the same authenticated RPC:

| Native RPC | What it serves |
| --- | --- |
| `NetworkService.GetBlock` | Signed block data and a bounded transaction page from the canonical log |
| `NetworkService.GetBlockExecution` | Receipts from current execution or a recent in-memory cache, with older or oversized blocks served by replay |
| `NetworkService.ListAccountTransactions` | Indexed, confirmed account history, newest first and tied to a signed anchor |
| `NetworkService.ListEvents` | Recent contract events by default, with explicit anchored historical ranges |

From node package revision 61, the recent receipt cache defaults to a
10,000-block height window and 128 MiB of estimated retained receipt memory.
The memory cap can shorten that window. The node serves the current tip’s
results directly from execution and replays signed history on cache misses.
Configure the limits under
[`network.rpc`](/node/configuration/#receipt-cache).

The separate recent-event cache holds up to 256 blocks and 8 MiB. The node
rebuilds both caches from verified signed history at startup and after a
succession branch replacement.

RPC-enabled nodes attempt a bounded state checkpoint at ordinary block heights divisible by 10,000. They retain up to two checkpoints of at most 64 MiB each. Historical reads start from the closest verified checkpoint preceding the requested range, or from genesis if none is available. The node chooses this starting point automatically. A wide historical event range can exceed the read deadline.

For older events, the SDK's `listEvents` supports `historical: true` and an exclusive `beforeHeight` on the same signed anchor. Omit `fromHeight` on the first page and the node chooses its lower bound. For a subsequent page, pass the returned anchor and `fromHeight` with its continuation offset. The field identifies the event range, while the node selects the checkpoint. Refresh a recent query if its page ages out of the cache. See the [RPC reference](/developers/rpc/).

## Enroll a follower

Each node needs its own original credential directory and a matching signed genesis pin. With native setup, [reserve a second machine](/node/quickstart/) before first startup. A previously prepared but unfunded peer can sync, verify history and serve FILEs without RDC. Funding changes its production eligibility, independently of its peer connection.

Provision the reserved machine's credentials and dedicated data mount. Record the first node's latest ordinary signed block, create a verified backup and stop the node before modifying routes. On each machine use its peer's enrolled account, its own listener and the peer's reachable endpoint. Replace `peers = []` with an entry such as:

```toml
[[network.peers]]
account = "riad1..." # replace with the peer's enrolled public account
listen = "10.10.0.10:5317"
remote = "10.10.0.11:5317"
```

The other machine swaps the two endpoints and uses the first machine's account. On a network with several peer associations, give each its own listener port. Validate both configurations and start the nodes. Check the recorded ordinary block on both, compare the original confirmed transaction receipts and verify that each can serve the same known FILE bytes.

First startup with peer routes retires the producer's standalone bootstrap permission. Keep separate verified backups. The single-machine Manager setup does not currently enroll an additional node into the existing network. Use a supported native setup with reserved peers if you need this path.

## Handle a non-serving node

Distinguish an unavailable RPC or peer from an archive or canonical-history fault. For missing required FILE bytes, recover a verified copy from an eligible peer or backup. Keep the signed data directory and archive intact.

If two validated branches both contain ordinary blocks, the node stops production and preserves signed conflict evidence. Keep both branches and FILE archives. Compare independently verified history and agree on the authorized recovery outside the node. A restart does not select the canonical branch. See [succession](/protocol/succession/) and [recovery](/node/backup-recovery/).

## Plan software changes

Check the target package and its supported rules with `riadchain-cli protocol capabilities`. Back up canonical history and active FILEs, then install the verified package on each intended machine and check its original signed block and readiness. Use [Manager's signed update flow](/appliances/updates-and-help/) on managed machines. A [protocol upgrade](/protocol/upgrades/) is a separate change to the rules.
