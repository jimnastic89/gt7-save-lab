# Screenshot evidence: Cafe_InProgress.png and MainMenu.png

Both screenshots inspected directly. Cafe_InProgress.png simultaneously shows the global Menu Book Completed banner and the Cafe book's In Progress button. The right page says Visit Scapes and take a photo. The only other visible book action is Learn More; no reward/claim button is visible. The left page lists Trial Mountain Circuit / USA under Track(s) Unlocked; this printed reward description alone does not prove the track was unlocked by the experiment.

MainMenu.png shows a gold menu-book marker above Cafe and no gold marker above Scapes (camera icon at left). Scapes still has a red dot; it is visually distinct from the gold objective marker and its meaning is not decoded. These screenshots confirm the UI inconsistency, but cannot establish whether Cafe reads an unmet photo counter, another quest field, or separate offline-patch logic.

Do not infer that quest625 is fully decoded, that the Cafe has a photo counter, or that a specific additional byte will fix this. Next useful evidence is the offline patch source/scripts or relevant game logic, if available. User need not replay prior books merely to collect that evidence. No save edits or payload changes made for this screenshot review.

# Third Scapes test: destination marker removed, Cafe still blocked

User clarifies the actual in-game main-menu book status says Completed; this is not only the payload display. Clearing PROGRESS+0x130 removed the Scapes destination marker, but the Cafe book page remains In progress. Read-only snapshot 20261009T004705.651584Z-book16-scapes-marker-cleared-cafe-in-progress.bin captures this state. See live_snapshots/scapes-marker-cleared-result.json for the comparison.

Do not equate quest-stage3 or PROGRESS+0x138 with authoritative Cafe completion. +0x130 now has observed association with the destination marker, not proven to be the sole active-book state. Stop speculative flag edits. Next gather the exact Cafe page/objective wording and visible controls (screenshot), then seek evidence of the remaining objective requirement. Quest625-to-Scapes mapping remains inferred. A naturally completed comparable visit/photo objective could help, but do not ask user to replay the entire game. No console writes were made by the assistant.

# Second Scapes test: PROGRESS+0x138 retained, Cafe still blocked

Captured 20261009T004222.478870Z-book16-after-progress138-still-in-progress.bin read-only from v0.4.1. Compared with the previous post-experiment capture: QUEST is byte-identical; PROGRESS differs only at0x138 (0 to1). SCAPES, QSTARCIV and all other progression records remain unchanged. Startup adds another9 gifts. The user still cannot claim or finish Book16. Thus neither edit was discarded, but completion is still insufficient.

Remaining candidate for an isolated test: PROGRESS+0x130 currently1; set to0 while retaining earlier edits. This is an unproven Scapes-active indicator: it is the set byte in the nearby flag region of this Scapes save, whereas Books9/10 used0x135=1 while active, clearing that byte when0x138 became1. Hypothesis: the old active indicator keeps the marker/Cafe objective in-progress. No claim of a decoded field or guaranteed success; no remote write made. If this fails, avoid further arbitrary flags; need a naturally completed photograph/tutorial objective or additional game logic evidence. Keep the original pre-experiment image for rollback.

# Console result: v0.4.1 and Scapes experiment

v0.4.1 startup is user-confirmed working. User cannot see /data/gt7-save-lab via FTP; do not assume that log path is accessible, nor that logging succeeded. Root cause of 0.4.0 startup failure remains unproven.

Read-only snapshot 20261008T234652.316422Z-book16-after-scapes-experiment-cafe-still-in-progress.bin captured from v0.4.1 with gameRunning=1. Game retains all five patched quest625 bytes. The QUEST initial segment grows96 to112 and a header list at82 has count1 and ID625 at86. All other nested quest entries are unchanged after accounting for the16-byte shift. PROGRESS, SCAPES and QSTARCIV are byte-identical. Cafe still says in progress and the Scapes marker remains: the first experiment is insufficient. The payload's stage3 display is not evidence of in-game completion.

