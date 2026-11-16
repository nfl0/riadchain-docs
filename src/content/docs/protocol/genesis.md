---
title: Signed genesis
description: Understand how the signed network definition fixes its identity and starting rules.
---

Signed genesis establishes the network’s identity, initial producer, allocations
and starting rules. Compare the expected genesis hash through a trusted channel
before connecting a node or wallet. Nodes replay signed history against that
same genesis.

## Network settings

Genesis commits the network mode and bounds for fees, gas, contract execution,
FILE storage and succession. Private networks use ten-second blocks.
[Regtest](/node/regtest/) is a separate, disposable mode with a faster cadence.
Set these choices before creating the network and retain the signed definition
with your recovery material.

When the node release supports scheduling, participants can agree to activate
future rules on the same chain. See [protocol upgrades](/protocol/upgrades/).

## Contract execution

Charlie gives contracts bounded storage scans, record-field deletion, canonical
typed hashing, strict byte codecs and authenticated chain context. Failed calls
roll back their effects and account for gas already consumed. See
[resource practices](/build/resource-practices/) and
[application checkpoints](/build/application-checkpoints/) for details.

A contract has its own owner and authorization rules. See
[ABI and guards](/build/abi-and-guards/) for contract-level authority.
