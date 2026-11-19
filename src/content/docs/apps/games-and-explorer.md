---
title: Games and Explorer
description: Play reviewed on-chain Nim and inspect transactions, execution receipts and FILE availability.
---

RiadGames provides on-chain Nim. Explorer reads the node's chain and operational
data. These are source applications for configured development networks; neither
an old deployment manifest nor a compiled UI proves a public deployment is live.

## Play Nim

Configure the Games node URL, chain ID and current Nim contract address, then
connect [Keychain](/apps/keychain/). Without a valid contract configuration the
app shows setup rather than treating an old manifest as a live game.

Nim uses the misère rule: **the player taking the final token loses**.

1. Create a board with one to eight heaps, each containing one to 64 tokens.
2. Invite another account, or invite your own account for solo practice.
3. The invited player joins a waiting game.
4. On a turn, remove a positive number of tokens from exactly one heap.

Completed rounds automatically restart the original board, retaining the score
and last result. Solo practice counts completed rounds rather than a competitive
win/loss result. Forfeiting an active competitive round awards the other player
the win; cancelling an invitation is available only to its creator before the
other player joins.

Each action opens a review before Keychain. The app rechecks the selected board,
turn, account, chain and funding; a changed game requires a fresh review. The lobby
uses pages of 20 and keeps the selected game fresh independently. An uncertain
submission preserves its original ID and pauses repeat actions.

## Inspect the chain with Explorer

On revision 59, Explorer reads blocks, transactions, account activity, contract
views and events, and FILE availability through the native RPC. The overview shows
recent blocks and transactions together. Open a block for its signed transactions
and execution results. An account page can browse its confirmed history in
bounded pages.

Recent execution results can use the node's receipt cache. For older blocks, the
node reconstructs execution from signed history, starting from the nearest
available checkpoint. A historical read can therefore take longer. See
[native RPC](/developers/rpc/) for history cursors and replay.

On a transaction, separate submission and inclusion from execution. A receipt's
success and execution status must agree, and the receipt must match the requested
transaction and block. A failed contract execution can still be included in a
block. A missing receipt leaves execution unverified.

Network status distinguishes unavailable checks from healthy results. A lack of
peer-comparison evidence is not proof that a node caught up, and a succession
block's details describe its actual proof source.

## FILE content and availability

FILE metadata and a CID do not prove the node has the object bytes. Inspect its
availability separately. Content previews load when requested, are bounded, and
support text and selected raster-image formats. An unavailable preview does not
erase the on-chain reference.

Explorer uses a read-only server relay. Its node access token stays server-side;
the browser cannot submit a transaction through that relay. Viewing public chain
data does not grant control of an account, game or contract.

The Docker deployment packages the verified UI and server bundle, without the
development workspace. Mount the existing node RPC credential as a protected
read-only file using `EXPLORER_NODE_TOKEN_FILE`; the browser and image receive no
credential. Bind the host port to your private interface for LAN access. The
container runs with a read-only filesystem and bounded resources. Its readiness
check covers the UI shell; verify a chain query before switching deployments.
See the [Explorer deployment README](https://github.com/nfl0/riadchain/blob/master/apps/Riadchain-explorer/README.md)
for the build, credential-file ownership and Compose settings.

## Developer checks

From the repository root, use `bun test dapps/Games/src` and
`bun run games:dapp:build`. Inside `apps/Riadchain-explorer`, use `bun run test`,
`bun run typecheck`, `bun run build`, and `bun run compile` for the server bundle.
These source checks do not demonstrate a deployed app or a live transaction.