Next proposed isolated test: with game closed and a fresh read, change only PROGRESS+0x138 u8 from0 to1 using the existing field editor, keeping the retained quest edits. This byte rose at natural completion of both Books9/10 and cleared on reward claim; Scapes applicability is unproven. Do not also clear PROGRESS+0x130 (1 in Scapes, whereas +0x135 was1 in the earlier active books) without further evidence. No remote edits performed. Capture after user's next test, before reward claim if available. Detailed evidence: live_snapshots/scapes-experiment-result.json.

# v0.4.1 startup diagnostic build

User reports v0.4.0 has no startup notification and no reachable web UI. Root cause remains unconfirmed. Comparison against packaged v0.3.2 sources found no native changes except version strings; only embedded browser assets grew. No new dynamic library dependency was introduced.

v0.4.1 sends diagnostic notifications before filesystem logging and removes writes to inherited stderr on PS5, which could otherwise block or fail before the notification. Host stderr logging remains. It adds checkpoints after storage initialisation and after listening, before interface enumeration. This is a diagnostic/candidate fix, not a console-validated resolution. Scapes logic is unchanged and still experimental.

Expected startup notifications: starting; storage initialised; listening on port 8097; ready with address. Report the last notification seen. If none appears, compare with v0.3.2 on the same console session and inspect /data/gt7-save-lab/startup.log and loader output. A failure before main remains possible; these checkpoints cannot diagnose loader internals.

PS5 and host builds passed, all 15 server tests passed, and the Scapes fixture test passed. No console write or remote deployment was performed. Test startup first; do not apply the Scapes experiment until the UI is reachable.

# Current release: GT7 Save Lab 0.4.0

This release adds a guarded experimental Book 16 Scapes completion button and nested quest recognition. See [SCAPES_EXPERIMENT.md](SCAPES_EXPERIMENT.md) for evidence, limitations and the exact console test procedure. Use dist/gt7-save-lab-v0.4.0.elf. No console changes were applied by the assistant.

The experiment changes five bytes only in QUEST ID 625; four transitions match natural completion of Books 9 and 10, and the fifth is a single-objective hypothesis. It does not grant rewards or archive the quest. Cached progression may need further research. User should stop before claiming any reward and report the outcome for a fresh read-only snapshot.

Build, fixture tests, 15 host server tests and browser application with backup on a disposable copy passed. PS5 game acceptance is pending. Shortcut installation remains disabled. Earlier notes below are historical and may describe superseded interpretations or versions.

# GT7 Save Lab — project handover

## Active Book16 restored save — important interpretation limit

Captured `live_snapshots/20261008T231532.935365Z-book16-scapes-active-restored-save.bin` via user-runningv0.3.2. User restored a later save with Book16 Take a Photo of Your Car in Scapes already active. Structurally compatible38 records,244802 bytes, credits59960. Separate progression branch; don't attribute differences from previous live save to a single action.

PROGRESS+0x135=0,+0x138=0 despite user-confirmed active book; +0x151=10. These candidates are NOT universal main-book flags; current UI can misclassify Book16. No safe completion recipe yet. QUEST96-byte initial segment, then count/index region and64 nested qupd entries of368 bytes starting0x164. Nonempty slots0,1,2,3,4,5,7,8; slot4 contains candidate quest625 but its mapping to Scapes is unproven. QSTARCIV26 entries. Work from this save; replaying intermediate books is unnecessary just to decode structure. Need identify Scapes nested quest/objective and compare its state shape to naturally completed entries; preserve reward-unclaimed and let game hand-in. No edits performed. See book16-scapes-observations.json.

## v0.3.2 / ticket removal validated on console

User removed all7 car-only tickets from69, restarted game, observed71. Read-only capture `live_snapshots/20261008T230305.829790Z-after-seven-car-ticket-removals-restart.bin` hashd7ca819b6d208fc02b0285906d5dcf344ec8be979d275630fbf0159c0c7875a5 confirms7 IDs removed,9 new IDs, all62 retained entries byte-identical. Added roulette IDs1,2,3,4,5,6,11,12,13; no singular extra ticket. Machine comparison saved ticket-removal-verification.json.

