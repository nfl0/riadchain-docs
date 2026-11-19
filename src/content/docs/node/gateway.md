---
title: Application access gateway
description: Expose named app operations through scoped service identities while keeping native RPC and policy administration private.
---

Riadchain Gateway connects applications to an existing private network. It checks
current on-chain rules before reading a contract or submitting a managed call.
The application receives the named API you configure. Native RPC and the node
credential stay on the operator side.

## Choose a listener

In the Gateway configuration referenced by `GATEWAY_CONFIG_FILE`, revision 59
networks use `post-quantum-admin` for a local policy dashboard, or
`post-quantum-service` for that dashboard and the authenticated application relay.
Pin the chain ID, full 96-character genesis hash, `rct1…` policy contract,
reviewed code SHA-256, and upstream node. Use a protected `nodeTokenFile`.

| Default port | Listener | Exposure |
| --- | --- | --- |
| 4180 | Named views and managed commands | Bind to loopback or a private interface reachable by the chosen TLS proxy or tunnel. |
| 4181 | NFT-authenticated policy dashboard | Keep private, for example behind an SSH port forward or private HTTPS. |

The current native dashboard verifies a wallet's ownership of the Gateway admin
NFT and displays the policy. Configure rules and native allowances through reviewed
operator transactions. Sign-in does not authorize a policy change. The Gateway NFT
controls this application policy, separate from any chain-wide decision.

## Authorize an application

Register the application and a service client. Bind a specific connection to the
exact host, application, client, and authentication method. Give it individual
rules for the contract methods it needs. A named view or command pins the contract
code and the complete expected arguments. Review what each read returns before
granting it.

The relay supports a scoped bearer credential or Cloudflare Access, selected by
the registered connection. Access requires a signed application assertion with
the pinned issuer, audience, and exact service-token client ID. The empty user
subject can be present or omitted in the signed assertion. A failed Access check
never falls back to bearer authentication. Keep the service credential out of
browser bundles. [Cloudflare application token claims](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/#service-token-authentication)

| Operation | Endpoint |
| --- | --- |
| Read a pinned contract view | `GET /apps/{application}/views/{rule}?input={encodedArguments}` |
| Check a managed call | `POST /apps/{application}/preflight/{requestId}` |
| Submit a managed call | `POST /apps/{application}/commands/{requestId}` |
| Check the original command | `GET /apps/{application}/commands/{requestId}` |

Send `X-Riadchain-Connection-Id` with the registered selector and the associated
authentication proof. Use the [contract-view value codec](/developers/contract-arguments/)
for typed arguments. The named view response includes the full native network
anchor and the policy epoch. Native RPC, global history, FILE uploads, and the
admin API are outside this listener's scope.

## Manage signing and recovery

A managed wallet starts paused. Enable it only after reviewing the exact fee
allowance, target contract and method. The worker signs the restricted call,
reserves its fee, and records its original bytes before broadcast. Application
clients hold their service credential. The wallet's signing key remains on the
Gateway host.

A timeout or lost reply leaves the original pending reconciliation. Check the
same request ID and require a matching successful execution receipt before
reporting success. Pausing the wallet prevents new signing and dispatch while
retaining its journal. Removing a permission stops future authorized calls and
cannot retract a transaction already admitted by the node.

Applications that poll should bound their request rate and timeout. Keep one
shared projection when multiple visitors need the same views. Cancel a request's
timeout after the full response body is consumed so idle serverless runtimes can
sleep between polls.

For the protected configuration and source-build steps, see
[the Gateway implementation guide](https://github.com/nfl0/riadchain/blob/master/apps/Riadchain-gateway/README.md).
