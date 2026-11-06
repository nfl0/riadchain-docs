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
ten-second protocol-2 chain retained 20,000 UTXOs and 4,096 distinct 8,192-byte
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
genesis, protocol schedule and pinned filesystem. Independent post-reboot checks
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

The node fills its bounded caches as needed. Current defaults include an 8 MiB
compiled-program cache, 4 MiB SQLite page-cache targets per connection and
at most the current and previous blocks and receipts in native RAM. Growing
execution tables and their derived indexes live on disk. Candidates and
simulations retain changed records over a pinned database snapshot; checkpoint
creation streams its snapshot instead of cloning the complete active state.
Older blocks, transactions, receipts and events are queried through the durable indexes and
logs. These accounting targets do not define total process RSS or reserve all
future memory when the daemon starts.

FILE streaming uses bounded chunks, but whole-object text and base64 queries
allocate buffers for the object and encoded response. The default FILE size
limit is 300 MiB; processing an object near that limit can require hundreds of
MiB beyond the small-workload footprint. Concurrent responses, peer catch-up,
execution and checkpoint work also need temporary memory. Each live database
reader has its own cache, and long snapshot readers can retain WAL pages on disk.
Test the actual paths and largest requests your applications will use before choosing a low allocation.

## When RAM headroom runs low

On Linux, the node checks available machine RAM and visible cgroup-v2 memory
limits, including ancestor limits. It requires **128 MiB of available headroom**
for shutdown. This is a stopping threshold: the node does not preallocate or
exclusively own those bytes. State and cache contents allocate as needed. In a
VM, these checks see guest RAM and guest service limits, not Proxmox host RAM.

Known-size FILE reads also check their temporary buffer needs, including the
overlap between content, Base64/text and the RPC response. If that request would
consume the shutdown headroom, it returns a resource-unavailable error. The node
can continue serving smaller requests, and the archived object stays intact.
Streaming FILE transfers reuse their bounded buffers.

At or below that reserve, the daemon refuses startup or stops admitting work,
drains admitted storage work and exits with **status 75**. The journal explains
the shortage. The packaged service leaves it stopped instead of automatically
restarting into the same condition. Free memory or increase the VM/service
allocation, then use the reviewed **Start node** action in Manager's
[Maintenance](/appliances/everyday-use/#check-machines-in-manager), or start it
through the local operator tools:

```sh
free -h
sudo journalctl -u riadchaind.service -n 30 --no-pager
sudo systemctl start riadchaind.service
```

The separate management service remains available when the chain daemon stops.
Starting an existing stopped chain retains its original history and FILE archive;
it does not create a replacement network. If RAM is still insufficient, startup
is refused again rather than automatically retried.

This preventive check cannot guarantee that every sudden allocation or concurrent
consumer will be detected before the kernel runs out of memory. Leave operating
headroom; swap does not satisfy the reserve. Keep Linux memory accounting
available and use the standard unified cgroup-v2 environment supplied by Debian 13.

## What grows with age and use

| Resource | Main drivers |
| --- | --- |
| Disk space | Canonical history, derived execution tables and indexes, receipts, checkpoints, SQLite WAL and confirmed FILE bytes |
| RAM | Database/compilation caches, changed-record overlays, VM and request working data, per-object FILE archive inventory and process overhead |
| CPU | Transaction execution, signatures, concurrent queries and operations over active state; replay, verification and checkpoint creation |
| Disk I/O | Canonical commits, derived table/WAL writes, cold state and historical reads, reconstruction, checkpoints, archive verification and backups |
| Network bandwidth | New blocks, peer catch-up, client requests and FILE transfers; demand depends on activity and peers |

Disk usage increases even when application state stays unchanged: an eligible
private chain continues producing blocks at its fixed ten-second cadence.
Confirmed FILE contents and consensus FILE records stay on disk. The separate
operational archive inventory retains metadata per object in RAM. Deleting a
current contract field or spending a UTXO does not remove the historical transaction that changed it.

Native RAM follows the **working set, concurrent work and operational metadata**,
rather than retaining every active value or old block. Database and compilation
caches have targets; transactions and VM execution have bounded inputs and effects.
These are component bounds, not an exact RSS ceiling or proof that every workload
is leak-free. FILE object count can still increase archive-inventory RAM. Compare
sustained growth with workload, object counts, active-state counts and memory
pressure, and leave headroom for temporary execution and response allocations.

An older chain can also take longer to restart, verify or back up. Checkpoints
reduce state replay, but startup still verifies historical records, reconstructs
query indexes and checks archived FILE objects. Checkpoint creation streams
active state from disk, and independent recovery replay uses a separate derived database. Offline CLI verification uses temporary
scratch: set `TMPDIR` to an existing private directory on a disk-backed filesystem
when the system temporary directory is memory-backed. Routine CPU, I/O and
network use need not increase continuously just because the chain is older.

## Measure before increasing capacity

Record free disk space, available guest and host memory, CPU and I/O pressure,
active-state counts, readiness and peer lag under a representative workload.
For inexpensive local checks on a packaged installation:

```sh
df -h /var/lib/riadchain
free -h
systemctl status riadchaind.service riadchain-manager.service
```

Use authenticated [node metrics and health](/node/operations/#monitor-readiness-and-convergence)
to compare daemon resident memory with active UTXOs, contract storage and FILE
records. Daemon RSS excludes Manager and host caches; Linux filesystem cache can
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