v0.3.2 adds count on removal button, sticky status banner, console read notification and success notification only after storage_apply_v2 returns success (backup/write/cleanup finished). Read/apply failures notify separately. No save format changes.

User expects menu workflow: start book, quit, payload marks objective complete, restart game, receive normal reward. Do not bypass reward/archival or use PROGRESS+0x151 as completion count. Next inspect Scapes active book and nested QUEST structures, derive a narrowly scoped completion patch preserving reward-unclaimed state, test on backup with user. Two high-level flags alone are not proven sufficient; full objective states differ by book. No completion mutation implemented yet.

## v0.3.1 / Book10 hand-in correction

User confirmsv0.3.0 runs on console. Captured `live_snapshots/20261008T222754.574642Z-menu10-claimed-next-not-started.bin`: Book10 fully claimed, Deep Forest unlocked, next book unstarted/name unspecified. GIFTIV unchanged69; archive added125 and602; pending flag cleared but PROGRESS+0x151 stays9. Previous claimed-book count hypothesis is disproven as a general interpretation. UI now says unresolved progress marker with no completion bar; internal menuInfo.claimed name is legacy only.

User census12/7/7/7/8/28 tickets at stars1–6 matches roulette IDs1–6 plus10=5star,11/12/13=6star. Mappings inferred, not all individually verified. msgkey DELITEM_9007199254770994 with roulette13 confirmed6star car-only (7entries). Other6star subtypes unknown. UI ticketLabel() shows confidence; ticketDate() converts raw seconds minus210866760000 to UTC, then displays Australia/Sydney with zone; raw values preserved. Match to earlier ticket expiry:212660824448→2026-11-08 02:14:08 Sydney, matching user8/11/2026 2:14. Epoch inferred from one anchor, not universally confirmed. Added census/date/marker regression tests. No console edits; build to be loaded by user.

## Build v0.3.0 — 2026-10-09

User paused live progression experiments to test an updated payload. New read-only Café panel uses `menuInfo()` in core.js: PROGRESS bytes0x151,0x135,0x138 and bounded QUEST initial segment/count/ID; maps619→Book9 and602→Book10. Unsupported layouts/contradictoryflags return null; unknown IDs remain unnamed. No unsafe completion button or objective-count inference. Six real progression stages tested in tests/progression.test.cjs, including gift-removal offset shifts. Collector candidate documentation updated5→6.

Theme now follows user-supplied MainUI.jpg (charcoal settings tiles, rounded nav) and SettingsUI.jpg (dark compact fields). Reward ticket viewer/removal retained and browser-tested on disposable preview-v3.bin:69→68, backup verified by server, successful UI response. Startup/address notifications and Stop payload retained; shortcut API and auto-install remain disabled. All15 server tests and core/progression tests pass; PS5 runtime and in-game ticket removal still require user test. Collection clearing/sync remains unimplemented because semantics are unverified. User will load new ELF before resuming Book10 hand-in experiment. No console writes or deployment by assistant.

## Latest update — 2026-10-09, v0.2.2

Seventh snapshot `live_snapshots/20261008T214648.052356Z-menu10-corolla-completed-before-prize.bin`: Corolla earned, Book10 Completed unclaimed. Credits48250→63250 (+15000; inferred5000 clean bonus), garage15→16, gift/archive unchanged. PROGRESS active candidate+0x1351→0, pending-claim+0x1380→1, claimed-book+0x151 stays9; repeats Book9 pattern. Collector candidate+0x15A5→6, user reports tuning-tier unlock but no dashboard confirmation. QUEST+0x11321→5, so not simple objective count. User confirms earlier tuning spend, exact amount/bonus unknown. Next claim Book10 only, capture before starting next book, verify predicted9→10 and archive602; ask dashboard level/points and Café count. See menu10-corolla-observations.json and MENU09_COMPARISON.md.

