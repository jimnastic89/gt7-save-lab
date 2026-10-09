# GT7 Save Lab — current handover

Updated 2026-10-09. This is the authoritative current summary. [Historical notes](HANDOVER_HISTORY_2026-10-09.md) preserve the full earlier chronology, including superseded hypotheses and instructions. Do not follow historical next-step instructions without checking this document.

## Objective and authorization

Build a PS5 web save editor for the user's owned GT7 v1.71 with an offline patch, title PPSA01317, firmware12.40. Payload Manager runs on port8084; Save Lab is http://10.0.0.24:8097/. Workspace: C:/Users/james/Downloads/gt7-saveData.

Immediate goal: start a menu book, close GT7, mark its requirements complete using the payload, restart, then claim the normal reward in the Cafe. Do not replace that goal with directly archiving a book or injecting rewards. Longer-term: remove unwanted tickets, edit confirmed values, label car IDs, selectively clear/add collection records or sync collection to garage, and install a home-screen shortcut.

LAN access is authorized for read-only snapshots. User applies console edits and loads ELF builds. Do not remotely write saves, stop the console payload or deploy without authorization. Local disposable copies are used for tests. Original images must be preserved. User has no offline patch source/scripts/project link; do not keep asking for them.

## Current software and console state

**v0.4.1 is user-confirmed working.** ELF: dist/gt7-save-lab-v0.4.1.elf; source archive alongside it. v0.4.0 did not start or notify. v0.4.1 moved notifications before file logging, removed inherited stderr output on PS5, and added startup checkpoints. This fixed observed startup but the precise cause remains unproven. Retain that change. v0.3.2 also worked.

Shortcut installation remains disabled, including the API. Earlier v0.2.x builds stopped responding around registration before the accept loop. Do not re-enable casually. Stop payload works through authenticated POST /api/stop and is exposed in the footer. Confirm the previous instance stopped before loading a new ELF.

User cannot see /data/gt7-save-lab over FTP. It is the configured log/mount/backup directory, not a confirmed FTP-accessible location. Do not claim logging succeeded or assume backup retrieval through that FTP namespace. The payload reports backup paths after writes. Full download0.dat backups remain the practical recovery baseline.

Latest captured console save is a later restored Book16 branch, not the controlled Book9/10 branch. It contains three cumulative experiments (seven edited bytes in total), all retained by the game. **Menu completion is not working.** Do not describe the experimental button as a working menu-book editor.

## Book16 failure and experiments

Book16: Take a Photo of Your Car in Scapes. It was already active in the restored save. Entering Scapes triggers Oliver's drift-photography introduction, then soft-locks the mode: no selections or exit. User cannot naturally finish this objective. No patch source is available.

| Test | Edit | Observed result |
|---|---|---|
| A | Five bytes in nested QUEST entry625, slot4: entry+0x55 0→2; +0x59 2→3; +0x6B 1→2; +0x159 1→3; +0x15E 0→1 | All edits retained. Game expands QUEST initial segment96→112 and adds625 to a header list. Cafe still In Progress. |
| B | PROGRESS+0x138 u8 0→1, keeping A | Retained; Cafe still In Progress. |
| C | PROGRESS+0x130 u8 1→0, keeping A+B | Removes gold Scapes destination marker; Cafe still In Progress. |

Final screenshot evidence: both global main-menu banner and the banner inside Cafe say **Completed**. Cafe book page still says **In Progress**, provides Learn More, and says Visit Scapes and take a photo. No claim button is shown. MainMenu.png shows the gold marker over Cafe and no gold marker over Scapes. **User explicitly confirms the gold Cafe marker means a menu book is ready to complete and directs the player back to Cafe.** Thus global navigation/completion state conflicts with the Cafe's book-specific status. Scapes retains a red dot; do not confuse that with the gold objective marker. Cafe's printed Trial Mountain Circuit / USA reward description does not independently prove an unlock occurred.

Images: ../Cafe_InProgress.png and ../MainMenu.png. Save comparisons establish retention, not the meaning of every field. Quest625 mapping to Book16 is still inferred from the sole active600-series entry. The first four quest transitions were observed identically in naturally completed Books9 and10. The fifth objective value was a hypothesis for a single objective. A separate photo condition, quest field, or script-side check remains possible; none is established.

PROGRESS+0x130 has an observed association with the Scapes marker. +0x135 tracked active Books9/10 but was0 in active Book16. +0x138 tracked completed-unclaimed Books9/10 and our synthetic global state, but is insufficient for Cafe acceptance. +0x151 is NOT a universal completed-book count:8→9 after Book9 claim, stayed9 after Book10 claim,10 in the later Book16 branch.

### Exact snapshot checkpoints

All are in live_snapshots/; adjacent JSON contains source, payload version, game-running status and SHA256.

