# Menu Book 9 — intermediate comparison

Captured read-only on 2026-10-09 Australia/Sydney through payloadv0.1.0. No console writes. Before: `20261008T143632.044171Z-menu09-before-tokyo-highway-parade.bin`. Intermediate: `20261008T150237.531417Z-menu09-completed-before-prize.bin`. Dashboard transcriptions are the adjacent observation JSON files.

User completed B2–B10 and the championship. Menu-book UI says Completed, but prize has not been claimed and the next book has not started. Dashboard remains8/39 books and7% Café. This is useful evidence for distinguishing objective success from hand-in; it does not identify the corresponding save flag yet.

| Observation | Before | Intermediate |
|---|---:|---:|
| Save credits | 11800 | 69900 |
| Garage cars | 12 | 14 |
| Collector points | 405/550 | 472/550 |
| Championships | 1/10 | 2/10 |
| Podiums | 13 | 15 |
| Licence silver total | 1 | 7 |
| Licence bronze total | 1 | 10 |
| Total distance display | 81.15km | 106.13km |
| Driving time | 00:37:44 | 00:47:24 |

Eleven payloads changed: CARCOLIV, EVTRECIV, GAMECTX, GMSTATS, GARAGE, MLSTNACV, PROGRESS, QSTARCIV, QUEST, STGDBK, STYLEIV. Other27 payloads unchanged, including GIFTIV(68 gifts) and CARDICIV. Car collection remains562/574 and garage assets13000Cr.

CARCOLIV retains74 fixed64-byte entries following its66-byte prefix and148-byte index table. Entry key interpreted BEu32 at+47: key15 byte+52 changes00→80; key16 byte+51 changes00→01; key81 byte+52 changes00→40. These keys are not established menu-book numbers. Multiple activities changed, so do not attribute these flags to Book9 alone.

QSTARCIV layout here:50-byte prefix, BEu16 count at48, count BEu16 indexes, count64-byte entries. Count14→15. All14 old entries remain byte-identical after index-table alignment. Added entry has candidate BEu32 ID126 at+47. Its meaning is unconfirmed and may relate to licences or championship progression.

QUEST grew23908→23924 bytes. Its internal initial segment length at+12 changed96→112; a16-byte expansion shifts subsequent data, so raw offset-by-offset differences exaggerate changes. PROGRESS grew704→768, EVTRECIV2418→2712, GARAGE6170→7182. Do not transplant fixed offsets from later variable sections.

A scan for the collector-point pair405→472 as aligned-by-record-offset BE integers of2/4/8 bytes found no matches. Points may be derived, encoded, stored with another width/order, or shifted; no conclusion yet.

## Third capture: prize claimed, Book 10 not started

`20261008T151010.634653Z-menu09-prize-claimed-book10-not-started.bin`,151476 bytes, SHA256a085d05bc0cf1c354a7b2077950ec826ce98fd0e886784d9ae9fd150b5ae9510. User received one1-Star Roulette Ticket (availability text8/11/2026 2:14), acquired Book10 Collection: Japanese FR Sports Cars, and has not manually started it. Sport, Multiplayer and Power Pack became unlocked after claim; their causal relationship is not independently established. No new dashboard screenshot for this stage yet.

Only7 records changed from the intermediate capture: EVTRECIV2712→3692, GAMECTX992→992, GMSTATS672→672, GIFTIV30666→31116, PROGRESS768→768, QSTARCIV1040→1106, QUEST23924→23908. CARCOLIV, GARAGE, CARDICIV, MLSTNACV and other records are unchanged. Credits remain69900.

GIFTIV68→69 with all existing448-byte entries unchanged. New item9007199254751611 has rouletteid1, seed-2090121733, createTime212658232448, expireTime212660824448. This ties rouletteid1 to the reported1-Star ticket in this reward context. Raw time epoch is still unconfirmed; retain the user's availability wording without reinterpreting it.

