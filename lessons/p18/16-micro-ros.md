---
id: p18-l16
minutes: 40
summary: micro-ROS puts a ROS 2 node on a microcontroller, connected to the graph through an agent on a bigger computer. You write both ends of an encoder link in C, CDR serialization, serial framing with byte stuffing and a CRC on the MCU, and unframing, CRC checking and rate measurement on the agent, and check the published rate.
---

## Why micro-ROS

A motor controller or an IMU board runs on a microcontroller (Phase 10) with tens of kilobytes of RAM, no Linux and no full DDS. **micro-ROS** brings the ROS 2 client API (`rclc`, a C layer on `rcl`) to it, on top of an RTOS such as FreeRTOS or Zephyr (lesson 03). It does not speak DDS itself: it uses **DDS-XRCE** (DDS for eXtremely Resource Constrained Environments), a small client protocol carried over serial, UDP or CAN to a **micro-ROS agent** running on the robot's computer. The agent creates the real DDS entities on the client's behalf, so the MCU appears in the graph as an ordinary node.

## What crosses the wire

The payload is the same CDR encoding DDS uses (lesson 10). Over a serial link, bytes need **framing** so the receiver can find message boundaries and detect corruption. A common scheme, HDLC-style and similar in spirit to the XRCE serial transport:

- a flag byte `0x7E` at the start and end,
- **byte stuffing**: a flag or escape byte inside the data is sent as `0x7D` followed by the byte XOR `0x20`,
- a **CRC** over the payload, so a flipped bit is detected and the frame dropped (here CRC-16/CCITT, check value `0x29B1`).

Best-effort streams drop bad frames; reliable XRCE streams retransmit them.

## Budget the link

A UART at 115200 baud with 10 bits per byte (start, 8 data, stop) carries 11 520 bytes/s. At 100 Hz, frames of 26 bytes use 22.6 % of it, which leaves room for other topics and retransmissions.

:::figure widget=microros caption="An encoder MCU publishing through a micro-ROS agent. Change the publish rate, baud rate and bit-error rate; the readout shows link load, frames rejected by CRC and the rate seen in the ROS 2 graph."
:::end

## Worked example

A simulated 10 s run with an illustrative 2 % of frames corrupted by a single bit flip:

1. The CRC routine gives `0x29B1` for `"123456789"`, the standard check value.
2. The MCU sends 1000 frames of at most 26 bytes (a 20-byte CDR payload, 2 CRC bytes, flags and occasional escapes).
3. The agent rejects 18 frames by CRC and publishes 982, a rate of 98.3 Hz. Every published message equals what was sent; the last tick count is 937.
4. The link load at 115200 baud is 22.6 %.

## Code it from scratch

