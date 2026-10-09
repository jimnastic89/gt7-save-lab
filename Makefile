PS5_PAYLOAD_SDK ?= /opt/ps5-payload-sdk
include $(PS5_PAYLOAD_SDK)/toolchain/prospero.mk
CFLAGS = -std=c11 -O2 -Wall -Wextra -Werror -DPS5

all: build/gt7-save-lab.elf

build/assets.h: web/index.html web/core.js web/app.js assets/param.json assets/icon0.png embed.py
	mkdir -p build
	python3 embed.py

build/gt7-save-lab.elf: src/server.c src/storage.c src/storage.h src/launcher.c src/launcher.h build/assets.h
	$(CC) $(CFLAGS) -Ibuild -Isrc src/server.c src/storage.c src/launcher.c -o $@

host: build/assets.h
	gcc -std=c11 -D_DEFAULT_SOURCE -O2 -Wall -Wextra -Werror -Ibuild -Isrc src/server.c src/storage.c src/launcher.c -o build/gt7-save-lab-host

.PHONY: all host
