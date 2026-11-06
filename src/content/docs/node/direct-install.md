---
title: Install directly on Debian
description: Prepare dedicated ZFS storage and install the native node and Manager on Debian 13, without a hypervisor.
---

Use this route for a dedicated Linux server or a prepared Riadchain machine.
Install **Debian 13 directly on the hardware**, then the native node and appliance
packages. For an existing Proxmox host, use the [Debian VM route](/node/proxmox/).
Both routes run the same daemon, Manager service and Android apps.

Review [system requirements and sizing](/node/system-requirements/) before
allocating CPU, RAM and storage. A direct ZFS machine needs memory for its storage
cache and other services in addition to the node's workload.

Installation prepares a machine; it does not create a network or decide whether
that machine produces blocks. Those decisions follow [network planning](/node/deployment/)
and the wallet's signed setup.

## Prepare storage and networking

Have an administrator provision a dedicated **ZFS dataset** mounted at
`/var/lib/riadchain`. ZFS installation and disk layout depend on the hardware and
kernel; Riadchain never formats drives or creates pools. Use a tested Debian/OpenZFS
combination and keep the OS outside the dedicated data dataset. A mirror can
provide drive redundancy; a single-disk pool cannot.

Set the dataset's mountpoint to `legacy` and add a mount definition in `/etc/fstab`
before enabling Riadchain. Replace `riadchain/data` with the existing dataset:

```text
riadchain/data /var/lib/riadchain zfs defaults,nodev,nosuid,noexec,x-systemd.requires=zfs-import.target,x-systemd.after=zfs-import.target 0 0
```

An explicit `var-lib-riadchain.mount` unit is also supported. A mount performed
only with `zfs mount` does not define the required boot dependency early enough.
Keep the unmounted directory root-owned and non-writable by the node. Mount the
dataset and obtain its actual GUID:

```sh
sudo systemctl daemon-reload
sudo systemctl start var-lib-riadchain.mount
sudo zfs get -Hp -o value guid riadchain/data
findmnt --mountpoint /var/lib/riadchain
```

Do not place descendant mounts inside this dedicated root. Configure a stable
private IP address or DHCP reservation, working time synchronization and a private
route reachable by your Android phone. Restrict management ports `9442` and
`9443`, and authenticated node port `8545`, to intended private clients and peers.

## Install the native packages

The packages are currently **local development artifacts**. No public APT
repository, customer release or qualified hardware image has been published.
With repository access, build matching node and appliance packages on a separate
workstation using rootless Podman:

```sh
scripts/build-node-deb-container.sh
```

Transfer the two resulting `.deb` files from `target/debian/` to the machine.
Select their actual matching filenames and architecture:

```sh
sudo apt-get install ./riadchain-node_<version>~trixie_amd64.deb \
  ./riadchain-appliance_<version>~trixie_amd64.deb
```

The target needs neither the source checkout nor Rust, Node or Bun. Initial package
installation may download declared Debian prerequisites. It leaves the node and
Manager stopped, and creates no genesis, keys or history.

After verifying the mounted data identity, give **only its root directory** to the
node account. Do not recursively change ownership of an existing archive:

```sh
sudo chown riadchain:riadchain /var/lib/riadchain
sudo chmod 0700 /var/lib/riadchain
sudo install -m 0640 -o root -g riadchain-manager \
  /usr/share/riadchain/manager.toml.example /etc/riadchain-manager/manager.toml
```

Review the two private-network listeners in `manager.toml`. Provision the actual
dataset and quoted decimal GUID from the earlier check:

```sh
sudo riadchain-manager-setup --dataset riadchain/data --guid <actual-dataset-guid>
sudo systemctl enable --now riadchain-manager.service
```

Setup records the exact storage identity and creates unique management identity
and a protected one-time setup password. It refuses existing or incomplete
management identities; it does not start a chain. Obtain the password locally from
`/var/lib/riadchain-manager/setup-password.txt` and enter it in Manager. Do not send
it in logs, support bundles or messages. Successful pairing removes that file.

## Create or join a network

For a fresh machine, follow [pairing](/appliances/connect-machines/) and
[creating your network](/appliances/first-network/). Manager relays public setup
plans and encrypted operational keys; the separate Riadchain wallet retains owner
keys and signs genesis. Do not create `node.toml` or chain history manually before
this guided setup.

For one fresh machine, [workstation CLI setup](/node/cli-setup/) offers the same
handoff without a phone. Choose CLI or phone enrollment as the machine's single
controller.

For an existing network, use the operator's [peer enrollment](/node/operations/#enroll-a-follower)
procedure with the original signed genesis. Guided joining and archive restoration
through Manager remain unfinished. Manual configuration can bind the same guard:

```toml
data_dir = "/var/lib/riadchain"

[storage]
kind = "zfs"
dataset = "riadchain/data"
guid = "12345678901234567890" # replace with the actual GUID
```

Before manual startup, run the read-only storage check as the service user:

```sh
sudo -u riadchain riadchain-cli --config /etc/riadchain/node.toml config check-storage
```

Missing, replaced, read-only or unexpected mounts refuse startup. The service is
tied to its mount unit. Recreating a dataset changes its GUID; rebinding restored
storage requires deliberate verification, not a configuration workaround.

Keep verified [history and FILE backups](/node/backup-recovery/) on independent
storage. ZFS snapshots on the same drives do not protect against loss of those
drives. Package, phone, VM and physical power-loss evidence are separate; this
guide does not establish customer hardware qualification.
