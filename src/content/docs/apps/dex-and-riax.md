---
title: RiadDEX and Riax
description: Review token trades and liquidity actions, use social profiles, and understand Riax audited-message privacy.
---

RiadDEX is the token trading interface; Riax is the on-chain social interface.
Both use [Keychain](/apps/keychain/) for browser account access and approvals.
Use deployment configuration for your development chain. A repository manifest
or sample URL is not evidence of a live public deployment.

## RiadDEX trading

Connect the intended wallet account and network. The app checks that its node
relay, selected deployment and wallet report the same chain before enabling
transactions. Pools load in bounded pages, and failed balance reads remain
unavailable instead of becoming zero.

For a swap, choose tokens and amount, then inspect the quote and review. Check:

- input amount, expected output and minimum output;
- price impact, pool fee and estimated native network fee;
- token spending limits, recipient, contract and selected network.

Swap and liquidity minimums use the displayed 0.5% slippage tolerance. Small
amounts can be rejected when integer rounding would leave no usable quote. High
price impact requires an acknowledgement in review; it is still part of the
trade's cost, not the network fee.

Liquidity review shows the contributed assets or withdrawn shares and minimum
results. Pool ownership and permitted fee-management actions are determined by
the contract. A pool with zero liquidity can be seeded again; accumulated fees
and its pool NFT ownership remain separate from the new contribution.

Continue to Keychain only after checking the reviewed limits. A successful receipt
is required before reporting execution success. An uncertain response retains
the original ID for inspection; do not submit a replacement merely because a
receipt was slow. Trades, balances and contract interactions are public chain data.

## Riax profiles and posts

Create a profile with a canonical lowercase handle: letters and digits, with
single interior dots or hyphens. Profile owners can edit their display name, bio
and avatar reference without replacing the handle or message identity.

The feed loads root posts in pages of 20. Replies load separately, and search
covers the loaded posts rather than the entire history. Reaction totals include
all supported reaction types. Posts, replies, follows, reactions and profile
data are public contract state.

Riax reviews writes before Keychain approval and checks that the wallet and relay
use the configured chain. Inclusion alone does not establish successful execution.

## Riax encrypted messages are auditable

:::caution[Different privacy model from Riad Chat]
Riax messages include a recipient envelope and a separate administrator audit
envelope. They are **admin-auditable encrypted messages**, not private messages
hidden from the audit-key holder. Sender, recipient, timing and ciphertext remain
public chain metadata.
:::

Profile creation generates a dedicated message identity. Its local private key
is wrapped using a verified account-bound Keychain signature; it is not stored
in plaintext browser storage. Export its encrypted backup from the Profile view
before clearing site data. The wallet's own backup does not restore that identity.
Import requires the matching account and published message key.

If profile creation has an unknown outcome, keep the prepared identity and check
the original transaction. Deleting it can lose access to messages for a profile
that actually committed. For ordinary conversation messaging without Riax's audit
envelope, see [Riad Chat](/apps/chat/) and its separate privacy boundaries.
