
CC = cc
CFLAGS = -Wall -Wextra -fwrapv -O3
LDFLAGS = -lm
CUBIOMES_DIR = ../lib/cubiomes
CUBIOMES_LIB = $(CUBIOMES_DIR)/libcubiomes.a

all: biomes_json structures_json

biomes_json: biomes_json.c $(CUBIOMES_LIB)
	$(CC) $(CFLAGS) -I$(CUBIOMES_DIR) biomes_json.c $(CUBIOMES_LIB) $(LDFLAGS) -o biomes_json

structures_json: structures_json.c $(CUBIOMES_LIB)
	$(CC) $(CFLAGS) -I$(CUBIOMES_DIR) structures_json.c $(CUBIOMES_LIB) $(LDFLAGS) -o structures_json

clean:
	rm -f biomes_json structures_json
