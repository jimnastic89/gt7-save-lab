# v0.4.1 startup diagnostic build

User reports v0.4.0 has no startup notification and no reachable web UI. Root cause remains unconfirmed. Comparison against packaged v0.3.2 sources found no native changes except version strings; only embedded browser assets grew. No new dynamic library dependency was introduced.

v0.4.1 sends diagnostic notifications before filesystem logging and removes writes to inherited stderr on PS5, which could otherwise block or fail before the notification. Host stderr logging remains. It adds checkpoints after storage initialisation and after listening, before interface enumeration. This is a diagnostic/candidate fix, not a console-validated resolution. Scapes logic is unchanged and still experimental.

Expected startup notifications: starting; storage initialised; listening on port 8097; ready with address. Report the last notification seen. If none appears, compare with v0.3.2 on the same console session and inspect /data/gt7-save-lab/startup.log and loader output. A failure before main remains possible; these checkpoints cannot diagnose loader internals.

PS5 and host builds passed, all 15 server tests passed, and the Scapes fixture test passed. No console write or remote deployment was performed. Test startup first; do not apply the Scapes experiment until the UI is reachable.

# Current release: GT7 Save Lab 0.4.0

This release adds a guarded experimental Book 16 Scapes completion button and nested quest recognition. See [SCAPES_EXPERIMENT.md](SCAPES_EXPERIMENT.md) for evidence, limitations and the exact console test procedure. Use dist/gt7-save-lab-v0.4.0.elf. No console changes were applied by the assistant.

The experiment changes five bytes only in QUEST ID 625; four transitions match natural completion of Books 9 and 10, and the fifth is a single-objective hypothesis. It does not grant rewards or archive the quest. Cached progression may need further research. User should stop before claiming any reward and report the outcome for a fresh read-only snapshot.

Build, fixture tests, 15 host server tests and browser application with backup on a disposable copy passed. PS5 game acceptance is pending. Shortcut installation remains disabled. Earlier notes below are historical and may describe superseded interpretations or versions.

# GT7 Save Lab 0.3.2

v0.3.2 shows the selected gift count on the removal button, keeps the status banner pinned at the viewport top when scrolling, and sends console notifications when reading a save and after a successful backed-up write. Failed reads/applies also notify. Shortcut installation stays disabled. Use dist/gt7-save-lab-v0.3.2.elf.

Ticket removal now has a successful user console test:7 car-only tickets removed, all62 retained entries unchanged after restart,9 newly issued tickets, total71. Full details in live_snapshots/ticket-removal-verification.json. This confirms the tested removal workflow, not prevention of startup ticket issuance.

v0.3.1 adds ticket stars, a confirmed6-star car-only label for message key DELITEM_9007199254770994, a census summary, readable creation/expiry dates in Australia/Sydney and raw timestamps/message keys. Star mapping is inferred from the user's69-ticket census; other six-star subtypes remain unclassified. Date conversion subtracts210866760000 seconds to obtain Unix seconds and matches one reported expiry; it remains labelled inferred. Unknown roulette IDs stay unknown.

The menu panel now calls PROGRESS+0x151 an unresolved progress marker and removes the completion bar: it stayed9 after claiming Book10. The active/completed-unclaimed state display remains supported by the observed transitions. v0.3.0 is user-confirmed working on console. Use dist/gt7-save-lab-v0.3.1.elf for these changes; click Stop payload on the current version before loading it, then reload the page. Tests include `node tests/tickets.test.cjs` with private live fixtures.

## v0.3.0 — progression and console-inspired theme

Load `dist/gt7-save-lab-v0.3.0.elf`, then refresh http://10.0.0.24:8097/ and check the version badge. Stop the old instance first using Stop payload if available; v0.1.0 lacks that endpoint, so use your existing payload-manager/restart workflow. Do not start another instance while port8097 is occupied.

The new Café panel displays provisional claimed-book progress, active/completed-unclaimed state, and observed quest mappings for Books9/10. These interpretations are tested against six recorded stages. It intentionally does not offer a one-click completion edit yet. Individual objective counts are not decoded; unknown quest IDs stay unnamed. Collector-level text reflects the observed5→6 transition.