:::code file=microros_link.c
```c
/* microros_link.c: what a micro-ROS encoder node and its agent exchange, simulated on the host.
   MCU side: sample the encoder on a 100 Hz timer, serialize to CDR, frame for a serial link with a CRC.
   Agent side: unframe, check the CRC, deserialize, publish into the ROS 2 graph, and measure the rate. */
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#define PI 3.14159265358979323846
#define FLAG 0x7E
#define ESC  0x7D

typedef struct { int32_t sec; uint32_t nanosec; int32_t ticks; float velocity; } EncoderMsg;

static uint16_t crc16(const uint8_t *d, size_t n) {           /* CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF */
    uint16_t c = 0xFFFF;
    for (size_t i = 0; i < n; i++) { c ^= (uint16_t)(d[i] << 8); for (int b = 0; b < 8; b++) c = (c & 0x8000) ? (uint16_t)((c << 1) ^ 0x1021) : (uint16_t)(c << 1); }
    return c;
}

static size_t cdr_encode(const EncoderMsg *m, uint8_t *out) {  /* little-endian CDR: header, then 4-byte aligned fields */
    const uint8_t hdr[4] = {0x00, 0x01, 0x00, 0x00};
    memcpy(out, hdr, 4); memcpy(out + 4, &m->sec, 4); memcpy(out + 8, &m->nanosec, 4);
    memcpy(out + 12, &m->ticks, 4); memcpy(out + 16, &m->velocity, 4);   /* host is little-endian, like a Cortex-M */
    return 20;
}
static int cdr_decode(const uint8_t *in, size_t n, EncoderMsg *m) {
    if (n != 20 || in[1] != 0x01) return 0;
    memcpy(&m->sec, in + 4, 4); memcpy(&m->nanosec, in + 8, 4); memcpy(&m->ticks, in + 12, 4); memcpy(&m->velocity, in + 16, 4);
    return 1;
}

static size_t frame(const uint8_t *p, size_t n, uint8_t *out) { /* FLAG, escaped (payload + CRC), FLAG */
    uint8_t tmp[64]; memcpy(tmp, p, n); uint16_t c = crc16(p, n); tmp[n] = (uint8_t)(c >> 8); tmp[n + 1] = (uint8_t)c;
    size_t k = 0; out[k++] = FLAG;
    for (size_t i = 0; i < n + 2; i++) {
        if (tmp[i] == FLAG || tmp[i] == ESC) { out[k++] = ESC; out[k++] = tmp[i] ^ 0x20; } else out[k++] = tmp[i];
    }
    out[k++] = FLAG; return k;
}
static int unframe(const uint8_t *f, size_t n, uint8_t *p, size_t *pn) {
    uint8_t tmp[64]; size_t k = 0;
    if (n < 4 || f[0] != FLAG || f[n - 1] != FLAG) return 0;
    for (size_t i = 1; i < n - 1; i++) { if (f[i] == ESC) { if (++i >= n - 1) return 0; tmp[k++] = f[i] ^ 0x20; } else tmp[k++] = f[i]; if (k >= sizeof tmp) return 0; }
    if (k < 2) return 0;
    uint16_t c = (uint16_t)(tmp[k - 2] << 8 | tmp[k - 1]);
    if (crc16(tmp, k - 2) != c) return 0;                       /* corrupted on the wire: drop it */
    memcpy(p, tmp, k - 2); *pn = k - 2; return 1;
}

static uint32_t lcg = 12345;
static uint32_t rnd(void) { lcg = lcg * 1664525u + 1013904223u; return lcg >> 8; }

int main(void) {
    int ok = 1;
    uint16_t check = crc16((const uint8_t *)"123456789", 9);
    printf("CRC-16/CCITT-FALSE of \"123456789\" = 0x%04X (standard check value 0x29B1)\n", check);
    if (check != 0x29B1) ok = 0;

    const double rate = 100.0, seconds = 10.0, cpr = 2048.0;  /* 100 Hz timer, 2048 counts per revolution */
    int sent = 0, good = 0, bad_crc = 0; int32_t last_ticks = 0; double first_t = -1, last_t = 0; int max_frame = 0;
    for (int k = 0; k < (int)(rate * seconds); k++) {
        double t = k / rate, w = 2.0 * sin(0.5 * t);              /* the wheel speeds up and slows down, rad/s */
        static double angle = 0; angle += w / rate;
        EncoderMsg m = {(int32_t)t, (uint32_t)((t - floor(t)) * 1e9 + 0.5), (int32_t)lround(angle / (2 * PI) * cpr), (float)w};
        uint8_t payload[32], wire[96]; size_t pn = cdr_encode(&m, payload), fn = frame(payload, pn, wire);
        if ((int)fn > max_frame) max_frame = (int)fn;
        sent++;
        if (rnd() % 100 < 2) wire[1 + rnd() % (fn - 2)] ^= (uint8_t)(1u << (rnd() % 8));   /* 2 % of frames get a bit flip */
        uint8_t rx[64]; size_t rn; EncoderMsg r;                   /* ---- the agent ---- */
        if (!unframe(wire, fn, rx, &rn) || !cdr_decode(rx, rn, &r)) { bad_crc++; continue; }
        double tr = r.sec + r.nanosec * 1e-9;
        if (first_t < 0) first_t = tr;
        last_t = tr; last_ticks = r.ticks; good++;
        if (r.ticks != m.ticks || fabsf(r.velocity - m.velocity) > 0) ok = 0;   /* what arrives is exactly what was sent */
    }
    double measured = good / (last_t - first_t + 1.0 / rate);   /* published samples per second of sensor time */
    printf("in the ROS 2 graph the agent then shows: node /encoder_node, publisher /encoder [my_robot_interfaces/msg/EncoderStamped]\n");
    printf("sent %d frames (up to %d bytes each), %d rejected by CRC, %d published; rate %.1f Hz; last ticks %d\n",
           sent, max_frame, bad_crc, good, measured, last_ticks);
    if (bad_crc < 5 || bad_crc > 40 || fabs(measured - 98.0) > 1.5) ok = 0;
    if (sent * max_frame * 10 > 115200 * (int)seconds) ok = 0;  /* fits a 115200 baud UART (10 bits per byte) */
    printf("link load at 115200 baud: %.1f %%\n", 100.0 * sent * max_frame * 10 / (115200.0 * seconds));
    puts(ok ? "PASS" : "FAIL");
    return ok ? 0 : 1;
}
```
:::end

