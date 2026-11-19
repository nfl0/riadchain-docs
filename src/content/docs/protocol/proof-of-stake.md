---
title: Proof of stake
description: Compare stake-based succession on private Riadchain networks with the experimental public quorum protocol.
---

Riadchain has two proof-of-stake designs for different operating conditions.
The current private node release uses [succession](/protocol/succession/) for
networks run by trusted participants. Public proof of stake is a separate
prototype for networks that need independent validators to agree on each block.

| | Private succession | Public PoS prototype |
| --- | --- | --- |
| Who produces blocks | One eligible owner at a time | Proposers rotate among a registered validator set |
| Why stake matters | An owner must meet the network's RDC eligibility threshold | Active bonded RDC determines each validator's vote weight |
| What confirms history | Valid signed blocks under the agreed succession rules | A certificate carrying strictly more than two-thirds of the active vote weight |
| When peers go offline | The current producer can keep producing. Eligible owners can take over after the waiting period. | Progress pauses if the reachable validators cannot form a quorum. |

The choice belongs to the network's signed genesis. Existing private networks
continue using succession when you install a node software update. They cannot
switch to public consensus from the same network configuration.

## How the public prototype reaches finality

The prototype uses Malachite's consensus engine. A proposer offers a block.
Validators verify the proposal against the previous certified state and vote
with ML-DSA-65 signatures tied to the network, height, round, and block ID.
A validator records its signed votes durably so that restarting it cannot erase
its obligations from earlier rounds. The node stores the block with its quorum
certificate before advancing the finalized ledger.

Three equal validators need all three votes. Two votes are exactly two-thirds
and fall short of the threshold. With four equal validators, three are enough.
A two-to-two split therefore makes no new block final. Finalization resumes when
participants can form a quorum again.

In the prototype, signed genesis registers the approved validators and reserves
their bonds. A validator can change the active portion of its own reservation.
The previous weights certify the block carrying the change. The new weights apply
from the following height, giving every node the same authority boundary.

## Release status

Isolated three- and four-validator tests covered quorum loss and recovery,
validator restarts, transfers and FILE availability. The four-VM tests also
verified a bonded-weight change using the old quorum for the change and the new
quorum afterward. These tests establish behavior for the tested fixtures.

Public PoS is outside the current production node package and hosting plans.
Production qualification still needs a complete validator lifecycle, including
admission, exit, withdrawals and equivocation handling, plus authenticated public
bootstrap and operating procedures. The planned public profile allows open use
with approved block producers. Permissionless validator admission remains a
separate design decision.

See the [public proof-of-stake roadmap](https://riadchain.com/blog/a-path-to-public-proof-of-stake/)
for the design goals and the [private succession guide](/protocol/succession/)
for today's operator workflow.
