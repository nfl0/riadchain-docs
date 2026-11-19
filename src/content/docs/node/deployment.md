---
title: Plan a home or company network
description: Choose network roles, hosts, access and recovery before creating a private, permissioned Riadchain deployment.
---

A Riadchain deployment is a **private, permissioned network** operated by a home
or company. Your network has its own signed genesis, trusted node identities, account
balances, contracts and FILE archives. You do not join a shared public mainnet.

Choose one of two installation routes. They use the same native Debian 13
packages, systemd service, Android Manager and separate wallet.

Check [system requirements and sizing](/node/system-requirements/) before
allocating hardware. It separates the small-home starting configuration from
capacity that grows with active state, history, FILEs and workload.

| Installation | Storage |
| --- | --- |
| [Directly on Linux](/node/direct-install/), including prepared Riadchain hardware | Dedicated ZFS dataset, pinned by name/GUID |
| [Debian VM on Proxmox](/node/proxmox/) | Dedicated ext4 guest data disk, pinned by UUID; Proxmox manages host storage |

Both mount data at `/var/lib/riadchain`. The VM does not need another ZFS pool
inside Debian. Installation route is separate from network creation, joining and
production eligibility. A single SSD remains a single drive failure domain even
when it contains ZFS, several virtual disks or several VMs.

The packages are currently local development artifacts, with no public APT
repository or qualified customer hardware release. Prepare the OS/storage and
install packages, then use the [customer appliance guide](/appliances/) for Android
pairing, wallet-signed setup and individual node updates. Manual operators can
use `node.toml` and the native CLI. The customer first-boot wizard, joining or
restoring networks through Manager, and coordinated updates remain unfinished.

## Choose the environment

| Environment | A practical starting layout |
| --- | --- |
| Home | One or more machines are eligible to produce blocks; other machines can verify history and retain another archive |
| Company | Several managed machines can be eligible producers or archive replicas; operators coordinate access, key custody and backups |
| Development | An isolated network with its own genesis, keys and data directory; keep experiments separate from the network people rely on |

These are deployment patterns, not hardware capacity guarantees. Plan disk space
for history and confirmed file bytes, and measure your actual workload. One
producer and multiple followers still use trusted-validator succession; adding
machines does not create Byzantine quorum finality.

## Assign roles

- **Network operators** agree on chain identity, initial allocations, validator
  keys, enrollment, endpoint access and recovery procedures.
- **The active validator** produces blocks while its confirmed spendable balance
  meets the minimum. An enrolled node holding the required signing authority
  can take over in its timed window once its owner's balance qualifies.
- **Followers** verify and replay history. They can retain FILE bytes, but a peer
  connection alone does not make them successors.
- **Wallet and application users** connect to an endpoint supplied by the operator.
  They do not need to create genesis or run a daemon.

Signed genesis defines the network’s rules. Application owners manage permissions
within their own contracts.

## Decide how machines connect

Start the first validator on loopback while checking setup. For access from other
machines, choose a reachable address and configure [client and peer
authentication](/node/configuration/#authenticate-client-and-peer-traffic).
Use an appropriate private network or TLS-protected access path. Do not embed
operator credentials in a public application bundle.

Agree on the full genesis hash over a trusted channel. Prepare separate
[peer credentials and reciprocal routes](/node/operations/#enroll-a-follower).
Keep clocks synchronized and verify peer reachability and synchronization.

## Prepare for files and recovery

The native setup can start standalone with local FILE verification. A network
configured to require one peer acknowledgement needs a reachable archive peer.
Choose the signed policy at genesis. Mirrored drives do not provide an
independent recovery copy.

Keep verified [history and FILE backups](/node/backup-recovery/) on separate
storage. Retain each machine's protected credentials and any independent
funded recovery authority separately. An already enrolled zero-RDC machine
can replicate history and files. It must hold enough confirmed RDC to take over
production under [succession](/protocol/succession/).