- 20261008T231532.935365Z-book16-scapes-active-restored-save.bin — untouched experimental baseline,244802 bytes,59960 credits, quest625 stage1/objective0, PROGRESS130=1/138=0.
- 20261008T234652.316422Z-book16-after-scapes-experiment-cafe-still-in-progress.bin — after A,248868 bytes.
- 20261009T004222.478870Z-book16-after-progress138-still-in-progress.bin — after B,252918 bytes.
- 20261009T004705.651584Z-book16-scapes-marker-cleared-cafe-in-progress.bin — after C,256968 bytes; latest capture, gameRunning=1.

Machine reports: scapes-experiment-plan.json (historical proposed edit), scapes-experiment-result.json, scapes-progress138-result.json, scapes-marker-cleared-result.json. Later result files supersede proposed next steps in older reports. QUEST remained identical between the final two captures; PROGRESS changed only130. Other differences were runtime statistics and nine startup tickets.

## Recommended next experiment — not yet performed

Stop further arbitrary flag edits on Book16. Preserve the current experimental image separately and retain an untouched pre-experiment image. Reverting to an earlier save can help, but only with targeted checkpoints; replaying many books without snapshots would mix unrelated changes.

Best next evidence: a **naturally completable single-action/visit/tutorial menu book**, if one is accessible in a backed-up branch. Capture (1) acquired but not started, (2) started before doing the action, (3) action completed before entering Cafe, (4) Cafe opened before claim if it permits that pause, (5) reward claimed before starting another book. Record exact book title/number, objective wording, gold markers and banner/button states. This distinguishes objective fulfilment, global navigation, Cafe evaluation and archival. Do not name an unverified book number as a suitable target.

Alternative control: restore a suitable earlier collection/race book and test whether the same quest-stage approach actually enables Cafe hand-in there, using the known naturally completed state as comparison. If it fails there too, the completion recipe is generally incomplete; if it works, the Scapes-specific condition becomes the stronger lead. Derive and guard the exact book-specific edit first; do not reuse625 offsets or a single-objective mask on other books. Book10 objective values were0→1→5, not a simple acquired-car count.

We already have natural Books9/10 snapshots, so first reanalyse those before asking the user to repeat them. Book9 was confounded by licence testsB2–B10; Book10 offers cleaner individual-objective and claim transitions. A different menu type is more informative than replaying many more collection books. Local .bin snapshots are inner files, not whole images; the payload has no unrestricted restore endpoint. Do not instruct the user to replace download0.dat with one.

No next replay, restore or edit has yet been performed or selected. User has offered to revert/complete more books; coordinate which available backup/book before starting.

## Controlled Book9/10 evidence

Use live_snapshots/ filenames ending in these labels (full timestamps and observations are in historical notes and MENU09_COMPARISON.md):

| Label | Meaning |
|---|---|
| menu09-before-tokyo-highway-parade | Restored image1 branch; Book9 active,11800Cr,68 gifts |
| menu09-completed-before-prize | B2–B10 plus championship completed;69900Cr; reward unclaimed |
| menu09-prize-claimed-book10-not-started | Book9 claimed, one1-star ticket; Sport/Multiplayer/Power Pack unlocked |
| menu10-started-no-other-actions | Book10 manually started; Mazda already owned |
| menu10-objectives-viewed-mazda-acquired | Only runtime records changed on viewing objectives |
| menu10-silvia-acquired-first-10000cr | Silvia won;48250Cr after tuning spend; quest objective value1 |
| menu10-corolla-completed-before-prize | Corolla won;63250Cr (+15000 with clean bonus); objective value5; collector candidate5→6 |
| menu10-claimed-next-not-started | Deep Forest unlocked; no new gift; archive added125 and602 |

Book10 required Silvia Q's(S13)'88, Eunos Roadster(NA)'89, Corolla Levin1600GT APEX(AE86)'83. Mazda was already Acquired at start. Book9 quest619; Book10 quest602. Archive additions occur on hand-in, but additional IDs can appear too. Avoid equating every quest with a menu book.

## Save storage and framing

Relevant image: /user/download/PPSA01317/download0.dat,10,549,002,240-byte little-endian UFS2 filesystem with64KiB blocks. It contains gt7save.bin. Earlier Garlic memory.dat dumps were zero-filled and irrelevant. Live path: /mnt/sandbox/download/PPSA01317/gt7save.bin. inspect_download_images.py uses WSL SleuthKit fls/icat; extracts are in ../download_analysis/{1,2,3,4}/. compare_gt7_records.py parses and compares payloads. FTP scanner exclusions remain /user/data/homebrew/PPSA01317-app/contents and /user/data/homebrew/PPSA99*.

38 concatenated records. Each has56-byte header: LEu64 index+0, LEu32 flag+8, LEu32 payload length+12, LEu64 pointer-like value+16,32-byte NUL-padded ASCII name+24; then payload. Match records by name, not whole-file offset. Preserve pointer-like bytes; payloads mostly big endian.

