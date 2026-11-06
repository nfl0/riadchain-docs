---
title: Choose your path
description: Find the right guides for node operators, developers and wallet users.
---

The source repository currently requires access. Guides that build the node,
compiler or applications assume an authorized checkout. These public docs do not
imply that SDK packages or application binaries have been released publicly.

## Received your machines?

Use [Your appliances](/appliances/), the customer guide for connecting prepared
machines and managing them through the Android apps. Keep this link with your
order information. The operator guides below cover manual installation and
technical administration.

## Operate a home or company network

Choose your starting point:

For a new deployment, first [plan your home or company network](/node/deployment/).

| Your situation | Start here |
| --- | --- |
| You need to install a machine | [Direct Debian installation](/node/direct-install/) or [Proxmox VM](/node/proxmox/) |
| You are setting up a new network on prepared machines | [Manager and wallet setup](/appliances/first-network/), or the [manual CLI](/node/quickstart/) |
| Your home or company already has a network and you need another node | [Join through a peer invitation](/node/operations/#enroll-a-follower) |
| You only want to use a wallet or application | [Wallets and apps](#use-a-wallet-or-dapp); ask the operator for the node endpoint and chain identity |
| You are developing contracts or integrations | Use a separate test network, then follow the developer guides below |

For ongoing operation, learn
[configuration](/node/configuration/), [enrollment and operations](/node/operations/),
[backups](/node/backup-recovery/), and [FILE archive availability](/node/file-archive/).
Keep every validator's signed genesis and chain identity consistent.

## Build an application

Begin with [SDK setup](/developers/sdk/) and [RPC reads](/developers/rpc/).
Use [typed contract arguments](/developers/contract-arguments/) and the
[transaction lifecycle](/developers/transactions/) before implementing writes.
For attachments and stored objects, follow [FILE uploads](/developers/files/).

## Write contracts

Follow the [high-level quickstart](/build/quickstart/), then read
[language fundamentals](/build/language/) and [ABI guards](/build/abi-and-guards/).
The [Charlie and native token guide](/build/charlie-and-native-tokens/) explains
the execution boundary. Test against a separate development network before approving
a deployment or a transaction.

## Use a wallet or dapp

Choose the [native wallet](/apps/native-wallet/), [Keychain extension](/apps/keychain/),
or [web wallet and IDE](/apps/web-wallet-and-ide/). Each requires your selected
node and verified chain identity; application contracts also need their actual
addresses on that chain.

Read the feature-specific guides before using [Chat](/apps/chat/),
[SmartHome](/apps/smart-home/), [DEX and Riax](/apps/dex-and-riax/), or
[Games and Explorer](/apps/games-and-explorer/). Back up account secrets and any
separate message identities before relying on them.
