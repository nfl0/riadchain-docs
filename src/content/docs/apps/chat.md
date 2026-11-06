---
title: Riad Chat
description: Configure encrypted messaging, protect message keys and guest links, and recover FILE uploads.
---

Riad Chat has a native mobile interface and a standalone browser interface for
sponsored guests. Configure a Chat contract on your verified development chain;
there is no assumed public contract address in the mobile app.

## Activate native messaging

In the [native wallet](/apps/native-wallet/), select an account and verified
network, open **Messages**, and save that chain's Chat contract address. Activate
Chat to publish the account's separate message public key. Direct conversations
require the recipient to have activated Chat too.

Native conversation creation, messages and attachments use explicit account
transaction reviews. Device authentication unlocks the needed secrets. History
loads in bounded pages, and plaintext is cleared when its foreground session ends.

## Back up the message key

The wallet recovery phrase alone does not restore an existing Chat message
identity. Before clearing app data or removing an account:

1. Open **Messages → Message key backup** on the correct account, chain and Chat
   contract.
2. Choose **Prepare encrypted backup** and authenticate.
3. Copy the encrypted JSON and save it with the wallet recovery material.

To restore, first restore the wallet account and configure the same network and
contract. Paste the encrypted message-key backup and choose **Unlock and restore**.
The app verifies its account, chain, contract and published message public key.
A backup belonging to another scope cannot replace the key.

## Invite a sponsored guest

A guest invitation creates a scoped guest identity and prepaid capability.
Review its fee budget, allowed methods, FILE allowance and expiry before funding.
If creation is interrupted, recover the original invitation instead of making a
second grant. Private invitation credentials are retained in authenticated device
storage before the grant begins.

:::caution[The invitation is a credential]
The link contains the guest mnemonic, invitation secret and conversation key in
its URL fragment. Anyone holding the link can use its scoped access. Share it
privately; browser history may retain it. It contains no creator wallet key or
node bearer token.
:::

Opening a guest link inspects access without spending. **Join conversation** is
an explicit transaction using the prepaid fee balance. The browser verifies
chain, sponsor, guest and capability before enabling writes. Expired or revoked
access can leave readable history while disabling new messages.

Revoking the contract invitation stops future guest conversation writes. Revoking
the native capability also stops sponsored FILE spending and reclaims its unused
fee balance. Revocation cannot erase history or a key already shared with a guest.

## Encrypted attachments and interrupted sends

Attachments are encrypted before using native FILE transactions. The node stores
encrypted object bytes in its local content-addressed archive; the chain commits
their reference and metadata. Upload confirmation does not itself send the
message. A confirmed attachment can be reused by the eventual message without a
second FILE fee.

If a send or upload becomes unknown, keep its original ID and use the receipt
check. Sending stays paused. Retry an interrupted upload against that same FILE
transaction, rather than creating another upload. The native app retains encrypted
draft bytes for recovery. Browser guest upload retry needs the original encrypted
bytes in the current tab; after reopening, those bytes may be unavailable. Check
the original receipt before starting another upload.

Attachments load on request, with CID and size checks before showing decrypted
content. Membership, timing, sizes and CIDs remain public metadata even though
message and attachment contents are encrypted.

## Notifications

Notifications are opt-in and contain generic text, not decrypted messages. The
native foreground monitor checks the latest 20 conversations. It is not a
background push service, and an Android/iOS device is needed to verify permission
prompts, taps and lifecycle behavior.
