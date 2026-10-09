# GT7 download0.dat comparison

Both input files are 10,549,002,240-byte, readable little-endian UFS2 filesystem images. Sleuth Kit fsstat and fls successfully parse their filesystem and directories. The recorded mount point is /mnt/sandbox/download/PPSA01317. The images were read without mounting or modifying them.

Allocated regular files were extracted using fls and icat into 1/ and 2/. Each image contains 106 allocated regular files; 104 have identical SHA-256 content hashes. No allocated regular-file paths were added or removed. Deleted directory entries and unallocated space were not extracted or compared.

Changed files:

| Path | Older bytes | Newer bytes |
|---|---:|---:|
| gt7save.bin | 139818 | 143868 |
| APP_DATA/logs/archived.log | 3596 | 3583 |

APP_DATA/db/userdb0102.dat and all extracted livery assets are unchanged.

## Save structure observed

Both gt7save.bin files parse exactly to EOF as 38 records, with no leftover bytes. Each record has a 56-byte header followed by the payload length specified in that header:

| Header offset | Length | Observed interpretation |
|---|---:|---|
| 0x00 | 8 | Little-endian integer, apparent record index |
| 0x08 | 4 | Little-endian integer, apparent flag |
| 0x0C | 4 | Little-endian payload length |
| 0x10 | 8 | Pointer-like value; exact meaning unconfirmed |
| 0x18 | 32 | NUL-padded ASCII record name |
| 0x38 | variable | Payload |

This is an empirically validated framing, not a complete specification of the game format. Several pointer-like header values change between runs independently of payload changes. Payloads include readable tags and structured binary data; they are not an opaque encrypted image as a whole.

## Changed payloads

All offsets below are relative to the start of each record's payload. The other 34 payloads are byte-identical.

| Record | Older/newer length | Changed overlapping bytes |
|---|---|---:|
| GAMECTX | 976 / 976 | 2 |
| GMSTATS | 672 / 672 | 4 |
| GARAGE | 6170 / 6170 | 5 |
| GIFTIV | 26616 / 30666 | 25638 |

- GAMECTX: 0xA2: 07 -> 08; 0xDE: 5A -> 5C.
- GMSTATS: 0x16E: 74 -> 7C; 0x176: 4D -> 5A; 0x232: 30 -> 31; 0x236: 07 -> 08.
- GARAGE: 0x31: 00 -> 03; 0x35: 2A -> 1C; 0x45: 45 -> 46; 0x69A: 03 -> 04; 0x6A2: 44 -> 46.
- GIFTIV grows by 4050 bytes. Positional differences do not necessarily represent that many independent value changes; insertion or reordering may shift data.

These are individual changed bytes, not decoded field boundaries or confirmed car identifiers. Starting the game may update counters, timestamps, or other state even when the only deliberate action is switching cars. Record names suggest GAMECTX/GARAGE as useful next targets, but controlled additional saves are needed to assign meanings.

The original changes.csv also reports a modified savedata_prospero/PPSA01317/sdimg_sce_sdmemory, so the download image does not establish that normal savedata is irrelevant.

Manifests, directory listings, record indexes, and changes.json are retained alongside the extracted files. Original images are unchanged.