PROGRESS byte+0x151 changes8→9 (surrounding preceding bytes zero); likely completed-book count or last claimed main-book number. Width and exact semantics remain unproven. It was8 both before racing and at Completed-before-prize. Byte+0x138 follows0→1→0 across the three stages, a possible pending-completion flag but confounded by licences/racing in the first transition. BEu32 fields+0x32,+0x46,+0x5E change0xFFFFFFFF→1 only on claim; possible unlock/state fields. Do not assign individual fields to Sport/Multiplayer/Power Pack without evidence.

QSTARCIV count15→16; all old entries retained byte-identically. New entry candidate BEu32 ID at+47 is619 (0x26B). QUEST first-segment pending slot+0x56 had BEu32 619 at the intermediate stage, but returns to0xFFFFFFFF after claim; its count-like field+0x52 goes1→0. QUEST segment size112→96. This is a strong lead for moving a completed objective to the archive, not proof that changing one flag will safely finish a book.

QUEST BEu32+0x3E follows10→10→0xFFFFFFFF, while+0x42 follows11→11→10; these are internal IDs/state candidates, not established displayed book numbers. Additional aligned differences remain inside the nested QUEST data. EVTRECIV grew by10 entries, so unlocks may initialize event state as well.

## Fourth capture: Book 10 started, no other actions

`20261008T151413.683148Z-menu10-started-no-other-actions.bin`,151492 bytes, SHA256ef5cf03b02527d8012fb08cce4e4573be894389ff873db7925729697e9ce4003. User manually started Book10 only. Objectives reported as collecting3 cars by winning races; user suspects one was already owned but has not checked. Do not assume zero initial objective progress.

Only CARCOLIV, GAMECTX, GMSTATS, PROGRESS and QUEST changed. Garage, gift inventory, car dictionary, event records and quest archive unchanged. Credits69900 and PROGRESS+0x151=9 unchanged: this strengthens the completed/claimed-book interpretation over an active-book number.

QUEST initial segment grows96→112. BEu32+0x4A changes604→602; BEu32+0x52 goes0→1 and+0x56 goes0xFFFFFFFF→602(0x25A). **Correction to the earlier pending-completion interpretation:** this slot is populated on START, so it is more likely an active/pending quest list, not exclusively completed objectives awaiting claim. Internal602 is associated with starting displayed Book10; the mapping is not direct numbering. Header-state candidates+0x3E and+0x42 return to10 and11, respectively, the same values seen during Book9, so do not treat these as simple current/next book numbers.

CARCOLIV changes exactly one byte: payload+0x20B, key15 entry+53,00→40. Earlier completion activity changed key15 entry+52,00→80. These are distinct fields in the same entry; their meanings remain unproven. PROGRESS+0x1350→1, while+0x138 remains0; this strengthens an active-versus-completed state hypothesis. PROGRESS BEu32 fields+0x32,+0x46,+0x5E all1→2; earlier attribution to specific home-screen unlocks is not justified.

After accounting for the initial16-byte expansion, QUEST's suffix has46 differing bytes, mostly clustered in nested state. Some progress structures also move within their unchanged overall size. Further structure-aware decoding is needed before editing.

## Fifth capture: objectives inspected

`20261008T151829.263810Z-menu10-objectives-viewed-mazda-acquired.bin`,151492 bytes, SHA25657a52d7e2d770beeb1edfd654abcfbccf4b884db3b9d026354d9507d2301f9f8. Only GAMECTX and GMSTATS payloads differ from the Book10-started snapshot. All progression and inventory payloads are unchanged; credits69900. Thus the preceding started snapshot already contains the same saved objective state, despite ownership then being uncertain.

User confirms requirements: Nissan Silvia Q's (S13) '88; Mazda Eunos Roadster (NA) '89; Toyota Corolla Levin 1600GT APEX (AE86) '83. Mazda was owned before starting the book and is already marked Acquired. Other two remain missing. Book starts with one of three objectives acquired; do not interpret its initial state as zero progress or infer that acquiring the Mazda caused any changes between captures4 and5.