Sixth capture after Silvia reward and payload restart: `live_snapshots/20261008T213617.998922Z-menu10-silvia-acquired-first-10000cr.bin`. QUEST only byte+0x1132 changes0→1; CARCOLIV key15 entry+52 changes0x80→0xC0. Garage14→15; gifts69, archive and dictionary unchanged; book flags unchanged. User reports10000Cr reward but save balance69900→48250, a31650 shortfall vs expected79900: clarification needed before treating as isolated race-only transition. See menu10-silvia-observations.json. Next obtain Toyota and capture Completed-before-hand-in after clarifying spending. No save edits.

Fifth capture after viewing Book10 objectives: `live_snapshots/20261008T151829.263810Z-menu10-objectives-viewed-mazda-acquired.bin`. Only GAMECTX/GMSTATS differ from fourth capture; progression/inventories identical. User confirms Mazda Eunos Roadster(NA)'89 already owned and Acquired; Nissan Silvia Q's(S13)'88 and Toyota Corolla Levin1600GT APEX(AE86)'83 are other objectives. Initial Book10 state therefore represents1/3 acquired. Next suggested controlled action: earn Nissan only, record rewards, capture before Toyota. See menu10-objectives-observations.json.

Fourth controlled capture: `live_snapshots/20261008T151413.683148Z-menu10-started-no-other-actions.bin`, Book10 manually started only. Five records changed; completed-book candidate remains9, credits69900, GARAGE/GIFTIV/QSTARCIV/CARDICIV unchanged. QUEST active slot now602; populated on start, disproving an exclusively completion-pending interpretation. CARCOLIV key15 entry+53 changes00→40, PROGRESS+0x1350→1. User may already own one objective car; not checked. Full findings in MENU09_COMPARISON.md and menu10-started-observations.json. Next isolate objective inspection and one missing car acquisition. No progression edit is safe/confirmed yet.

Third Menu09 snapshot captured after prize claim: `live_snapshots/20261008T151010.634653Z-menu09-prize-claimed-book10-not-started.bin`. Book10 Japanese FR Sports Cars acquired but not started. One1-Star ticket added (rouletteid1); Sport/Multiplayer/Power Pack unlocked per user. Seven payloads changed, credits unchanged69900. PROGRESS+0x1518→9; +0x1381→0. QSTARCIV added candidate quest ID619, formerly in QUEST pending slot+0x56. See MENU09_COMPARISON.md and prize observation JSON for uncertainty/offsets. Next suggested isolated action is manually starting Book10 without acquiring cars or racing. Do not confuse internal quest IDs with displayed book numbers or infer a safe skip patch yet.

Menu09 intermediate capture now exists: `live_snapshots/20261008T150237.531417Z-menu09-completed-before-prize.bin`. User completed B2–B10 plus championship, stopped at Completed notification before claiming prize. Dashboard still8/39 Café books; credits69900, collector472/550, garage14. See `live_snapshots/MENU09_COMPARISON.md` and accompanying observation JSON. Await prize claim for a third capture to isolate hand-in. Eleven records changed; GIFTIV and CARDICIV unchanged. QSTARCIV added one entry while retaining all existing entries. No candidate progression flag has been confirmed.

Supersedes shortcut status below. User reported v0.2.0/v0.2.1 inaccessible; diagnostic build displayed address then shortcut-registration notification. Registration ran before accept loop. Root cause inside installer is unconfirmed. v0.2.2 completely skips registration and rejects `/api/install-shortcut`; UI explains disabled state. New authenticated POST `/api/stop` replies and stops the main loop, releasing the socket. Button uses the existing request token and busy guard, warns for unapplied edits, clears token on success. Server serialization keeps it separate from an in-progress write. Startup/address/failure notifications and `/data/gt7-save-lab/startup.log` remain. Mandatory AppInstUtil dependency was previously removed; no installer is called in this release.

Compiled PS5 and Linux, 15 server tests passed including stop authorization, exit, save preservation and port rebind; core JavaScript tests passed. Console v0.2.2 is still unverified. No console writes or deployment were performed. Build required WSL escalation after sandbox E_ACCESSDENIED.

