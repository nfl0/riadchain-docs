---
title: What is Riadchain?
description: A private, permissioned blockchain for homes and companies, with trusted validators, contracts and native FILE storage.
---

Riadchain is a **private, permissioned blockchain for homes and companies**.
An operator creates a network for that environment, chooses its starting allocations
and enrolls trusted nodes. A home and a company can run separate networks; they do not
automatically share validators, balances, contracts or file archives.

The native node is written in Rust. Trusted validators produce signed blocks
through a succession protocol, and followers independently verify and replay that
history. It is not an open network of mutually distrusting validators.

The project is in active development. Protocol formats and APIs
can change directly; these guides describe the current implementation rather than
promising compatibility with earlier releases. There is no shared public mainnet
to join in these guides; your operator provides the identity and endpoints for
your particular deployment.

## Private and permissioned

The home or company operates its own chain and controls peer enrollment and
access to node endpoints. Production eligibility follows a signing account's
minimum confirmed spendable balance. One network's genesis,
balances and contracts belong to that deployment. Adding a machine as a follower
does not fund its wallet, and owning a wallet does not make someone a
network operator.

Permissioning is not encryption. Parties with access to the network may read
on-chain data and retrievable FILE bytes. Applications that need confidentiality
must encrypt sensitive content and manage the corresponding keys.

## What the system provides

- **RDC:** the native currency, represented with integer base units.
- **Charlie contracts:** a stack-based runtime with a TypeScript high-level
  compiler for readable source, typed method arguments and ABI generation.
- **Native assets:** token operations integrated with the node's authoritative
  state and deterministic execution.
- **FILE storage:** canonical content identifiers and metadata, with bytes stored
  in a node-local content-addressed archive and replicated independently.
- **Wallets and applications:** a browser extension, web and mobile wallets,
  messaging, markets, trading, games and home controls.

## Trust and authority

Signed genesis defines the chain's starting authority. Canonical signed blocks
extend that history; checkpoints and query indexes accelerate access but do not
replace it. A joining node needs the exact authenticated genesis artifact and
must verify the history it accepts.

Network participants coordinate protocol upgrades outside the chain. Signed genesis fixes the initial parameters, and agreed activation heights select independently numbered protocol rules. There are no on-chain votes or chain admin keys.

## State and availability

A confirmed FILE record proves that the chain accepted its metadata. It does not
prove that every node currently has the object bytes. Archive operators must
retain, verify and back up those bytes separately from canonical history.

Likewise, a submitted or included transaction is not automatically a successful
contract operation. Applications must check its matching execution receipt and
retain the original transaction ID when the outcome is uncertain.

Continue with [choosing your path](/start/choose-your-path/), the
[succession protocol](/protocol/succession/), or [storage](/protocol/storage/).
