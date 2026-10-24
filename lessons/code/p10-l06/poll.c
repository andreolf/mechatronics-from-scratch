#include <stdint.h>
uint32_t status_plain;              /* imagine an ISR or the hardware sets bit 0 */
volatile uint32_t status_vol;

void wait_plain(void)    { while (!(status_plain & 1u)) {} }
void wait_volatile(void) { while (!(status_vol & 1u)) {} }
