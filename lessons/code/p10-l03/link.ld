/* Minimal linker script for a Cortex-M3 (QEMU mps2-an385 memory map). */
MEMORY {
  FLASH (rx)  : ORIGIN = 0x00000000, LENGTH = 256K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
STACK_SIZE = 4K;
ENTRY(Reset_Handler)

SECTIONS {
  .text : {
    KEEP(*(.vectors))          /* the vector table must be first, at address 0 */
    *(.text*)
    *(.rodata*)
    . = ALIGN(4);
  } > FLASH

  .data : {                    /* VMA in RAM, LMA in flash */
    _sdata = .;
    *(.data*)
    . = ALIGN(4);
    _edata = .;
  } > RAM AT > FLASH
  _sidata = LOADADDR(.data);

  .bss (NOLOAD) : {
    _sbss = .;
    *(.bss*) *(COMMON)
    . = ALIGN(4);
    _ebss = .;
  } > RAM

  _heap_start = _ebss;
  _estack     = ORIGIN(RAM) + LENGTH(RAM);
  _heap_end   = _estack - STACK_SIZE;
  ASSERT(_heap_end >= _heap_start, "RAM overflow: .data + .bss + stack do not fit")
}
