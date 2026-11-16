---
title: Create a network from the CLI
description: Pair one prepared machine, create a protected workstation wallet, review and sign genesis, then prepare and start a new private network.
---

Use these clients on a Linux workstation to create a **new one-machine network** without a
phone. Prepare Debian, dedicated storage and Manager through the
[direct installation](/node/direct-install/) or [Proxmox](/node/proxmox/) guide
first. Leave node configuration and history absent until this setup completes.

The CLI currently covers pairing and network setup. General wallet transactions,
node updates, joining and archive restoration are separate
work. For a node operated entirely without Manager, use the existing
[native CLI and configuration](/node/quickstart/).

The machine accepts one enrolled controller. Choose this CLI or the phone for
its initial enrollment; they cannot independently share access. Local re-pair
revokes the previous controller and must not be used as an automatic retry.

## 1. Prepare the workstation

These are development tools built from the current private repository. Use the
repository-pinned Rust toolchain and Bun, with workspace dependencies installed.
Run commands from the repository root:

```sh
cargo build --release -p riadchain-appliance --bin riadchain-manager-cli
bun tools/cli/riadchain-wallet.ts --help
install -d -m 0700 "$HOME/.local/share/riadchain-home"
```

The numbered walkthrough uses encrypted custody. For an explicitly disposable
network, use the separate [test flow below](#disposable-test-network); it requires
no custody passphrase or human recovery-backup step.

Keep this private directory outside the source checkout. The wallet vault is
passphrase-encrypted. Manager keeps its password-encrypted age identity in
`key.age` and encrypts `journal.age` to that identity. Enter passphrases in masked
terminal prompts. Back up the **complete original Manager state directory**,
including `key.age`, `journal.age` and `client.lock`; its journal alone cannot restore access if the identity is
lost. Missing or corrupted original keys refuse access rather than being replaced.
Use strong unique passphrases and keep recovery material
offline. Never put passwords or recovery phrases in command arguments, chat,
recordings or support logs. Automation may use owned mode-0600 files through
Manager `--passphrase-file` and wallet `--password-file`; those options take paths,
not secret values.

## 2. Pair and save the request

Replace `192.168.1.50` with the machine's stable reachable private address:

```sh
target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  pair --address 192.168.1.50 --approve

target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  setup request --output "$HOME/.local/share/riadchain-home/network.riadrequest"
```

Pairing separately prompts for the machine's one-time setup password obtained
during trusted installation. `pair --password-file` can read a protected file
instead. OPAQUE authenticates the machine's identity, management CA and encryption
recipient; later management HTTPS checks that CA, hostname and certificate
validity. Successful enrollment consumes the machine's setup password.
After confirmed pairing, use `status` rather than pairing again; the CLI does not
save the setup password.

The request saves a new setup/chain identity and the installed node's latest
supported protocol at block 1. Retain the original request and complete Manager
state directory after any interrupted reply. Do not create another enrollment or network to
retry an uncertain operation.

## 3. Create the wallet and back up its phrases

```sh
bun tools/cli/riadchain-wallet.ts setup create \
  --request "$HOME/.local/share/riadchain-home/network.riadrequest" \
  --vault "$HOME/.local/share/riadchain-home/wallet.age" \
  --plan "$HOME/.local/share/riadchain-home/network.riadplan"
```

Choose a private vault passphrase at the prompt. Creation saves a dedicated
encrypted wallet and its public plan; repeating it resumes that same wallet.
The initial owner and an independent replacement owner receive the standard
minimum funding. The replacement owner's signing key stays off the machine.
This standalone setup uses zero FILE peer acknowledgements, fixed in genesis;
local CID/size verification still applies.

Run the next two commands **yourself in a private terminal**, with no agent,
transcript capture, screenshot or output pipe:

```sh
bun tools/cli/riadchain-wallet.ts setup reveal \
  --vault "$HOME/.local/share/riadchain-home/wallet.age"

bun tools/cli/riadchain-wallet.ts setup backup-confirm \
  --vault "$HOME/.local/share/riadchain-home/wallet.age"
```

Write down all three phrases with their exact labels: **Validator**, **Recovery**
and **Replacement validator**. The confirmation requires the displayed text
`BACKED UP <setup_id>`. Signing remains unavailable until you confirm these
offline backups. Phrases recover signing authority; keep
[history and FILE backups](/node/backup-recovery/) separately.

## 4. Prepare, review and sign genesis

```sh
target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  setup prepare --plan "$HOME/.local/share/riadchain-home/network.riadplan" \
  --output "$HOME/.local/share/riadchain-home/network.riadgenesis"

bun tools/cli/riadchain-wallet.ts setup review \
  --vault "$HOME/.local/share/riadchain-home/wallet.age" \
  --prepared "$HOME/.local/share/riadchain-home/network.riadgenesis"

bun tools/cli/riadchain-wallet.ts setup sign \
  --vault "$HOME/.local/share/riadchain-home/wallet.age" \
  --prepared "$HOME/.local/share/riadchain-home/network.riadgenesis" \
  --output "$HOME/.local/share/riadchain-home/network.riadsetup"
```

Review the chain identity, intended machine, owner allocations, operational signer,
network settings and full genesis hash. The wallet checks the prepared definition
against its original request and plan before asking you to enter that hash.
Automation can supply the exact reviewed hash with `--approve-genesis-hash`.

Owner secrets stay in the workstation wallet. The sealed setup contains signed
public genesis and operational credentials encrypted to the authenticated machine.
Interrupted signing resumes the same saved signed genesis and encrypted envelopes.

## 5. Prepare the machine, then start

```sh
target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  setup stage --sealed "$HOME/.local/share/riadchain-home/network.riadsetup" --approve

target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  setup job --kind stage
```

Inspect the original preparation result. After preparation succeeds:

```sh
target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  setup start --approve

target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  setup job --kind start

target/release/riadchain-manager-cli \
  --state-dir "$HOME/.local/share/riadchain-home/manager" \
  status
```

Keep checking the saved original job until the expected chain reports successful
startup and readiness. `--approve` authorizes enrollment or the exact saved setup
action; it does not relax storage, signature or identity checks. Start enables
the prepared node service for subsequent boots. Normal blocks arrive every ten
seconds; inspect advancing history and test FILE availability separately.

If an outcome is unknown, preserve the complete Manager state directory, wallet
and all original files. Query the original job before explicit resubmission. Repeating
`stage --approve` or `start --approve` checks its saved job first. If the outcome
has never been observed and the server reports a missing job or temporary helper
unavailability, the CLI may resend only that same original request and ID.
Observed jobs are queried without redispatch. Never generate new
phrases, credentials or genesis as an automatic repair. Local lock errors require
checking that the original process has stopped; do not delete an interrupted
creation marker to force a new wallet for the same setup.

The node remains independently operable through `riadchain-cli`, `node.toml` and
systemd. Keep the encrypted workstation records and paper phrases private, and
plan [backups and recovery](/node/backup-recovery/) before relying on the network.

## Disposable test network

Use explicit `--plaintext-test` on both clients for a fresh disposable test
network. Manager stores plaintext `journal.json` and `client.lock`; the wallet
stores plaintext recovery material in `wallet.test.json`. Their directories must
be owned and mode `0700`, and private files mode `0600`. Keep them outside the
checkout and out of logs, agent output and terminal captures. Each mode refuses
the other mode's files; it cannot convert or silently replace an existing wallet
or controller journal.

Prepare a fresh machine as above. Create the private test directory shown below
before saving its one-time setup password from trusted installation as
`setup-password.txt`, owned and mode `0600`. The pairing command expects that
existing file. This password still authenticates the machine through
OPAQUE; test custody removes only the local custody passphrase prompts.

Run from the repository root, replacing the address and reviewed hash:

```sh
test_dir="$HOME/.local/share/riadchain-cli-test"
install -d -m 0700 "$test_dir"
# Save the installation password privately as $test_dir/setup-password.txt before pairing.

manager_test() {
  target/release/riadchain-manager-cli --state-dir "$test_dir/manager" \
    --plaintext-test "$@"
}
wallet_test() {
  bun tools/cli/riadchain-wallet.ts setup "$@" \
    --vault "$test_dir/wallet.test.json" --plaintext-test
}

manager_test pair --address 192.168.1.50 \
  --password-file "$test_dir/setup-password.txt" --approve
manager_test setup request --output "$test_dir/network.riadrequest"
wallet_test create --request "$test_dir/network.riadrequest" \
  --plan "$test_dir/network.riadplan"
manager_test setup prepare --plan "$test_dir/network.riadplan" \
  --output "$test_dir/network.riadgenesis"
wallet_test review --prepared "$test_dir/network.riadgenesis"

# Set this to the exact full genesis_hash from the reviewed public output.
test_genesis_hash="REPLACE_WITH_REVIEWED_64_HEX_GENESIS_HASH"
wallet_test sign --prepared "$test_dir/network.riadgenesis" \
  --output "$test_dir/network.riadsetup" \
  --approve-genesis-hash "$test_genesis_hash"

manager_test setup stage --sealed "$test_dir/network.riadsetup" --approve
manager_test setup job --kind stage
# Continue only after the original preparation reports succeeded.
manager_test setup start --approve
manager_test setup job --kind start
manager_test status
```

No phrase reveal or `backup-confirm` is needed for this explicit test flow.
The wallet keeps `backed_up: false` and reports no offline recovery-backup claim;
test-mode `backup-confirm` is refused. Signing still requires the exact reviewed
hash. TLS, owner signatures, dedicated storage and encrypted machine envelopes
retain their normal checks. The network retains its reviewed private-chain rules
and ten-second cadence. Manager `--passphrase-file` and wallet
`--password-file` cannot be combined with test custody; the pairing password-file
option shown above is separate.

Keep the complete original test state directory, wallet and handoff files.
Query the original preparation/start jobs after any uncertain reply, using the
same reconciliation rules as encrypted custody. Test mode does not permit new
credentials, phrases or genesis as an automatic retry, or fresh initialization
over existing node history.