User restored image1 and payloadv0.1.0 for a controlled menu-book experiment. Captured `live_snapshots/20261008T143632.044171Z-menu09-before-tokyo-highway-parade.bin` (143868 bytes, SHA25677ef2d752b351fd2eaabeac7a48649a6425354f5bf9fd3a6a0a3bf4e913f8c54). Current book9: Championship: Tokyo Highway Parade. Live credits11800, gifts68; only GAMECTX, GMSTATS, GIFTIV payloads differ from extracted image1. Dashboard transcription is `live_snapshots/menu09-before-observations.json`, source `../1_download0_dashboard.png`. Snapshot and screenshot are close in time, not simultaneous. Await user completion/Café hand-in and updated dashboard/book, then capture again. Do not read a second snapshot and call it post-completion without user confirmation.

Dashboard: play2:20:33, driving37:44, total81.15km; garage12, assets13000Cr (not balance); collector5,405/550pts; collection562/574; Café8/39 standard,0/12bonus,0/54extra; races11/272, championships1/10, podiums13. See JSON for remaining stats. Priorities: unblock Scapes menu through progression research; collection editor later. Proposed targets QUEST/QSTARCIV/CARCOLIV/PROGRESS remain hypotheses, not mapped fields. CARDICIV has575 fixed64-byte entries and does not directly equal562/574; do not implement bulk collection clearing or garage sync based solely on names.

Updated 2026-10-08. Start with README.md, then this document. Workspace: `C:\Users\james\Downloads\gt7-saveData`. The aim is an offline save editor and research UI, not online manipulation. User owns GT7, runs version 1.71 with an offline patch, PPSA01317, PS5 firmware 12.40, Payload Manager on 8084. Editor: http://10.0.0.24:8097/.

## Authorization and current state

User requested software changes, save analysis, home-screen shortcut, gift removal research, credit editor, car labels and this handover. LAN access was supplied for **read-only snapshots**. Do not infer permission to apply console edits or deploy from this. User tested v0.1 successfully and confirmed credits. v0.2 has been built and host-tested, but its shortcut and gift removal have not been tested in-game. No assistant console writes have occurred. The new ELF will attempt shortcut installation when the user runs it.

## Evidence and samples

Raw `sdimg_sce_sdmemory` files were encrypted PFS; Garlic-extracted memory.dat was zero-filled and did not contain the useful state. FTP changes identified `/user/download/PPSA01317/download0.dat`: a 10,549,002,240-byte little-endian UFS2 filesystem image, 64 KiB blocks. The relevant allocated file is `gt7save.bin`; archived application logs also changed. Do not treat the whole image as an encrypted save blob.

| Image | Controlled change | Credits | Daily display | Gifts |
|---|---|---:|---:|---:|
| 1 | Fit Hybrid '14 | 11800 | 81.1 km | 59 |
| 2 | Mini-Cooper 'S' '65 | 11800 | 81.1 km | 68 |
| 3 | Fit Hybrid '14 | 11800 | 81.1 km | 77 |
| 4 | B2 bronze, 0:17.968 | 12400 | 81.5 km | 86 |

Samples 1–3 also had collector level 5, 145 points until next level and 562/574 cars. Do not label matching bytes as confirmed without a controlled change. A later live snapshot had already progressed further: 36000 credits and 95 gifts, so it is not interchangeable with sample 4.

Original image files remain unchanged. `inspect_download_images.py` runs WSL SleuthKit fls/icat, extracting into `download_analysis/{number}/`, with listings and JSON manifests. `compare_gt7_records.py` and `download_analysis/three_save_comparison.json` document the earlier comparison. Existing THREE_SAVE_FINDINGS.md is historical; this document adds sample 4 and live findings. FTP scanner `ftp_snapshot.py` excludes `/user/data/homebrew/PPSA01317-app/contents` and `/user/data/homebrew/PPSA99*` per user instruction.

## Save framing

38 concatenated records, no trailing data in samples. Header is 56 bytes, followed by the declared payload:

| Header offset | Encoding | Meaning |
|---:|---|---|
| 0 | LE u64 | index |
| 8 | LE u32 | flag |
| 12 | LE u32 | payload length |
| 16 | LE u64 | pointer-like runtime value; preserve |
| 24 | 32 ASCII bytes | NUL-padded record name |

