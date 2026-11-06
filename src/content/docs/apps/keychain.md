---
title: Riad Keychain
description: Use the Chrome extension wallet, encrypted keystore backups and explicit dapp approvals.
---

Riad Keychain manages accounts and signatures in a Chrome side panel. Browser
dapps can ask for account access and approvals; they do not receive private keys
or node bearer tokens.

## Load a local development build

The repository does not imply an installed or published extension release.
Chrome 116 or newer is required by the extension manifest.

From the repository root:

```sh
bun install
bun run keychain:build
```

Enable developer mode in Chrome's extensions page, choose **Load unpacked**, and
select `apps/Riad-keychain/dist`. Open the extension action to show its side panel.
Configure the node URL and access token in **Settings** for your own network.

## Create, restore and back up

Create an account or restore one using **Seed phrase** or **Keystore**. Seed
phrase import matches the mobile wallet's English BIP39 derivation at
`m/44'/60'/0'/0/index`. The phrase account index defaults to **0** and accepts
**0–31**. If the phone shows a different recovery account path, use its last
number. Additional BIP39 passphrases are not used. The phrase stays local, is not
saved, and clears when the restore form closes or the panel is hidden. Only the
selected account is imported; keep the original phrase separately.

A new account immediately offers a backup. **Back up** downloads an encrypted JSON
keystore protected with AES-GCM and a password-derived key. Use a password of at
least 12 characters, store it separately, and keep the backup outside browser
storage. The password cannot be reset. A keystore restores that account's key,
not the original seed phrase or other accounts derived from it. Existing
accounts and keystores continue to work.

:::caution[Backup encryption is not a wallet lock]
The downloaded keystore is encrypted. Current extension account storage in
`chrome.storage.local` includes plaintext private keys; this implementation does
not add a password lock or encryption for that local storage.
:::

Private keys appear only after **Reveal private key**. Copying is a separate
action, and the reveal hides after a short interval or when the panel loses
visibility or changes account/view. Account removal requires acknowledging that
a working backup exists.

## Connect a dapp

Check the requesting site's origin, selected account and network before granting
account access. Connecting does not grant general permission to sign. Each
message or transaction still requires approval.

A transaction approval shows recipients, change, contract method and native
value, token spending limits, a local fee estimate and full transaction details.
Preflight checks the canonical digest, input ownership and selected node's live
chain. It does not release a broadcastable signature before approval.

- **Approve and send** permits signing, signed simulation and submission. Failed
  or unavailable simulation prevents submission.
- **Approve signature** releases a signature to the requesting application,
  which may submit the transaction later.
- Message signing is a separate request. The wallet refuses bare transaction
  digests passed through that path.

Approval responses are bound to the requesting browser document. Navigating the
page cannot transfer its response to a replacement document.

## Offline and pending states

A failed balance or activity read is shown as unavailable, rather than zero.
Submitted transactions are pending; acceptance is not an execution receipt.
Applications such as the [web wallet](/apps/web-wallet-and-ide/) distinguish block
inclusion and successful execution. Keep the original ID when confirmation is
uncertain and check it before repeating the action.

The selected node supplies balances and simulation results. Public dapp network
details contain its URL, but omit its access token; a dapp reading directly from
that URL needs an endpoint that permits its read requests.
