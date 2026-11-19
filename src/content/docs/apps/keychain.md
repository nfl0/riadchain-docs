---
title: Riad Keychain
description: Use the native Chrome wallet, encrypted backups and scoped administrator sign-in.
---

Riad Keychain uses ML-DSA-65 and connects to the
[native node RPC](/developers/rpc/) through the Chrome side panel. It
supports RDC transfers, token and NFT management, contract actions, and
reviewed dapp signing.

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
Keychain saves the signing key in a password-encrypted vault. Use a password
of at least eight characters. Save a copy of
the encrypted backup and keep its password separately.

Use the HTTPS RPC URL, chain ID, full genesis hash and RPC token supplied
by your node operator. Keychain verifies the chain and genesis before
showing the account balance. It remembers public connection details and
keeps the RPC token in the current side panel session. If the node restricts
browser origins, allow the extension's exact `chrome-extension://`
origin using the ID shown in Chrome.

In Android Wallet, open **Network → Network details** to copy the RPC URL,
chain ID, and genesis hash. **Reveal RPC token** requires device
authentication and hides the token again after 30 seconds.

From an Android account, **Reveal recovery phrase** opens the saved words
after authentication. **Copy recovery phrase** copies those words for the
selected account. Use a current Android Wallet build with the native RPC.

## Send RDC and work with contracts

Copy your `riad1…` address to receive RDC. Review the amount, recipient, fee,
and network before you authorize a send. Contract actions use a `rct1…` target.
See [accounts and permissions](/protocol/accounts/) for the address rules.

Keep the original transaction when a node response is interrupted. Keychain
saves the signed bytes before submission. Use **Check transaction** to
reconcile the receipt before retrying the same reviewed original. A queued
transaction still needs a successful receipt.

## Manage tokens and NFTs

Open **Tokens and NFTs** to see holdings or find a token by ID. Review
the recipient, amount, and RDC fee before sending. **Hide token** removes
the holding from the normal view for this account and network. Enable
**Show hidden** to see hidden holdings. The list requires a node release
that includes the native token holdings RPC.

## Approve dapp requests

A supported dapp can ask Keychain to sign or submit a transaction. The dapp
uses the native SDK to prepare a transaction for the connected account and
chain, then passes the lowercase hex output of `encodeNetworkDraft(draft)`
to `window.riadchain.signNetworkTransaction(draftHex)` or
`window.riadchain.sendNetworkTransaction(draftHex)`.

Review the requesting origin, transaction details, and fee before entering the
wallet password. Keychain verifies the transaction through the pinned node and
journals the exact signed original before handing it back or submitting it. Use
its original ID to check the receipt if the response is interrupted.

Gateway, Cloud admin, and Ping can also request scoped administrator sign-in.
The proof goes back to the original browser document. The app checks the
current owner of its administrator NFT on the intended chain. Signing keys
and node RPC credentials stay inside Keychain.
