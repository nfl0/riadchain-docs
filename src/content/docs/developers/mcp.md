---
title: MCP for agents
description: Connect agents to Riadchain through the current MCP protocol, bounded reads and explicit transaction plans.
---

The Riadchain MCP server exposes network queries and addressable blockchain
resources to AI agents. It uses the official MCP TypeScript SDK v2.3.0 and
protocol **2026-07-28**, with modern discovery and request metadata over stdio
or Streamable HTTP. Older protocol traffic is rejected; configure a client that
supports this protocol revision. A package update alone does not select the
modern wire protocol.

:::note[Revision 59 compatibility]
The MCP server currently uses the earlier provider API. Its network tools do not
yet work with revision 59. To build an integration for a current node, start
with the [workspace NetworkClient](/developers/sdk/#connect-to-revision-59).
:::

## Start with read-only access

From your repository workspace with a compatible earlier node:

```sh
bun install --frozen-lockfile
RIADCHAIN_NODE_URL=http://127.0.0.1:8545 bun run mcp-server/src/index.ts
```

Point your MCP client at the `bun` command and the absolute
`mcp-server/src/index.ts` path. Use the node URL for your actual home or company
deployment. Read-only mode is the default; it exposes status, accounts,
transactions, receipts, blocks, tokens, contract views and storage queries.
The stdio channel contains protocol frames; logs go to stderr.

The repository's Tournament client also pins `2026-07-28`. The optional external
model test harness can spend funds and requires deliberate operator setup; it is
not a read-only connectivity test.

## Discover names

Set both `RIADCHAIN_MCP_CHAIN_ID` to your verified consensus chain ID and
`RIADCHAIN_MCP_NAME_REGISTRY` to your deployed [RiadNames](/apps/names/) contract
address. The pair defines the namespace your agent reads. Missing configuration
produces an explicit error rather than assuming a public registry.

- `riadchain_get_name` reads one canonical name and its complete record.
- `riadchain_list_names` returns a bounded directory page, with a maximum of
  50 entries and decimal-string cursors.
- `riadchain://names/<encoded-chain-id>/<registry>/<name>` addresses a named
  record as an MCP resource.

Name results include their scope and identify their profiles as owner-declared.
Reads verify the expected chain before and after querying. The MCP server does
not connect to service descriptors or download FILE roots merely to resolve a
name. An agent must separately trust the record owner, verify the destination and
obtain any required device capability before interacting.

## Explicit writes

Signing is disabled unless an operator explicitly enables custodial or delegated
mode with an alias allowlist and intent policy. Delegated mode uses an on-chain
capability with its own contract, method, expiry, gas and fee limits; it does not
give an agent the homeowner's or validator's key.

Use `riadchain_plan_transfer`, `riadchain_plan_contract_call` or
`riadchain_plan_contract_deploy` to prepare an exact transaction. Plans persist
before being returned and reserve their inputs. Submit the same plan with
`riadchain_submit_plan`, then inspect `riadchain_wait_for_transaction` and its
matching execution receipt. Lost responses remain unresolved; do not rebuild an
uncertain action with a new ID. See [transaction recovery](/developers/transactions/).

For Streamable HTTP, use `bun run mcp-server/src/index.ts --http`. The server
binds to loopback by default and checks Host and Origin headers. HTTP signing
requires a separate per-principal bearer binding; tokens belong in private
operator/client configuration. Remote binding requires explicit opt-in and a
TLS/authentication gateway. Never expose owner keys or node credentials to model
responses or logs.

Full environment and signing-policy examples are in the
[MCP server README](https://github.com/nfl0/riadchain/blob/master/mcp-server/README.md).
Protocol details: [official MCP specification](https://modelcontextprotocol.io/specification/2026-07-28)
and [official SDK release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0).
