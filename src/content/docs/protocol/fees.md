---
title: Fees and gas
description: Calculate integer fee reservations, gas refunds and FILE storage charges using active protocol parameters.
---

Transactions pay fees in RDC base units. One RDC is 100,000,000 base units, also called satoshis in the implementation. All fee arithmetic is integer arithmetic.

Read the selected node's active fee schedule and gas limits through `NodeService.GetProtocolParams` or `getProtocolParams()`. SDK defaults help construct transactions but do not override a chain's genesis values.

## Reserve the maximum fee

The maximum required fee combines the following components:

```text
maximum fee = base fee
            + signed encoded transaction bytes × byte rate
            + declared FILE size × storage rate       (FILE only)
            + execution fee(declared gas limit)       (CONTRACT only)

execution fee(gas) = ceil(gas / gas units per bucket) × gas rate
```

Use the canonical signed wire size rather than a displayed JSON string length. Signatures and the final transaction representation affect byte fees.

The initial implementation defaults are:

| Parameter | Default |
| --- | ---: |
| Base fee | 100,000 base units |
| Transaction byte rate | 100 base units per byte |
| Gas rate | 1 base unit per bucket |
| Gas bucket | 10 gas |
| FILE storage rate | 1,000 base units per byte |
| Per-transaction gas ceiling | 10,000,000 gas |
| Block gas ceiling | 50,000,000 gas |

For ordinary UTXO funding, the difference between inputs and signed outputs reserves attached value and fees. Admission requires enough fee budget for the full declared gas limit. Attached native value, a new capability's fee budget and capability top-ups are separate reserved value, not validator fees.

Leaving more than the required budget is a validator tip. The node refunds unused execution gas; it does not automatically refund an arbitrary excess fee budget.

## Charge execution and refund unused gas

The VM reports deterministic gas usage. The refund is the difference between the rounded maximum and actual execution fees:

```text
gas refund = execution fee(gas limit) − execution fee(gas used)
fee charged = reserved fee budget − gas refund
```

Round each execution fee independently. With ten gas per bucket, a limit of 11 gas costs two buckets while usage of 10 costs one; calculating a fee from the one-gas difference would give the wrong boundary behavior.

For ordinary contract transactions, the refund becomes a derived UTXO for the authenticated sender. For delegated calls it returns to the same capability fee vault. Receipts expose charged fees and gas refunds.

Derived outputs are created at the containing block's height and cannot be spent in that same block. A multi-step client workflow must use other confirmed funding or wait for the earlier step's outputs to become spendable.

## Failed calls still have receipts

An admitted contract transaction can confirm with failed execution. Contract payload changes roll back; fees still settle deterministically. Attached native value returns to the sender on failure, and unused-gas refunds still follow the reported usage. An out-of-gas call consumes its full declared limit and has no gas refund.

Signature, shape or funding rejection at admission does not confirm or charge a transaction. A transport timeout does not prove rejection: preserve the transaction ID and inspect its outcome.

Applications should distinguish `confirmed` with successful execution from a failed receipt and from a pending or unknown outcome. Block inclusion alone does not establish contract success.

## FILE and scheduled-call fees

FILE transactions pay a one-time storage charge for their declared byte size, plus base and transaction-byte fees. Staging bytes alone is not a charged on-chain action. Mining still requires verified content and the active availability policy.

There is no recurring protocol storage rent. The node must maintain the [confirmed archive](/node/file-archive/) despite that one-time payment model.

A scheduled contract call prepays its declared gas budget when scheduled. Later execution reserves the same gas capacity without charging another execution fee. Cancellation does not return the already paid execution budget.

## Use simulation as an estimate

Simulation reports reservation, gas usage, refund and fee information without committing state. It depends on the state at the time of the read. A successful simulation cannot guarantee success after another transaction changes that state.

Build using live parameters, choose a bounded gas margin and recheck funding and expiry after user review. Blocks reserve declared contract and due scheduled-call gas against the block gas ceiling, even when actual usage is lower.

Validator subsidies and charged fees accumulate in a native reward vault. Claiming rewards is itself an ordinary fee-paying action, so a validator needs a spendable output for the claim's fee.
