---
title: Set up from the workstation
description: Prepare and operate a private network directly with the current native CLI.
---

The current native setup path works independently of Android Manager. Use [Create
a network](/node/quickstart/) to prepare a signed genesis and protected machine
directories on a trusted workstation. Copy each directory only to its intended
machine. The original genesis pin is the same for every node.

## Choose how to keep the owner keys

The [Android setup](/appliances/first-network/) keeps the two funded owner keys
and the two spending keys in the wallet, with recovery phrases. It pairs the
machine and transfers its separate operational credentials through Manager.

The native CLI prepares machine credentials directly. Each producer seed can
sign blocks and spend from that address. Keep independent protected backups
and use a separate wallet address for routine spending. Native provisioning
does not enroll a phone or create a Manager session.

## Disposable test network

Use a new data directory, an unused local endpoint and fresh keys for any
disposable setup. The [native developer harness](/node/regtest/) provides an
isolated short smoke run. Keep development keys permanently separate from any
network people rely on.
