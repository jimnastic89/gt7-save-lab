# Current outcome — read this first

The cumulative Scapes experiment does NOT enable Cafe hand-in. User confirms the gold Cafe marker means return to Cafe to complete the book; the global banner says Completed, but the Cafe page remains In Progress. Patch source is unavailable. Do not repeat the older proposed edits below as if untested. See [current handover](HANDOVER.md) for all results and the targeted comparison plan. Earlier entries below are chronological research notes.

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

# Scapes completion experiment — v0.4.0

This is an experimental Book 16 completion edit, not yet validated in GT7. The console has not been modified during development.

## Test procedure

1. Close GT7 and retain a complete backup of your current download0.dat.
2. Click Stop payload in v0.3.2, then load dist/gt7-save-lab-v0.4.0.elf through Payload Manager.
3. Reload http://10.0.0.24:8097/ and confirm the version is 0.4.0.
4. Read the console save. Open Menu books > Experimental Book 16 completion test.
5. Stage the Scapes experiment. Review the five QUEST byte changes. Make no other edits for this test.
6. Confirm GT7 is closed and click Back up & apply. Keep the reported backup path.
7. Start GT7 and visit the Café. If it shows Completed, pause before claiming the reward so we can capture that state. If it remains incomplete, report that and avoid further edits; we will capture what the game retained or rewrote.

If the save is rejected or progression behaves unexpectedly, close GT7 and restore your complete pre-test image using your established restore workflow. Automatic backups contain the inner gt7save.bin; they are not complete download0.dat images.

## Evidence and limitations

The restored Scapes save has one active 600-series quest: ID 625, slot 4. Its identification as Book 16 is inferred from the user's current menu book and the save structure.

QUEST contains a variable initial segment, a 64-entry index table, and 64 fixed 368-byte qupd entries. Four entry-relative transitions appear identically when Book 9 and Book 10 naturally become completed but unclaimed:

| Entry offset | Before | After |
|---|---|---|
| 0x55 | 00 | 02 |
| 0x59 | 02 | 03 |
| 0x6B | 01 | 02 |
| 0x159 | 01 | 03 |

A fifth field at 0x15E changes 00 to 01 for Book 9 and 01 to 05 for the final Book 10 objective. Setting it to 01 for the single Scapes objective is a hypothesis.

For the captured Scapes fixture, the five QUEST payload offsets are 0x779, 0x77D, 0x78F, 0x87D and 0x882. The implementation locates the entry structurally rather than hard-coding these absolute offsets. It requires the supported layout, matching objective IDs, an unarchived quest, and the exact expected original values. It rejects already edited or unsupported states.

No rewards are issued and no archive entry is added. PROGRESS, SCAPES and collection data are untouched. GT7 may require a cached progression flag or photo event as well, so this minimal experiment may not complete the book. The old PROGRESS flags are not universal: the active Scapes save has both flags clear.

Validation: JavaScript fixture tests; natural completion comparisons for Books 9 and 10; PS5 ELF and Linux host builds; 15 server tests; browser staging and backed-up application to a disposable local copy. Console acceptance remains untested.