Payload fields mostly use big endian. Match records by name and use payload-relative offsets. Whole-file offsets move when inventories grow. Pointer-like header bytes change between launches; exclude them from semantic comparisons. Only GAMECTX, GMSTATS, GARAGE and GIFTIV payloads changed in 1→2→3; 34 payloads remained identical.

## Located fields

| Record / offset | Type | Interpretation and confidence |
|---|---|---|
| PROGRESS +0x152 | BE u32 | **Confirmed credits**, 11800→12400 and user console editing test |
| PROGRESS +0x15A | byte | Tentative collector level; matches 5 only |
| GARAGE +0x30 | BE u16 | Selected reference, 0→3→0 |
| GARAGE +0x34 | BE u16 | Observed car identifier, 3370→3356→3370; model-vs-instance meaning unproven |
| GMSTATS +0x9A | BE u64 | Strong daily distance candidate, 81141→81575 metres (+434), matches 81.1→81.5 km |
| EVTRECIV event 1000017 | BE u64 time | B2 best time candidate 17968 ms; resolve dynamically |

GAMECTX has a similar distance 81152→81586; do not conflate with GMSTATS. Collector points, next-level threshold and collection counts remain unidentified. Car naming is metadata stored in browser localStorage, not a save mutation. Export labels and watches to transfer between browser origins/devices.

EVTRECIV: 66-byte prefix, count BEu16 at64, then count BEu16 sequential indexes, then count 96-byte entries. Length = 66+98*count. Each entry starts with BEu32 0xf921ba8e. Event ID is BEu64 at entry+47; time is BEu64 at+63. All-ones means unplayed in observed entries. B2 event ID 1000017 (0xf4251) became17968. Possible medal byte at+61 was4 for bronze but remains unconfirmed. Entry count changed24→27 in later live data, demonstrating why hardcoded time offsets are unsafe. `eventInfo` resolves the ID.

## GIFTIV structure and removal hypothesis

Payload begins GFIV. Preserve first64 bytes, including unknown counters at0x38/0x3A. Count is BEu16 at0x40. Then count sequential BEu16 indexes 0..n-1, then count **448-byte GFIT entries**. Exact payload length =66+450*count.

Each entry: BEu64 item ID at+47; BEu32 JSON byte length at+59; JSON starts+63. Observed JSON lengths367/368. Preserve all remaining suffix bytes. JSON keys include car_, count_, createTime_, expireTime_, itemId_, msgkey_, parts_, ticket_ {rouletteid_,seed_}, tuner_, version_:6. Timestamps have unknown epoch. Item IDs exceed JavaScript's safe integer limit: retain decimal strings/BigInt, never round through Number. JSON parsing quotes itemId_ before parsing, and binary ID is decoded exactly.

All old entries are byte-identical across samples1→2→3→4; each transition appends9 types [1,2,3,4,5,6,11,12,13]. These are roulette IDs, not established star ratings. Existing repeated types have different IDs and seeds. Prefix counter progression resembles allocation high-water counters; do not decrement on deletion.

Implemented removal preserves first64 prefix bytes and retained448-byte entries, rebuilds count/indexes, changes the outer payload length, shifts following records. Server accepts only an ordered exact subset: no edited gifts, reordered gifts or additions. This is a conservative structural hypothesis, **not proof the game accepts it**. First observe natural one-ticket redemption to determine whether other state/counters must change. Removal does not suppress the patch's issuance of9 new gifts on startup.

## Implementation map

