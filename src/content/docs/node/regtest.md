---
title: Fast regtest networks
description: Start a funded, isolated local development network with 100 ms blocks and the real native execution engine.
---

Regtest uses the native signature validation, Charlie execution, FILE archive,
gas limits and succession rules, with **100 ms blocks** instead of ten seconds.
The local launcher supplies a disposable funded wallet for contract development.
It needs no appliance Manager, phone, Docker or faucet RPC. Test RDC has no
monetary value.

## Start a funded local node

Use Linux, Bun 1.3.11 and the repository's workspace dependencies. Source access
to the current private Riadchain repository is required. From its root:

```sh
bun install --frozen-lockfile
bun run regtest:start
bun run regtest:status
```

The launcher starts one native validator at `http://127.0.0.1:19545` and allocates
**100,000 disposable RDC** to its local owner wallet in signed genesis. Blocks
start automatically. A fresh chain activates the installed native binary's latest
supported protocol at height 1; restarting retains its original schedule.

If the debug binaries are missing, `start` builds `riadchaind` and `riadchain-cli`
with the pinned Rust toolchain. After changing Rust source, rebuild explicitly;
the launcher does not detect stale existing binaries:

```sh
cargo build --locked -p riadchain-node --bins
```

Use `--bin-dir /absolute/path/to/bin` with the underlying launcher to select an
already built pair of native executables.

## Deploy the Ping reference

The launcher writes `.tmp/regtest/deployment.json`, a private local input for the
[Ping reference dapp](/build/ping-reference/). It contains the chain identity,
protected wallet and RPC file references, a separate deployment journal directory,
a 30-day capability lifetime and a 500 RDC fee escrow. These are application
inputs, not changes to network rules.

```sh
# Inspect the plan; this creates local deployment identities without sending.
bun dapps/Ping/scripts/deploy.ts --config .tmp/regtest/deployment.json

# Deploy, initialize and grant the report-only collector capability.
bun dapps/Ping/scripts/deploy.ts --config .tmp/regtest/deployment.json --apply
```

The second command spends disposable test RDC. It journals each original signed
transaction before submission and requires its matching successful receipt.
Retain that journal when a result is uncertain; rerunning reconciles the same
deployment instead of creating another one. Other dapps can reuse the funded
wallet and connection with their own deployment scripts.

## Stop and reuse the fixture

```sh
bun run regtest:stop
bun run regtest:start
```

The default state directory is the ignored `.tmp/regtest/`. Repeated starts reuse
the wallet, signed genesis, RPC credential, port and canonical
history, or report the already running daemon. `stop` verifies the exact saved
process before sending SIGTERM and waits for draining. It never kills a different
listener or forces termination.

Status is read-only and returns public identities, height/readiness when running,
and protected file references. `node.log` contains daemon diagnostics. A missing
original identity or changed configuration fails closed. There is no wipe or
reset command.

For a separate fixture, choose a fresh state directory and unused loopback port:

```sh
bun tools/regtest/cli.ts start --state-dir .tmp/regtest-other --port 19546
bun tools/regtest/cli.ts status --state-dir .tmp/regtest-other
bun tools/regtest/cli.ts stop --state-dir .tmp/regtest-other
```

## Keep development custody isolated

The owned mode-0700 directory contains mode-0600 files. Its `owner.json` uses the
CLI's explicit **plaintext** account custody; `producer.key` holds the same
disposable account's native signing key. `rpc-token` protects client queries and submissions even
on loopback. Keep these files out of browser bundles, logs and source control.
Never fund these disposable keys on a real network or reuse a home node's data,
genesis or credentials here.

Mode and cadence are authenticated by genesis. No daemon flag can turn a private
chain into regtest or bypass its authorization, funding or execution limits.
Keep local fixtures separate from established networks.

Source: [local launcher and its focused native fixture](https://github.com/nfl0/riadchain/tree/master/tools/regtest).
