---
title: Install in a Proxmox VM
description: Prepare a Debian 13 VM with a dedicated ext4 data disk on Proxmox storage, then use the same native packages and Manager apps.
---

Use a **Debian 13 VM** on your existing Proxmox host. Install the same native node
and appliance packages used by [direct Linux installations](/node/direct-install/).
Proxmox manages the virtual hardware; Riadchain runs inside Debian. The host's
`local-zfs` storage can hold both virtual disks without putting ZFS inside the guest.

## Create the VM

Upload the Debian 13 ISO to ISO-capable Proxmox storage, then choose **Create VM**.
The following uses the [recommended small-network starting profile](/node/system-requirements/#small-home-starting-allocation).
Its RAM allocation includes headless Debian, the node and optional Manager.
Larger requests, concurrent clients and other services may need more capacity;
this is not a proven minimum or a permanent memory limit:

| Setting | Starting choice |
| --- | --- |
| OS | Debian 13, minimal installation with SSH; no desktop needed |
| CPU and RAM | One vCPU and 2048 MiB RAM (2 GiB) for a small-file, light-client network |
| OS disk | The measured fixture used 12 GiB; leave space for Debian, updates and logs |
| Data disk | A separate SCSI virtual disk sized for your history and FILE archive; the small test used 2 GiB |
| SCSI controller | VirtIO SCSI single, I/O thread enabled |
| Disk cache | Default **No cache**; preserve flushes and storage durability settings |
| Network | VirtIO adapter on the intended private-network bridge |

Reserve RAM for Proxmox, host ZFS and other VMs separately from the guest's
allocation. Keep free-space headroom on both guest and host, and monitor actual
resource use. [Sizing guidance](/node/system-requirements/#what-grows-with-age-and-use)
explains active-state growth, archive space and startup overhead.

These controller, cache and network choices follow [Proxmox's VM
documentation](https://github.com/proxmox/pve-docs/blob/master/qm.adoc). Proxmox
[ZFS storage](https://github.com/proxmox/pve-docs/blob/master/pve-storage-zfspool.adoc)
backs virtual disks with host-side volumes. Two virtual disks on one SSD still
share that SSD's failure risk. Several VMs on one server also share its power and
hardware failures.

Install Debian on the OS disk. Use **manual partitioning** for the dedicated,
verified blank data disk: create an ext4 filesystem and mount it at
`/var/lib/riadchain`. Identify disks by their assigned size and VM hardware before
confirming formatting. Never select an existing host volume or data disk containing
history. Riadchain's installer does not partition or format storage.

Use a stable private address or DHCP reservation. Confirm the phone can reach the
VM directly; NAT with missing forwarding is not enough. Permit management ports
`9442` and `9443`, and authenticated node port `8545`, only across the intended
private network. Keep the guest clock synchronized.

## Pin the guest filesystem

After installation, inspect the actual mount:

```sh
findmnt --mountpoint /var/lib/riadchain --output TARGET,SOURCE,FSTYPE,UUID,OPTIONS
```

The filesystem must be ext4, writable and the root of the dedicated data
filesystem. Record its lowercase UUID. `/etc/fstab` must define the mount before
Riadchain starts, using that UUID. Replace the example with the real value:

```text
UUID=12345678-1234-1234-1234-123456789abc /var/lib/riadchain ext4 defaults,nodev,nosuid,noexec 0 2
```

Keep the underlying unmounted directory root-owned and non-writable by the node.
Use the ordinary filesystem mount above, without `nofail` or descendant mounts.
The guard rejects subdirectory bind mounts. The
normal empty, root-owned `lost+found` directory can remain; populated or unexpected
entries refuse fresh setup. Reload systemd and confirm `var-lib-riadchain.mount`
is active. The packaged node service
depends on that exact mount unit and verifies its filesystem identity.

## Install and provision Manager

Build the two matching `.deb` development packages on your workstation with
`scripts/build-node-deb-container.sh`, then transfer them to Debian. No source
checkout, Rust, Node or Bun is needed in the VM. There is no public APT repository
or customer release yet. Use the actual artifact filenames:

```sh
sudo apt-get install ./riadchain-node_<version>~trixie_amd64.deb \
  ./riadchain-appliance_<version>~trixie_amd64.deb
sudo chown riadchain:riadchain /var/lib/riadchain
sudo chmod 0700 /var/lib/riadchain
sudo install -m 0640 -o root -g riadchain-manager \
  /usr/share/riadchain/manager.toml.example /etc/riadchain-manager/manager.toml
sudo riadchain-manager-setup --ext4-uuid <actual-lowercase-filesystem-uuid>
sudo systemctl enable --now riadchain-manager.service
```

Review Manager's private listeners before enabling it. Package installation
leaves node history empty and services stopped; provisioning creates management
identity and a one-time password without starting a chain. Obtain the setup
password locally from `/var/lib/riadchain-manager/setup-password.txt`; successful
phone pairing removes that file. Keep it private.

The ext4 guard verifies the actual guest filesystem UUID, exact writable mount
root and absence of unexpected mounts. It rejects the OS root device even if its
UUID matches configuration. It does not infer host redundancy or
verify the host pool's health. Reformatting changes the UUID; mounting a replacement
disk requires explicit identity verification. Do not bypass the guard to make a
missing data disk start on the OS disk.

For a manual node configuration, the same storage choice is:

```toml
data_dir = "/var/lib/riadchain"

[storage]
kind = "ext4"
uuid = "12345678-1234-1234-1234-123456789abc" # replace with the actual UUID
```

Run `riadchain-cli --config /etc/riadchain/node.toml config check-storage` as the
`riadchain` service user before manual startup. Guided setup writes this
configuration itself; leave it absent until you approve the wallet-signed plan.

## Start your network and plan recovery

Follow [pairing](/appliances/connect-machines/) and [network
creation](/appliances/first-network/), or use the
[native CLI setup](/node/quickstart/) for an independently operated VM.
One prepared VM can start the chain. Use the native route with reserved peers
when planning a later machine addition. Manager can install signed node
packages after provisioning. Guided joining and archive restoration remain
operator workflows.

Back up [canonical history and native FILE bytes](/node/backup-recovery/) and keep
owner phrases separately. A VM snapshot on the host's single SSD shares its
failure risk; store verified backups outside that failure domain. Stop Riadchain
cleanly before a VM backup when you need a consistent stopped copy, and include
both virtual disks. A live VM snapshot alone is not evidence of replay or FILE
coverage.

The ext4 path still needs qualification on your actual Proxmox host; source,
fixture and disposable VM checks do not qualify its disks or power-loss behavior.

When a second server becomes available, add a verified node and archive there
through the original network's enrollment procedure. Its redundant drives improve
that server's drive resilience; verify replication and fund its owner before
expecting automatic succession. Keep one active copy of each machine identity;
starting a cloned VM beside its original duplicates keys and history.
