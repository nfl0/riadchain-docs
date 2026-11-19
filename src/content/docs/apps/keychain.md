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
then select `apps/Riad-keychain/dist`. Keychain 3.3.0 and later include a public
manifest key. Check for this stable Chrome ID on the extensions page.

```text
nblognglcdkmbeikggjngllgbkllokfh
```

For an existing installation with this ID, choose **Reload** to retain the
extension's data.

### Move from an older installation

Earlier unpacked builds used an ID derived from their directory path. Moving
to the stable ID creates a separate extension installation. Chrome stores
each extension ID’s wallet, connection and transaction journal separately.

1. In the old installation, download your password-encrypted `.age` wallet
   backup and keep its password. A compatible native 24-word recovery phrase
   can also restore the account.
2. Resolve any previously pending original transactions using the old
   installation's **Check transaction** action. Keep that installation and its
   data until those originals are resolved; a wallet backup does not include
   its transaction journal.
3. Load the current build, confirm the stable ID above, and import the backup
   or restore the compatible recovery phrase.
4. Re-enter the RPC connection details supplied by your node operator. Verify
   the restored address and intended network before using the account.

Keep the old installation's data until both the account verification and
original-transaction checks are complete. Do not create a replacement
transaction for an unresolved original.

## Set up a wallet

Create a native account, restore a compatible 24-word recovery phrase, or
import an encrypted `.age` backup from Keychain or the workstation wallet.
Keychain saves the signing key in a password-encrypted vault. Use a password
of at least eight characters. Save a copy of
the encrypted backup and keep its password separately.

Use the HTTPS RPC URL, chain ID, full genesis hash and RPC token supplied
by your node operator. Keychain verifies the chain and genesis before
showing the account balance. It saves the verified connection and encrypts
the RPC token in this browser profile so it can reconnect automatically.
For a connection saved using an older Keychain build, enter its token once.
Use **Forget saved token** in Keychain settings to remove the credential.
Add this Keychain origin to the node's
[browser origin allowlist](/node/configuration/#browser-origin-allowlist).

```text
chrome-extension://nblognglcdkmbeikggjngllgbkllokfh
```

Each node needs one entry for all installations of the stable build.
Keychain still needs the RPC token. During the one-time move, replace the old
path-derived origin after its pending originals are resolved and the restored
account is verified.

In Android Wallet, open **Network → Network details** to copy the RPC URL,
chain ID, and genesis hash. **Reveal RPC token** requires device
authentication and hides the token again after 30 seconds.

From an Android account, **Reveal recovery phrase** opens the saved words
after authentication. **Copy recovery phrase** copies those words for the
selected account. Use a current Android Wallet build with the native RPC.

## Send RDC and work with contracts

Choose **Receive** to copy your `riad1…` address. Choose **Send**, enter
the recipient and amount, then review the fee quoted by the node before signing.
Keychain also quotes fees for token and NFT transfers and contract actions.
Contracts use `rct1…` addresses. See [accounts and permissions](/protocol/accounts/).

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