Next: obtain only the Nissan through its required race, let rewards/save finish, then stop before the Toyota or other activities. Record finish position, credit reward and any other rewards plus dashboard. Compare against capture5 to identify a single missing-objective transition. No progression edits yet.

## Sixth capture: Silvia acquired

First attempts failed with connection refused. User restarted payload and confirmed access. Read-only capture then succeeded: `20261008T213617.998922Z-menu10-silvia-acquired-first-10000cr.bin`,154450 bytes, SHA2567664c1390117878c074e57a37e2dfbb2ef3f7aae52fefe5d46bac056bb1e89b2.

User reports1st place, Silvia reward,10000Cr. Nine payloads changed: CARCOLIV, EVTRECIV, GAMECTX, GMSTATS, GARAGE, PROGRESS, QUEST, STGDBK, STYLEIV. Garage entry count14→15, gifts69 unchanged, QSTARCIV and CARDICIV unchanged.

QUEST length stays23924, and its **only changed byte is+0x1132,00→01**. CARCOLIV only changes+0x20A (key15 entry+52),80→C0, adding bit0x40. These correlate with the Silvia objective transition from one acquired car to two. They are candidates, not a proven safe completion recipe. PROGRESS flags+0x135=1,+0x138=0,+0x151=9 remain unchanged, consistent with an active incomplete book.

Important confounder: actual credits69900→48250, not the expected79900. Net change-21650; difference from expected reward-only balance is31650. Ask whether tuning/purchases or other credit changes occurred. Do not label this a pure race-reward-only comparison until clarified. PROGRESS changes only its credit bytes and bytes+0x161/+0x162 in this pair.

Next: clarify credit discrepancy, then obtain only the Toyota, note rewards/spending and stop at Completed before Café hand-in. Capture to isolate final objective completion from claiming reward. No console edits performed.

## Seventh capture: Corolla acquired, Book 10 Completed before claim

`20261008T214648.052356Z-menu10-corolla-completed-before-prize.bin`,157392 bytes, SHA2565e492ef389a1140bc937e8d93934b1adf598d665293a353abedbecac06f31fba. User reports first place,10000Cr base plus clean-race bonus, no spending, two unlocks (one unknown; other a new tuning-store tier). Earlier tuning spend is confirmed; exact amount and possible earlier clean-race bonus are not recalled, so the previous31650 discrepancy is not an established spend total.

Credits48250→63250 (+15000), consistent with5000 bonus given the reported10000 base and no spending. Garage15→16. GIFTIV69 and QSTARCIV16 unchanged. Nine changed records are the same names as for Silvia acquisition.

PROGRESS+0x15A5→6 strengthens the collector-level interpretation, but dashboard confirmation is still needed. PROGRESS+0xC10→2 is another unlock/state candidate; not assigned a meaning. The new tuning tier coincides with the level candidate increasing; causality and the first unlock remain unresolved.

Across objective completion, PROGRESS+0x1351→0 and+0x1380→1, while+0x151 remains9. This repeats the active→Completed-before-claim pattern observed on Book9, supporting the first two as state candidates and the last as completed/claimed-book progress. QSTARCIV still unchanged: objective completion is distinct from archival during hand-in.

QUEST same size23924; only five byte changes:+0x102900→02,+0x102D02→03,+0x103F01→02,+0x112D01→03,+0x113201→05. In this stable layout,+0x1132 progressed0→1→5 across Mazda-only, Silvia, Corolla. It is NOT a simple acquired-car count (already-owned Mazda was credited at value0); likely flags or another state representation. Do not interpret bit meanings as confirmed.

CARCOLIV key15: entry+5100→01 and entry+5340→80, with entry+52 unchangedC0. Another entry changes at payload+0x60A. These correlate with completion plus collector unlocks, so do not conflate them. All changes remain research-only.

Next: claim Book10 prize only, complete dialogue, stop before manually starting the next book. Record prize, new book number/name, dashboard collector level/points and Café count. Capture to test whether progress9→10 and archive receives candidate quest602, as predicted from Book9. No automatic edits or bypass yet.
