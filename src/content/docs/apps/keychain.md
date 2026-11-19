---
title: Riad Keychain
description: Use the native Chrome wallet, encrypted backups and scoped administrator sign-in.
---

Riad Keychain uses ML-DSA-65 and connects to the
[native node RPC](/developers/rpc/) through the Chrome side panel. It
supports RDC transfers, contract deployment and calls, and reviewed sign-in
for supported NFT-administered applications.

## Load the extension

The source build needs Chrome 116 or later. From the repository root, install
the [locked workspace dependencies](/developers/sdk/#develop-in-the-monorepo)
and build the extension.

```sh
bun run keychain:build
```

Enable **Developer mode** on Chrome's extensions page, choose **Load unpacked**,
then select `apps/Riad-keychain/dist`. For an existing installation from that
path, choose **Reload** and keep the extension's data.

## Set up a wallet

Create a native account, restore a compatible 24-word recovery phrase, or
import an encrypted `.age` backup from Keychain or the workstation wallet.
Keychain saves the signing key in a password-encrypted vault. Save a copy of
the encrypted backup and keep its password separately.

Use the HTTPS RPC URL, chain ID, full genesis hash and RPC token supplied
by your node operator. Keychain verifies the chain and genesis before
showing the account balance. It remembers public connection details and
keeps the RPC token in the current side panel session. If the node restricts
browser origins, allow the extension's exact `chrome-extension://`
origin using the ID shown in Chrome.

## Send RDC and work with contracts

Copy your `riad1…` address to receive RDC. Review the amount, recipient, fee,
and network before you authorize a send. Contract actions use a `rct1…` target.
See [accounts and permissions](/protocol/accounts/) for the address rules.

Keep the original transaction when a node response is interrupted. Keychain
saves the signed bytes before submission. Use **Check transaction** to
reconcile the receipt before retrying the same reviewed original. A queued
transaction still needs a successful receipt.

## Sign in to a supported dapp

Gateway, Cloud admin and Ping can request a scoped administrator sign-in.
Review the requesting origin, account and contract, then unlock the wallet to
approve. The proof goes back to the original browser document. The app checks
the current owner of its administrator NFT on the intended chain.

Native token holdings and generic dapp signing are outside this release.
Individual dapps need a native integration for operations beyond scoped
sign-in. Account keys and node RPC credentials stay inside the extension.
