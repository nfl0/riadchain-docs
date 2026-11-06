---
title: Native wallet
description: Configure the mobile wallet, back up an account, review transfers and recover interrupted sends.
---

The Expo mobile app includes accounts, networks, RDC and token transfers, activity,
a dapp browser and encrypted Notes. Home and Messages are currently hidden,
including Chat polling; their implementation and saved configuration remain available
for later deployment.

:::note[Development status]
Riadchain is undeployed. These instructions describe the source application and
local development builds, not a published store release or public deployment.
:::

## Choose an account and network

1. Open **Settings → Accounts** and add an account. Choose **Create** or **Restore**
   with an existing recovery phrase or private key.
2. Save the recovery material offline before continuing. Anyone holding it can
   control the account. Existing accounts expose recovery material only after an
   explicit reveal and device authentication.
3. In **Settings → Networks**, add your node URL and, if required, its access token.
   Choose **Check node**, verify the returned **Expected chain ID**, then save.
4. Select that account and network. Notes needs a verified contract address under
   **Settings → Sub-accounts**; the app does not assume a public deployment.

## Unlock the wallet

The wallet requests device authentication at launch and restores its selected
saved connection automatically. Cancelling leaves an **Unlock** screen; entering
Settings to unlock a connection is unnecessary. Returning from true backgrounding
requires a new unlock. Account or network selection within that foreground session
invalidates old approvals without another unlock prompt.

Transfers, reward claims, permission/funding changes and secret export still
require fresh authentication after review. Routine Notes edits and synchronization
reuse the foreground unlock. The current Android SecureStore implementation
requires enrolled strong biometrics; device-passcode fallback is not implemented.

A physical phone cannot reach a computer's node through `127.0.0.1`. For local
development, use the computer's reachable LAN address. Production builds require
HTTPS; the local development profile can permit HTTP explicitly.

## Receive and send

Use **Receive** to copy or display the selected account address. Verify the address
and chain with the sender.

For a transfer, choose RDC or a token, enter the recipient and amount, then select
**Review transfer**. Review shows the amount received, recipient, selected account
and network, reserved RDC fee, expiry block and transaction ID. **Max** reserves
the fee rather than promising the entire native balance to the recipient.

**Approve and send** authorizes the reviewed transaction. The app checks current
funding and chain identity, signs, and uses signed node simulation before sending.
Changing account, network or screen invalidates an old intention. No hidden
consolidation transaction is sent when a transfer is too large.

## Understand activity

| State | Meaning |
| --- | --- |
| Pending | The transaction is visible in the node's pending set. |
| Included | A block contains it; successful execution still needs a receipt. |
| Confirmed | A matching execution receipt reports success. |
| Failed | A matching receipt reports failed execution. |
| Unknown | The node or receipt could not establish the outcome. |

An interrupted send retains its original ID across restarts. Use **Check receipt**
or open its activity entry before trying another send. Timeout or disappearance
from the mempool does not prove failure. Unresolved submissions pause new writes
for that account and chain; the app does not automatically rebroadcast them.

## Backups and local storage

Account private keys and recovery phrases use authenticated Expo SecureStore.
Account names, addresses, public network profiles and history use AsyncStorage;
saved node access credentials are encrypted under an authenticated SecureStore
operational key and unlocked for the selected connection. Owner spending keys stay
separately authenticated. The app's dapp browser receives public network details without
the access token or account private key.

Chat uses a separate message identity. Save its
[encrypted message-key backup](/apps/chat/#back-up-the-message-key) as well as the
wallet recovery material before removing an account or clearing app data. The hidden
Messages feature does not erase its existing keys.

## Private Notes

Deploy the high-level Notes reference from `dapps/Notes`, verify its successful
deployment, then configure that address in **Settings → Sub-accounts**. Its FILE
downloads require the current node's authenticated binary chunk RPC. Each owner
has an independent notebook in the shared contract.

**Recover synchronized notes** derives a dedicated encryption key from the restored
owner account and exact chain/contract. The wallet phrase and original account
index recover synchronized notes; edits never uploaded from a lost phone require
that phone. A recovered device initially reads and edits locally. Grant it a fresh
limited permission to synchronize changes.

Each device gets its own Notes signing key, fee reserve, FILE byte allowance and
expiry. It can write/delete this owner's notes and upload encrypted attachments;
it cannot transfer owner coins/tokens, claim rewards or grant other devices.
Top-up adds RDC only. Renewal requires reviewed revocation/refund, reconciliation
of pending operations, then a replacement grant. No automatic funding occurs.

Text and attachments save encrypted in SQLite while offline. Foreground sync
coalesces edits and preserves original transaction IDs through interruptions.
Conflicting edits become clearly marked copies. Missing or unavailable data is
not silently treated as deletion.

Titles, text and attachment names/MIME types are encrypted. Account addresses,
opaque note IDs/revisions, FILE CIDs/sizes and transaction timing remain public.
The first version supports 10 MiB per attachment, up to 16 attachment descriptors,
and 45,000 UTF-8 bytes for the combined private note document. Larger edits remain
local with a sync error. Sharing, reminders, checklists, labels and trash are absent.

Deleting removes the current note, not historical ciphertext or archived FILE
bytes. Wallet recovery can still decrypt old ciphertext. Opening/exporting an
attachment deliberately hands plaintext to the selected application; Riadchain
cleans its own temporary export file after that operation, but cannot erase a
recipient's copy.

## Work from a checkout

From the repository root, install dependencies with `bun install`. For a local
device development session, use `bun run app:start:local`. Focused checks are
`bun run app:test` and `bun run app:typecheck`. Device authentication, WebView
approvals, notifications and lifecycle behavior require device verification;
TypeScript checks alone do not establish them.
