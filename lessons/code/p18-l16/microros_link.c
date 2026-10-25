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