## In practice

On the MCU, `rclc_support_init`, `rclc_node_init_default`, `rclc_publisher_init_best_effort` and an `rclc_executor` with a timer publish the message; on the computer, `ros2 run micro_ros_agent micro_ros_agent serial --dev /dev/ttyACM0 -b 115200` starts the agent. Then `ros2 node list` shows the MCU node and `ros2 topic hz /encoder` checks its rate. micro-ROS supports boards such as ESP32, STM32, Raspberry Pi Pico and Teensy, with static memory configured at build time.

## Exercises

:::exercise
The encoder must publish at 1 kHz with 26-byte frames. Is 115200 baud enough?
:::solution
1000 × 26 × 10 = 260 000 bit/s, more than twice the link capacity. Use a faster UART (for example 921600 baud), USB CDC, or send batches of samples per message.
:::end

:::exercise
Why does the agent see fewer frames than were sent, and what would you change for data that must not be lost?
:::solution
Frames with bit errors fail the CRC and are dropped on a best-effort stream. For important data (configuration, commands) use a reliable XRCE stream, which acknowledges and retransmits; keep high-rate sensor data best effort.
:::end

## Quiz

:::quiz
- type: num
  q: Bytes per second a 115200 baud UART carries with 10 bits per byte?
  answer: 11520
  tol: 0.001
  py: "115200/10"
  explain: Start and stop bits included.
- type: num
  q: Link load for 200 Hz frames of 30 bytes at 115200 baud (percent)?
  answer: 52.08
  tol: 0.002
  py: "200*30*10/115200*100"
  explain: Bits sent over bits available.
- type: num
  q: Expected published rate at 100 Hz with 5 % of frames corrupted?
  answer: 95
  tol: 0.002
  unit: Hz
  py: "100*0.95"
  explain: Corrupted frames are dropped.
- type: num
  q: Escaped value sent for a data byte 0x7E (decimal)?
  answer: 94
  tol: 0.001
  py: "0x7E ^ 0x20"
  explain: 0x5E after the escape byte 0x7D.
- type: mc
  q: The micro-ROS agent…
  options:
    - creates DDS entities on behalf of the MCU client
    - runs on the microcontroller
    - replaces the RTOS scheduler
    - compiles the firmware
  answer: 0
  explain: The MCU speaks DDS-XRCE to the agent.
- type: mc
  q: A frame whose CRC does not match is…
  options:
    - dropped, or retransmitted on a reliable stream
    - published with a warning
    - corrected automatically by the CRC
    - sent back to the MCU unchanged
  answer: 0
  explain: A CRC detects errors; it does not correct them.
:::end
