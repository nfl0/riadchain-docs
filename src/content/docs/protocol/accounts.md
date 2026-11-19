---
title: Accounts and permissions
description: Understand stable addresses, ML-DSA-65 signing, recovery and limited application authority.
---

Riadchain uses ML-DSA-65 for native transaction signatures. The address format
includes a checksum and shows which kind of identity you are using.

| Prefix | Identity |
| --- | --- |
| `riad1…` | An account that can receive funds and authorize transactions. |
| `rct1…` | A contract address. Check the contract's deployed code on the intended chain before interacting with it. |

An account can receive RDC as soon as its address exists. The owner's first
signed spend supplies the public key and proves that it matches the initial
address commitment. Keep the recovery phrase private and compare the full signed
[genesis hash](/protocol/genesis/) when connecting a wallet.

## Rotate an account key

A key rotation is authorized by the current signing key and advances the
account's key epoch. The address and the funds assigned to it stay the same.
Once the new key is confirmed, earlier signatures cannot authorize new spends
under the old epoch. Back up the replacement key before relying on it and check
the confirmed rotation before discarding the earlier credentials. Rotation needs
a current authorized key. If every copy of that key is lost, a rotation cannot
recreate it.

## Give an app limited access

Use a separately funded subaccount when the app needs its own balance and
signing identity. Wallets can group that account with its parent for usability,
while the chain keeps their balances and signing authority separate. A normal
reviewed transfer funds the new address.

For narrower authority, an owner can grant a capability to a separate signing
account. Each grant binds its allowed contract methods or supported FILE actions,
expiry height and resource limits. A fee vault can pay for the delegate's allowed
operations. Grants can be topped up or revoked by their authorized owner. A
capability does not give the delegate the owner's key, general spending rights,
or validator authority.

See [transaction preparation and recovery](/developers/transactions/) and
[contract authorization](/build/abi-and-guards/) for application integration.
