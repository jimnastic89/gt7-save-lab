# Three-save comparison: Fit -> Mini -> Fit

Sources: 1_download0.dat (Fit Hybrid '14), 2_download0.dat (Mini-Cooper 'S' '65), 3_download0.dat (Fit Hybrid '14). Original images were not modified. Extracted allocated regular files are in 1/, 2/, and 3/.

Each image contains 106 allocated regular files. Between successive samples only gt7save.bin and APP_DATA/logs/archived.log change. Each save parses exactly as 38 framed records. Across all three samples, 34 record payloads are identical; GAMECTX, GMSTATS, GARAGE, and GIFTIV change. Pointer-like outer header values are not treated as gameplay fields.

## Selected car candidates

GARAGE payload begins at absolute gt7save.bin offset 0xBBC6 in all three samples.

| Payload offset | File offset | Fit (1) | Mini (2) | Fit (3) |
|---|---|---|---|---|
| 0x30, two bytes | 0xBBF6 | 00 00 | 00 03 | 00 00 |
| 0x34, two bytes | 0xBBFA | 0D 2A | 0D 1C | 0D 2A |

As big-endian 16-bit candidates these are 0 -> 3 -> 0 and 3370 -> 3356 -> 3370. This is strong evidence of selected-car-related state. Exact field widths and semantics remain unconfirmed: the first could be a garage slot/reference; the second could be a model/instance identifier. Do not yet treat these as verified universal car IDs.

GAMECTX's changed bytes instead progress 7 -> 8 -> 9 and 90 -> 92 -> 94, making them poor direct selected-car candidates. GARAGE contains additional changes that do not return with the selection, plausibly counters or per-car history.

## Gift inventory structure

GIFTIV entry counts are 59, 68, and 77. All existing 448-byte entries remain byte-identical and in the same order. Exactly nine new distinct entries are appended in each transition. Every entry begins with ASCII GFIT.

Validated layout for these samples:

- 66-byte prefix, including a big-endian 16-bit entry count at payload offset 0x40.
- count big-endian 16-bit indices, exactly 0 through count-1.
- count records of 448 bytes each.
- Total payload size = 66 + count * 450.

Payload sizes are 26616, 30666, and 34716 bytes. Each increases by 4050 = 9 * (448 + 2). This supports the reported nine additional gifts on each launch. It does not establish the cause of repeated awards or decode ticket types.

## Unchanged progress values

PROGRESS is byte-identical across all three saves.

- Payload offset 0x152 contains 00 00 2E 18, matching 11800 as big-endian uint32. Strong credit-field candidate; confirmation requires a controlled credit change.
- Payload offset 0x15A contains 05, matching collector level 5. Field width/meaning unconfirmed.
- Payload offset 0x160 contains 06 31 (1585 as big-endian uint16). No collector-points interpretation is established.
- 145 points remaining, daily workout 81.1 km, and 562/574 collected cars have not been confidently located. They may be derived, scaled, or represented by inventory membership rather than literal values.

PROGRESS payload starts at 0x1458A, 0x1555C, and 0x1652E respectively because GIFTIV grows. Use record-relative offsets rather than fixed file offsets.

Machine-readable details: three_save_comparison.json. Reproduce record analysis with python compare_gt7_records.py from the workspace. A controlled credit change would test the credits candidate; another distinct car selection would help clarify the GARAGE fields.
