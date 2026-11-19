---
title: System requirements and sizing
description: Start a small headless Debian node with 2 GiB RAM, then size memory and disk for your workload.
---

For a small private network, the **recommended starting RAM is 2 GiB**, including
headless Debian, the node and optional Manager service. This is a starting
recommendation, not a proven minimum, a reservation or a permanent memory limit.
Increase capacity according to workload.

The measurements below describe specific packages and workloads. Size RAM for
caches, transaction working data, FILE archive inventory, concurrent requests and
the operating environment. Size disk for history, active state, indexes, WAL and
native FILE bytes. No universal minimum covers every allowed FILE operation,
client load and contract workload.

## Installation prerequisites

The managed installation paths use **Debian 13**, matching native node and
appliance packages, systemd and a dedicated writable data filesystem. Choose
[direct installation with ZFS](/node/direct-install/) or a
[Proxmox Debian VM with ext4](/node/proxmox/). Both run the same node and Manager.

Package builders support native **amd64 and arm64** builds; install artifacts
matching the target architecture. Recorded disposable VM acceptance uses amd64;
arm64 hardware needs its own installation and workload qualification. Package
installation resolves declared Debian dependencies. Direct ZFS installation also
needs a tested kernel/OpenZFS combination. No source checkout, Rust, Node or Bun
is needed on the target machine.

Use a reachable private network, synchronized clocks and protected credentials.
Follow the selected installation guide for the mount identity and service setup.
The packages are currently local development artifacts; there is no published
APT repository or qualified customer hardware release.

## Disk-backed state: local qualification

On **2026-10-16 UTC**, the exact Debian 13 amd64 package
`2.0.0-32~trixie` loaded and modified about **1.39 GiB of active contract value
payload** in a Linux cgroup limited to **768 MiB**, with swap disabled. Maximum
sampled daemon RSS was **48.90 MiB** during checkpoint loading, fresh writes,
reads and checkpoint creation. Reloading its own full-state checkpoint passed,
as did original FILE receipt, binary-chunk, byte and CID checks.

A separate CLI process replayed all **6,827 canonical blocks** in about **152
seconds**, using separate disk-backed scratch and the same memory/swap limits.
Its maximum sampled RSS was **28.91 MiB**. Recorded OOM counters stayed zero.
Cgroup use approached its limit through filesystem cache, which Linux reclaimed.
High VM or cgroup used-memory figures therefore need to be separated from process
RSS and reclaimable cache.

