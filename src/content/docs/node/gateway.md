---
title: Application access gateway
description: Restrict application access to an existing private chain with on-chain rules and a separate local dashboard.
---

Riadchain Gateway is a separate service for exposing selected application
operations from an existing private network. It does not require another chain
or a different node type. The repository contains the management contract, SDK,
local dashboard and Docker packaging; this guide does not announce a deployed
public gateway.

## Multiple applications, individual rules

The management contract holds named gateway instances. Each instance can register
several applications, such as Notes, with multiple rules per application.
An application or rule can be paused independently. Missing rules deny access.

Rules select one authenticated wallet or any authenticated wallet, plus an
optional condition evaluated from current chain state. Conditions can require a
native token balance, including ownership of a particular NFT, or an exact value
in another contract's storage. The service pins the reviewed contract code.

| Rule | Selected access |
| --- | --- |
| Contract view | One contract, method and complete set of argument constraints. |
| Signed contract call | Same scope, bounded gas/value and explicit token-spend limits. |
| Events | One contract and event name, with bounded pagination. |
| FILE | One exact CID, with retrieval chunks up to 64 KiB. |
| Balance | One account or the authenticated caller, and RDC or one native token. |

Arguments can be fixed, bound to the caller, or explicitly allowed to vary. Extra
or missing argument fields are rejected. Read grants must be reviewed against
what that contract view or event returns: gateway filtering does not make all
other chain state private from full network participants.

This first version does not relay global block/history queries, mempool,
arbitrary contract storage, peer synchronization, native administration, FILE
uploads or delegated capability transactions. It uses the existing binary
Connect/protobuf queries and signed transactions rather than another node API.

## Separate administration

Only the deployment-bound bootstrap account can initialize the management
contract. It creates its admin NFT once and mints it directly to the separately
pinned recipient. The funded deployer pays the deployment; the recipient keeps
its own private key. There is no public first-caller claim or
later mint path. Policy changes check the current holder of that exact NFT.
This is application authority, not chain governance. Other application roles
remain separate from Gateway administration.

Transferring the NFT transfers gateway policy administration. Burning it or
losing its keys locks administration; there is no hidden bootstrap-owner bypass.
Choose the recipient and any explicit recovery design before deployment.

The dashboard requests wallet authentication and separately reviews each policy
transaction before signing. Private administration has a 30-minute idle timeout
and a 12-hour absolute limit. Actual foreground interaction renews it only after
checking the wallet and current administration rights; receipt polling does not.
Switching tabs preserves drafts and the connection, discards unsigned reviews and
pauses checks. Returning verifies the current wallet and policy. Account/network
changes, wallet-access revocation or explicit disconnect clear the active scope. Session tokens
remain in memory, so page reloads and service restarts require authentication.

For a contract rule, enter its deployed address. The dashboard calculates and
shows the SHA-256 of its exact Charlie code before review. You can paste an
independently calculated hash for comparison; mismatches block review. Both rule
and storage-condition code pins are checked again before initial dispatch.
Review prepares a change; the wallet signature and successful execution apply it.

**Import rule JSON** in the rule editor accepts a pasted rule object and fills the
editable form. It validates the schema and selected application; existing rule IDs
cannot be changed. Contract hashes may be omitted for lookup, while supplied
hashes must match deployed code. Loading an import does not submit a transaction:
review the resulting permissions and fingerprints before signing.

**Import rules ZIP** loads a flat archive of up to 64 rule JSON files for the
selected application. A generated rules archive may also contain its `manifest.json`
index and `README.md`. The importer validates the whole archive before review,
including supplied code pins and manifest chain identity. Limits are 1 MiB for
both the archive and total expanded content, and 32 KiB per entry. Encrypted
archives, duplicate files, and conflicting or existing rule IDs are rejected.

The queue groups up to 32 rules into one reviewed transaction, so a typical
policy update needs one wallet signature. The contract validates every rule,
rejects duplicate IDs and applies the whole batch atomically with one policy
epoch increment. An invalid entry rejects all changes in that transaction.
Only a matching successful receipt advances the queue by the complete batch.
An uncertain outcome pauses it for reconciliation; reloading restores its public
rules and original transaction journal for the same wallet, chain and application.

The dashboard retains the original signed transaction before
submission. The service keeps durable submission journals, while policy remains
on-chain. It stays on the current page and checks confirmation automatically while
active, with a bounded retry period and a manual receipt check as fallback.
A timeout is unresolved, not permission to create a replacement. A caller
can still check the sanitized outcome of its own saved original after access was
revoked; this does not authorize a new transaction.

## Private deployment

Keep native RPC private: direct node calls do not consult gateway policy. Pin the
existing consensus chain ID, original genesis hash, management contract address
and its code hash in protected local configuration. The service checks current
node readiness and policy for each request and denies access when verification
fails. Revocation blocks new gateway requests; it cannot retract a transaction
already admitted by the node.

The Docker service has separate relay and administration listeners:

| Port | Purpose | Default host exposure |
| --- | --- | --- |
| 4180 | Authenticated application relay | Loopback, for the selected proxy/tunnel. |
| 4181 | Local dashboard and administration | Loopback, kept private. |

Node credentials stay in protected server-side files. Customer and administrator
signing keys stay in their wallets. The gateway container receives no owner key.
Use TLS outside loopback and explicitly list browser origins; CORS alone does not
authenticate callers. Expose only the relay through public routing.

The default remote-administration path is an SSH port forward from a workstation
to the Docker host's loopback listener. Open `http://127.0.0.1:4181` locally.
Direct remote browsing requires private HTTPS: plain LAN HTTP cannot provide the
browser Web Locks needed to prevent duplicate cross-tab submissions. The current
[Keychain custody limitations](/apps/keychain/) still apply before privileged
production use.

## Build and test from the checkout

The Gateway contracts and application use the
[monorepo toolchain](/developers/sdk/#develop-in-the-monorepo). From a configured
checkout:

```sh
bun dapps/Gateway/contracts/build.ts
bun sdk/scripts/build-dts.mjs
bun run gateway:verify
```

`RIADCHAIN_RUN_GATEWAY_NATIVE=1 bun test dapps/Gateway/contracts/native.test.ts`
opts into a short, isolated native regtest test. It verifies actual SDK, wallet
authentication, relay/protobuf and Rust behavior, then removes its fixture. There
is no persistent full demo or extra deployed billing network.

Deployment is separate from compilation. The journaled deployment example
prepares and simulates by default; explicit `--apply` broadcasts reviewed
originals subject to an aggregate fee ceiling. Follow
`dapps/Gateway/README.md` and `apps/Riadchain-gateway/README.md` for protected
configuration, image packaging, listener routing and exact deployment commands.
Local checks do not establish a deployed Docker host or public tunnel.
