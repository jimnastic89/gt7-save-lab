#ifndef STORAGE_H
#define STORAGE_H
#include <stddef.h>
#include <stdint.h>
#define SAVE_LIMIT (16u * 1024u * 1024u)
extern char storage_error[512];
extern char storage_backup[512];
void storage_init(const char *file, const char *backups);
int storage_read(uint8_t **data, size_t *size);
int storage_apply(const uint8_t *expected, const uint8_t *updated, size_t size);
int storage_apply_v2(const uint8_t *expected, size_t old_size, const uint8_t *updated, size_t new_size);
int save_valid(const uint8_t *data, size_t size);
int save_patch_valid(const uint8_t *a, const uint8_t *b, size_t size);
int save_edit_valid(const uint8_t *a, size_t asize, const uint8_t *b, size_t bsize);
int storage_running(void);
int storage_blocked(void);
#endif