QUEST: BEu16 initial-segment length at12, observed96 or112; then BEu32 count64,64 sequential BEu32 indexes,64 entries of368 bytes. Entries begin qupd and declare368 at+12. Slot BEu32+46 (FFFFFFFF unused); questID BEu32+50; objective IDs BEu32+62,+80,+98. Stage candidate u8+345; objective bit/value candidate u8+350. Header list count BEu32+82,first ID+86 when present. Header list membership alone does not prove completion (Book10 appears while active).

QSTARCIV: countBEu16+48; sequential2-byte indexes from50;64-byte entries; total50+66n; questIDBEu32 entry+47. Archive625 absent during all Scapes experiments.

## Other located values

| Field | Interpretation |
|---|---|
| PROGRESS+0x152 BEu32 | Credits, confirmed by user editing |
| PROGRESS+0x15A u8 | Collector-level candidate; observed5→6 and later9, width/semantics not fully decoded |
| GARAGE+0x30 BEu16 | Selected car reference |
| GARAGE+0x34 BEu16 | Car identifier candidate:3370 Fit Hybrid14,3356 Mini Cooper S65 |
| GMSTATS+0x9A BEu64 | Daily metres candidate;81141→81575 matches81.1→81.5km |
| EVTRECIV ID1000017 | B2 time candidate in milliseconds,17968 then17553 |

EVTRECIV prefix66,BEu16 count at64,sequential2-byte indexes,96-byte entries; magicF921BA8E; IDBEu64+47,timeBEu64+63. Resolve IDs dynamically. Collector points/threshold and collection completion counts remain unidentified. CARDICIV575 entries is not proof of562/574 completion mapping. Collection editor/sync remains unimplemented.

## Tickets — removal validated

GIFTIV prefix66:GFIV magic,countBEu16+64,sequential2-byte indexes,448-byte GFIT entries,total66+450n. Preserve first64 bytes including unknown allocation counters. Entry IDBEu64+47,JSON lengthBEu32+59,JSON+63. Preserve complete retained entries, order and suffix bytes; item IDs exceed JS safe integers, use strings/BigInt.

User removed7 confirmed6-star car-only tickets from69; restart gave71 because9 were added. Comparison verified all62 retained entries byte-identical,7 removed and9 new IDs. Startup set: roulette1,2,3,4,5,6,11,12,13. Removal does not prevent issuance.

Confirmed car-only msgkey DELITEM_9007199254770994,roulette13. Census69 tickets: stars1–6 counts12/7/7/7/8/28. Mapping inferred:roulette1–5 correspond to stars1–5;10 is5-star;6/11/12/13 are6-star. Other6-star subtypes remain unknown. Dates subtract210866760000 from raw seconds for Unix time, displayed Australia/Sydney; one user expiry anchor matches, epoch remains inferred. Display raw createTime_/expireTime_ and confidence.

## Implementation, build and validation

- web/core.js: parser/copy isolation, bounds-checked typed edits, gift subset removal, event lookup, questEntries, guarded scapesExperiment, provisional menuInfo.
- web/app.js/index.html: dark console-inspired UI, confirmed credits, labels stored in localStorage, field/hex explorer, watches/baselines, ticket dates/counts/selection, sticky status banner, staged edits and Stop. Experimental completion display must not be confused with game-confirmed completion.
- src/server.c: single-client HTTP, session token, Host/Origin checks,no CORS,CSP,no-store,16MiB save limit. GET /api/info,/api/save; POST /api/apply,/api/apply-v2,/api/stop. Shortcut endpoint rejects requests.
- src/storage.c: stable read, live/offline image access, game-running and stale-snapshot checks, verified backup, temporary verified write and rename, own-mount cleanup. Failed cleanup blocks further operations. Keep GT7 closed throughout writes.
- src/launcher.c/assets: dormant shortcut implementation; do not call it on startup.
- capture_snapshot.py: GET-only capture with hashes and metadata; no tokens saved.

Apply-v2: G7P2 +LEu32 oldlen +LEu32 newlen +oldbytes +newbytes. Headers must be preserved except validated GIFTIV resize. Gifts can only become an ordered byte-exact subset. Other records permit same-size research edits; storage validation does not prove gameplay semantics. No checksum repair or unrestricted restore API. Backups are inner files, not full images.

Build through WSL using /opt/ps5-payload-sdk: from project directory run make all host. May require sandbox escalation. Tests: node tests/core.test.cjs; node tests/progression.test.cjs; node tests/tickets.test.cjs; node tests/scapes.test.cjs; Linux python3 tests/server_test.py. Fixtures include private snapshots outside source archives. PS5/host builds and15 server tests passed on0.4.1; Scapes fixture tests verify structural edits, not Cafe success. Earlier browser tests verified backed-up application to disposable host copies.

Package ELF and source ZIP in dist with explicit version, excluding user saves/snapshots/backups/logs. Update docs to distinguish build success, PS5 startup success, and actual game-behaviour validation. Do not overwrite older release artifacts. This handover update changes documentation only; existing source ZIPs contain older handover copies.