- `web/core.js`: UMD parser, typed reads/writes, record comparisons, gift decoder/remover, dynamic event lookup. Copies Buffer/Uint8Array input explicitly to avoid Node Buffer.slice aliasing.
- `web/app.js`, `web/index.html`: confirmed credits on top, car labels, tentative fields, record/hex explorer, watchlist, baseline comparisons, gifts, staged review, shortcut retry.
- `src/server.c`: bounded single-client HTTP server; PS5 port8097, host loopback configurable. Random session token; same-origin/Host checks, no CORS, CSP/no-store. Header limit8192, save limit16MiB. GET info/save; POST apply, apply-v2, install-shortcut. Shutdown/drain on rejected bodies avoids TCP reset hiding error responses.
- `src/storage.c`: parsing/edit validation, live or private image access, stable reads, stale snapshot rejection, backups, temporary write/verify/rename, cleanup. Only detaches/unmounts its own resources; cleanup failure blocks further operations until reboot.
- `src/launcher.c`: embeds icon/param, creates `/user/app/GTSL08097/sce_sys`, registers via SceAppInstUtil (dynamic NID Wudg3Xe3heE, fallback AppInstallAll), writes success marker. Auto-runs after PS5 bind; host endpoint reports unsupported. Opens loopback8097 Media tile, does not launch ELF.
- `assets/param.json`, `icon.svg`, `icon0.png`, `make_icon.py`: original code-designed icon and shortcut assets. `embed.py` embeds assets; Makefile builds ELF and Linux host using SDK.
- `capture_snapshot.py`: GET-only snapshot capture, token discarded from metadata, timestamped files and hashes.
- `tests/core.test.cjs`, `tests/server_test.py`: fixture parser tests and 14 HTTP/storage tests.

Apply-v2 envelope: ASCII G7P2, LEu32 original length, LEu32 edited length, original bytes, edited bytes. Legacy apply accepts same-size original+edited. All outer headers must remain identical except GIFTIV payload length for validated removal. Other payloads permit same-size research edits, so semantic correctness is still the user's responsibility. Generic GIFTIV modifications are rejected both in UI and server.

Live read path: `/mnt/sandbox/download/PPSA01317/gt7save.bin`. Offline target image: `/user/download/PPSA01317/download0.dat`. Private mount: `/data/gt7-save-lab/mount`, MD_VNODE via /dev/mdctl, AUTOUNIT, sector512. Read-only for reads; read-write for apply. Writes reject a running GT7 process or existing live mount and recheck before commit. Process detection uses KERN_PROC_PROC plus sceKernelGetAppInfo scanning for PPSA01317 because public SDK layouts vary. A game-start race cannot be eliminated completely: keep GT7 closed throughout a write.

Backups `/data/gt7-save-lab/backups/gt7save-XXXXXX` are exclusive-created, fsynced and re-read. Temporary save preserves owner/mode, is verified and atomically renamed. No internal checksum repair, forced unmount, filesystem repair or unrestricted restore API exists. An exact original image backup is the strongest recovery option; never restore while mounted/in use.

## Validation and remaining work

Build succeeded with -Wall -Wextra -Werror for PS5 and Linux. Core fixture tests pass for four saves, exact item IDs, typed bounds, malformed data, subsets/empty inventory and copy isolation. All14 server tests pass for origins/tokens, stale snapshots, invalid framing, short POST, backup/restore-to-copy, gift subsets, forbidden changes and malformed envelope. Browser test against `build/preview-v2.bin` staged12400→12500 and removed one gift86→85, successfully wrote and reported a backup. This was a disposable host copy, not a console write.

First read-only live capture: `live_snapshots/20261008T091934.592894Z-initial-live-after-B2.bin`,159174 bytes, SHA256 `11be0293ccfc3702e191c0e021ca81e3ead2f0ae4acd6ed0c68780213a06d7ef`. Payloadv0.1, game running,36000 credits,95 gifts. Do not assume still current; capture a fresh baseline before each experiment.

Next: user tests v0.2 registration on12.40; compare natural gift redemption before trusting editor deletion; verify retained IDs after restart despite+9 gifts; map more car IDs; isolate daily distance, medal and collector changes. Console browser compatibility of new UI features also remains to be checked. Do not label a build/host-test success as PS5 validation. Keep experimental controls clearly marked until in-game evidence exists.

Build instructions and user test sequence are in README.md. Release packaging excludes user saves, live snapshots, backups and extracted logs. Preserve previous `build/gt7-save-lab-v0.1.0.elf` for reference.
