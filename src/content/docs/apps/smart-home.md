---
title: Smart Home
description: Read authenticated telemetry, review homeowner commands and understand desired versus observed device state.
---

Smart Home connects a household controller contract, sensor publisher and actuator
gateway. The browser dashboard and native **Home** tab read the same contract
model. Use a controller deployed on your own verified development chain; the UI
does not assume a public deployment.

## Connect the controller

In the native app, select the verified network, open **Home**, enter the deployed
controller address and choose **Save home contract**. The browser app needs its
node, chain and contract deployment configuration plus
[Keychain](/apps/keychain/) for homeowner writes.

Reading a controller does not grant permission to control it. The selected
homeowner account can review writes; other accounts see a read-only dashboard.
An unavailable node or mismatched chain pauses controls rather than presenting
invented healthy readings.

## Read device state correctly

| Display | Meaning |
| --- | --- |
| Unknown / unmeasured | No authenticated sample or actuator acknowledgement exists yet. |
| Stale telemetry | A previous measurement exists, but its freshness window has elapsed. |
| Requested | The desired output recorded by an owner action or automation. |
| Last observed | Physical readback from the actuator gateway. |
| Awaiting acknowledgement | A command is pending; its physical result is not yet confirmed. |
| Fault | Readback or device behavior disagrees with the command or safety conditions. |

A successful transaction receipt confirms the on-chain request. It does not prove
that a door locked, a light changed or a valve closed. Those observations change
only after the gateway acknowledges the matching pending command. Contract
initialization defaults are not evidence of physical security or sensor readings.

## Review commands and automation

Review the selected account, chain, command, contract, fee and transaction ID.
Door unlock is an explicit homeowner action. Scenes and automatic policies can
hold or lock the front door; use the explicit unlock control to request entry.
Scene review includes the requested device outputs and temperature target, and
changed scene data requires a new review.

Stop automation before issuing manual commands when the UI requests it. Changing
a temperature target changes the target, not the measured temperature or last
observed heating/cooling state. A climate shutdown command is available for
manual recovery from conflicting physical readback.

A gateway acknowledgement that differs from requested outputs records the actual
readback, marks a fault and stops automation. A command left unacknowledged beyond
the contract's allowed block window can be expired by the homeowner without
pretending its physical result is known.

If submission becomes uncertain, use **Check receipt** for the original ID before
repeating the command. See [native wallet activity](/apps/native-wallet/#understand-activity)
for the difference between pending, inclusion and execution.

## Device permissions

Telemetry publishing and actuator acknowledgement use separate, narrowly scoped
device capabilities. Each binds its owner, delegate, contract, allowed methods,
expiry and prepaid fee limits. A device identity is not a homeowner account or a
chain administrator.

Capability revocation, expiry, empty fee escrow and gateway availability are
operational conditions to investigate. Do not replace a missing acknowledgement
with a UI toggle. Virtual adapters provide development behavior; physical-device
readback must come from the installed hardware integration.
