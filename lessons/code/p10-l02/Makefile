# Makefile: build Cortex-M3 firmware with no IDE. Recipe lines start with a TAB.
CC      = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
SIZE    = arm-none-eabi-size
CFLAGS  = -mcpu=cortex-m3 -mthumb -O2 -g -Wall -Werror -ffreestanding -ffunction-sections -fdata-sections
LDFLAGS = -nostdlib -T link.ld -Wl,--gc-sections -Wl,-Map=fw.map
OBJS    = rt.o main.o
QEMU    = qemu-system-arm -M mps2-an385 -nographic -semihosting-config enable=on,target=native

all: fw.bin

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

fw.elf: $(OBJS) link.ld
	$(CC) $(CFLAGS) $(LDFLAGS) $(OBJS) -o $@
	$(SIZE) $@

fw.bin: fw.elf
	$(OBJCOPY) -O binary $< $@

run: fw.elf
	$(QEMU) -kernel fw.elf

flash: fw.elf
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg -c "program fw.elf verify reset exit"

clean:
	rm -f *.o fw.elf fw.bin fw.map

.PHONY: all run flash clean