This was a **workstation cgroup, not a complete Debian/Proxmox VM measurement**.
It excludes the host OS and other services, has no CPU cap, and does not establish
a universal minimum, long-term mixed-load qualification or home installation of
that package. FILE inventory and operation working data still need headroom.
See the [engineering record](https://github.com/nfl0/riadchain/blob/master/docs/testing/DISK_STATE_QUALIFICATION.md)
(repository access required) for exact hashes, workload and limits.

## Earlier measured small-network footprint

On **2026-10-12**, a disposable Debian 13 amd64 VM completed a small network
workload with node package `2.0.0-26~trixie`, Manager running alongside it, one vCPU
and swap disabled. This package kept active state in memory. It
confirmed 219 transaction receipts, served 10,000 queries, stored eight unique
1 MiB FILEs, verified the original data after a daemon restart and passed stopped
native replay. It used accelerated regtest blocks and a 64-block checkpoint
interval; ordinary private networks keep their ten-second cadence.

| Resource | Recorded case |
| --- | --- |
| CPU | One vCPU |
| Guest RAM | 384 MiB, the smallest passing allocation tested for this fixture |
| Daemon peak resident memory | About 28 MiB during this workload |
| Manager peak resident memory | About 9 MiB |
| Minimum observed available guest RAM | About 209 MiB |
| OS filesystem usage | About 1.03 GiB on a 12 GiB virtual OS disk |
| Data filesystem usage | About 9.2 MiB, including 8 MiB of FILE bytes, on a separate 2 GiB virtual disk |

A separate 512 MiB case passed the same checks. At 256 MiB the Linux headroom
guard refused startup with status 75, without creating chain history or recording
an OOM kill. These tests start from an installed guest; they do not measure
installer RAM requirements.

These are measurements of a small fixture. The node and Manager RSS figures
exclude the operating system and filesystem cache. The test did not establish a
maximum RSS, the smallest possible disk layout, large-object capacity or physical
power-loss durability. It used local development packages, not a qualified
customer release.

## Larger-state Proxmox qualification

On **2026-10-13**, an installed Debian 13 amd64 Proxmox VM ran development node
package `2.0.0-29~trixie` with **one vCPU, 1 GiB fixed guest RAM and no swap**.
That package kept active state in memory. Its private,
ten-second chain retained 20,000 UTXOs and 4,096 distinct 8,192-byte
contract values: 32 MiB of value payload. Manager was stopped during measurement.

| Measurement | Observed result |
| --- | --- |
| Mixed workload | 1,200 seconds; 43,694 reads, 484 transfers, 61 contract updates, 60 new FILEs and 2,147 simulations covering success and failure |
| Daemon RSS during timed sampling | 131.37–134.13 MiB |
| Early / late median RSS | 133.55 / 134.11 MiB; increase 0.56 MiB |
| Minimum available guest RAM | 592.91 MiB |
| OOM kills / service restarts during measurement | Zero |

Full-verification sampling separately observed 160.58 MiB RSS; this is not a
universal peak. Checkpoints temporarily ran every 64 blocks; the original
2,048-block setting was restored.

Stopped replay verified 588 blocks through height 587. FILE scrubbing and
file-inclusive backup verification covered 80 CIDs and 10 MiB of content;
restoring the backup matched its tip and state hashes. Guest reboot restored
node and Manager readiness with the original configuration, binaries, signed
genesis and pinned filesystem. Independent post-reboot checks
matched all 912 original mutation receipts, retained state and FILE bytes.
A 128 MiB service-limit check refused startup with exit 75, without an OOM kill
or automatic restart during
the twelve-second observation; the original unrestricted service limit was restored.

The 16 GiB OS and 64 GiB data disks are fixture allocations, not minimums. This
finite single-validator run and its backup on the same single-SSD ZFS pool do
not qualify independent recovery, physical power-loss durability or multi-node
behavior. See the [engineering record](https://github.com/nfl0/riadchain/blob/master/docs/testing/HOME_VM_FOUNDATION_QUALIFICATION.md)
(repository access required).

## Small-home starting allocation

For a small-file, light-client network, start with **one vCPU and 2 GiB of RAM**
for headless Debian, the node and optional Manager service. In Proxmox, allocate
**2048 MiB to the guest**. The 384 MiB result is a measured floor only for its dated
fixture; it does not establish the current node's minimum.

The 2 GiB recommendation is not a guaranteed ceiling for every workload. Validate
the current binary under representative use and increase CPU or RAM when
execution, caches, archive inventory, concurrent clients, large FILE operations
or other guest services need more headroom. Active UTXOs and contract values live
on disk; their growth does not require an equivalent increase in RAM.

The tested disk layout was **12 GiB for Debian plus a separate 2 GiB data disk**.
Those are test allocations, not minimum disk requirements. The measured 1.03 GiB
OS footprint still needs free space for package installation, updates and logs.
Choose data capacity for expected history, execution tables, indexes, WAL and
FILE archives, and expand before free space runs low. There is no fixed 128 GiB storage requirement.

The VM allocation excludes **Proxmox, its host ZFS cache and other VMs**. Reserve
host memory separately; see [Proxmox's hardware
requirements](https://www.proxmox.com/en/products/proxmox-virtual-environment/requirements).
A direct Debian machine needs its own allowance for ZFS, filesystem caches and
other services. The ext4 guest result does not qualify the same RAM allocation on
a direct ZFS machine. Use SSD-backed storage with working flushes and leave
free-space headroom.
Two virtual disks on one SSD share its failure risk. Keep verified
[history and FILE backups](/node/backup-recovery/) on independent storage.

## Allow for request and cache peaks

The earlier qualification runs describe their exact binaries and workloads.
Measure the current node with the actual contract state, account population and
FILE sizes you expect to serve.

From node package revision 61, the recent receipt cache defaults to a
10,000-block height window and 128 MiB of estimated retained receipt memory.
It can retain fewer blocks when the memory budget is reached. The optional
[`network.rpc` settings](/node/configuration/#receipt-cache) tune these local
limits. Include live state and temporary requests when planning total node
memory. The separate recent-event cache holds up to 256 blocks and 8 MiB.
Signed block history stays on disk. Transaction and account queries use indexes constructed
from that history. Older execution can require replay from a verified
checkpoint, so historical reads may increase CPU and disk I/O. See
[historical execution](/node/operations/#read-recent-and-historical-execution).

FILE uploads and downloads use bounded chunks. A file close to the default
300 MiB ceiling still uses space for both staged and verified content while
being admitted. Peer catch-up, local verification and backups also read or
write archive bytes. Keep enough free disk for that work and for the retained
copies you actually need.

## What grows with age and use

| Resource | Main drivers |
| --- | --- |
| Disk space | Complete signed history, derived indexes and checkpoints, active FILE bytes and staged uploads |
| RAM | Working state, transaction and VM buffers, recent execution caches and concurrent requests |
| CPU | Transaction execution, ML-DSA-65 verification, replay, archive verification and checkpoint creation |
| Disk I/O | History commits, checkpoint creation, archive reads, peer recovery and backups |
| Network bandwidth | Signed blocks, FILE replication, authentication and client reads |

Even an idle private network accumulates signed blocks while its producer is
active. Checkpoints reduce work for historical execution queries, but startup
still verifies signed history and checks required archive data. Measure both
startup and ordinary operation. Keep host and guest memory headroom separate.
If a packaged service exits with status 75 for insufficient resources, diagnose
the relevant limit from its journal and restore headroom before restarting.

## Measure before increasing capacity

Record free disk space, available guest and host memory, CPU and I/O pressure,
active-state counts, readiness and peer lag under a representative workload.
For inexpensive local checks on a packaged installation:

```sh
df -h /var/lib/riadchain
free -h
systemctl status riadchaind.service riadchain-manager.service
```

Combine [authenticated node status](/node/operations/#monitor-readiness-and-convergence)
with operating-system metrics to compare daemon resident memory and the
workload being served. Daemon RSS excludes Manager and host caches; Linux filesystem cache can
use spare memory, so consider available memory and pressure as well as usage.
Run archive integrity scans and backups deliberately: both read retained data and
are unsuitable as frequent lightweight checks.

Measure data growth over a representative period and estimate when free space
will run out. Include planned FILE uploads, checkpoint and index space, backups
and snapshots on the same pool. There is no universal disk-growth rate. Increase
capacity before exhausting free space, and verify that execution and catch-up
still keep pace. Follow [contract resource practices](/build/resource-practices/)
to reuse fields and avoid redundant state while preserving required application
data and native FILE availability.