Reward tickets can be viewed with their exact IDs and JSON, selected individually or by batch/repeated type, staged for removal, then written with GT7 closed using Back up & apply. Test one removal first: storage/parser and disposable-host validation are successful, but game acceptance still needs testing. Keep a complete image backup. Removal does not prevent new gifts on startup.

The charcoal theme, rounded navigation and dark settings fields follow the supplied MainUI.jpg and SettingsUI.jpg references. Credits, car labels, baseline comparisons, record explorer, watches, startup notifications, Stop payload and backup protections remain. Shortcut installation stays disabled because it blocked console access. Collection clearing/garage sync and safe menu completion remain research work, not implemented features.

Validation: core fixture tests, new `node tests/progression.test.cjs` (requires private live snapshots),15 server tests, and browser checks of Book10 completed state plus ticket removal with backup on a disposable local copy. This ELF still needs console validation. No console saves were changed during development.

Historical release notes follow; use v0.3.0 for this iteration.

## Current release: 2026-10-09

Use `dist/gt7-save-lab-v0.2.2.elf`. This release disables shortcut installation both at startup and through the API: the previous version reached its registration notification but the UI remained inaccessible on the user's console. Registration was called before the HTTP accept loop. It is not yet known whether that call hung or crashed.

Startup notifications show the version and listening address. Diagnostics append to `/data/gt7-save-lab/startup.log`. The footer now has **Stop payload**: its authenticated POST replies, exits the server, and releases its port. It does not write staged edits. The single-client server cannot process Stop in the middle of a save operation; the UI disables it while busy. Reloading a stopped payload's page will fail until another instance starts.

Build and all 15 host server tests passed, including unauthenticated/cross-origin stop rejection, successful stop, unchanged save and port reuse. JavaScript core fixture tests passed. PS5 runtime validation of v0.2.2 is pending. The old v0.1.0 instance has no Stop endpoint: stop that instance through your existing payload-management workflow, or reboot/reload as appropriate, before switching versions. Do not run two instances on port 8097.

For the current Menu Book No. 9 experiment, keep the working v0.1.0 running through both captures to avoid unnecessary changes. Baseline and dashboard transcription are in `live_snapshots/menu09-before-observations.json`. Complete the championship and Café hand-in, let the game save, then report the new menu book and dashboard before the second read.

The v0.2.0 instructions below describe earlier functionality. **Their automatic shortcut-installation instructions do not apply to v0.2.2.** Credit, gift and comparison features remain as described.

PS5 web editor and comparison tool for PPSA01317, tested against GT7 1.71 with an offline patch. Firmware used: 12.40; Payload Manager: port 8084.

## Run

Load `dist/gt7-save-lab-v0.2.0.elf` through Payload Manager, replacing the running older version. Open http://10.0.0.24:8097/ and refresh; the header should say v0.2.0. Only one instance can use port 8097.

The ELF attempts to register a **GT7 Save Lab** tile in the PS5 **Media** section on first launch. It opens http://127.0.0.1:8097/. The tile opens the web interface; it does not restart the ELF after a reboot. There is an installation retry button at the bottom of the page. This feature is compiled but still needs testing on firmware 12.40.

Click **Read console save**. Reads work while the game is running, after its save has settled. Set a comparison baseline, make one change in-game, let it save, then read again. Unknown fields can be given labels in the watchlist.

Credits have a dedicated editor at the top. The car panel lets you label observed IDs; labels and watches live in this browser and can be exported/imported. Seed labels are 3370 = Fit Hybrid '14 and 3356 = Mini-Cooper 'S' '65. These are observed mappings, not a complete model database.

All changes are staged locally. To write, fully close GT7, read a fresh save, stage the desired change, review it, check the game-closed box, and apply. Keep the game closed until completion. The payload checks the original bytes, makes and verifies a backup, writes a temporary file, verifies it, and replaces the save. Backups are in `/data/gt7-save-lab/backups/`; the successful response gives the exact filename. Keep an external copy of the original `download0.dat` as well.

