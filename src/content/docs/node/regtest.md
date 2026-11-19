---
title: Local network development
description: Exercise the native execution engine in an isolated checkout or on a separate disposable private network.
---

Use a separate genesis, data directory and credentials when testing contracts,
FILE uploads or peer recovery. A production node's signed genesis fixes its
block cadence. The daemon does not have a flag that turns an existing network
into a fast test network.

## Run the native smoke harness

With implementation source access, use the repository's pinned Rust toolchain
and lockfile. The native harness signs and validates disposable state without
installing the Manager service:

```sh
cargo run --locked -p riadchain-node --bin riadchain-network-lab -- demo
```

For an integration that needs wallet RPC and ordinary block production, use the
[native network quickstart](/node/quickstart/) with fresh directories and an
unused loopback listener. Choose an independently funded test account in that
genesis. Use the same bounded RPC and receipt reconciliation your production
application uses. Genesis funds on an isolated test network have no monetary
value.