## Gift tickets

The inventory displays exact item IDs, roulette type, timestamps and raw JSON. Select individual tickets, the newest timestamp batch, or repeated roulette types while keeping the earliest of each type. Repeated types can have different seeds: this is not a selection of byte-identical duplicates.

Removal is **experimental and not yet game-validated**. It preserves retained entries and unknown prefix counters, rebuilding the inventory count, index table and outer record length. It does not prevent the offline patch from adding tickets again. Start with one ticket only after the natural-redemption experiment below.

## Next controlled experiment

1. Keep GT7 open at a stable menu. Capture a snapshot before doing anything else.
2. Redeem exactly one existing ticket normally in-game. Note its displayed type and prize, and let the game save. Do not restart the game or make other changes.
3. Capture another snapshot. Compare exact item IDs and retained entry bytes, not only the count. This will establish how the game removes or marks redeemed entries and whether other records change.
4. Once that is understood, close GT7 and test removal of one expendable ticket with the editor. Capture immediately before and after applying, then launch the game and capture again after saving. A new launch may add nine tickets, so a count increase does not by itself mean removal failed.

Other useful isolated experiments: switch to one new car and record its full name; improve only B2 and record the exact time/medal; drive a short known distance without crossing a daily reset; acquire one car and record collector points before/after. Do one experiment per snapshot pair.

## Read-only remote capture

From the workspace root in PowerShell:

```powershell
python .\gt7-save-lab\capture_snapshot.py --url http://10.0.0.24:8097 --label before-ticket
```

Repeat with a different label afterward. This uses GET requests only and stores a small extracted save plus timestamp, SHA-256 and payload metadata in `live_snapshots/`. No further 10 GB image transfers are needed for ordinary comparisons. Direct LAN reading was verified in this session; console writes were not performed by the assistant.

## Build and verify

Requires WSL/Linux, GCC, Python 3 and the PS5 Payload SDK at `/opt/ps5-payload-sdk` (override `PS5_PAYLOAD_SDK` if needed). Node.js runs the JavaScript parser tests. Pillow is only needed to regenerate the icon.

```sh
make all host
python3 tests/server_test.py
node tests/core.test.cjs
```

Tests use the extracted private fixtures in the parent workspace's `download_analysis/` directory. Those fixtures are not distributed with the release. Host testing uses disposable copies, never the console image. Example:

```sh
./build/gt7-save-lab-host --file /absolute/path/to/copy.bin --backups /absolute/path/to/backups --port 8098
```

The host binds loopback; the PS5 ELF binds LAN port 8097. This is a trusted-LAN research tool, not an Internet service. Its same-origin/session checks are not a login system.

Validation: core fixture tests and 14 server tests pass; browser credit staging, one-ticket removal and backup/apply passed against a disposable host file. v0.1 was reported working on the console by the user, including credits. v0.2 shortcut registration and resized gift saves remain console-unverified. Unknown internal checksums are not recalculated. Other game versions and offline patches are unsupported until compared.

## Recovery

Retain the backup path shown after every write. Do not overwrite an image or mounted save while GT7 or an editor mount is using it. If mount cleanup fails, reboot before further filesystem work. The editor deliberately has no unrestricted restore endpoint; its normal apply endpoint rejects unsupported structural changes, including adding back removed gifts. Restore a known-good complete image with GT7 closed and no editor instance using it, or use a separately verified filesystem restore procedure. Ask for assistance before attempting an unfamiliar mount/restore workflow.

## Sources and project knowledge

Read `HANDOVER.md` for byte layouts, evidence, code ownership and outstanding work. Shortcut implementation references the public [PS5 Payload SDK](https://github.com/ps5-payload-dev/sdk), [PS5 Web File Manager installer](https://github.com/owendswang/ps5-web-file-manager/blob/main/src/app_installer.c) and its web-shortcut metadata. The user's example was [PS5 Payload Manager](https://github.com/itsPLK/ps5-payload-manager).
