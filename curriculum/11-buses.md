# Phase 11 · Communication Buses & Protocols

> Get bits between chips and machines reliably: UART, I2C, SPI, CAN and beyond.

- **Lessons:** 14
- **Maps to:** Communication systems (generic) (generic topic, not an exact ETH title)
- **Main tool:** PulseView (sigrok) · **Default language:** C

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p11-l01 · UART framing and baud rates

**Goal:** Talk serial correctly.

- **Derive by hand:** Start, data, parity, stop bits; baud error tolerance.
- **Code from scratch (C):** Implement a bit-banged UART transmitter.
- **Interactive lab / visual:** Logic trace decoding a byte.
- **Test that proves it works:** Decoded bytes match at 115200 baud.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l02 · Bit-banged UART receive

**Goal:** Sample in the middle of bits.

- **Derive by hand:** Oversampling and majority vote.
- **Code from scratch (C):** Implement a UART receiver state machine.
- **Interactive lab / visual:** Sampling points on a noisy trace.
- **Test that proves it works:** Receives with up to 3 percent baud error.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l03 · Checksums and CRC

**Goal:** Detect corrupted packets.

- **Derive by hand:** Polynomial division over GF(2).
- **Code from scratch (Python):** Implement CRC-8 and CRC-16 table-driven.
- **Interactive lab / visual:** Bit errors detected versus checksum type.
- **Test that proves it works:** Matches reference CRC values.
- **Pro / open-source tool it maps to:** Python
- **Course mapping:** Communication systems (generic) (generic)

## p11-l04 · Packet framing with COBS

**Goal:** Delimit packets on a byte stream.

- **Derive by hand:** Consistent overhead byte stuffing.
- **Code from scratch (C):** Implement COBS encode/decode.
- **Interactive lab / visual:** Bytes stuffed and unstuffed.
- **Test that proves it works:** Round-trip all random payloads.
- **Pro / open-source tool it maps to:** Unity
- **Course mapping:** Communication systems (generic) (generic)

## p11-l05 · RS-485 and Modbus RTU

**Goal:** Talk to industrial drives and sensors.

- **Derive by hand:** Differential signalling; Modbus frame and timing.
- **Code from scratch (Python):** Write a Modbus RTU master for a simulated pump controller.
- **Interactive lab / visual:** Request/response on a bus diagram.
- **Test that proves it works:** Reads registers from simulator correctly.
- **Pro / open-source tool it maps to:** pymodbus
- **Course mapping:** Communication systems (generic) (generic)

## p11-l06 · I2C protocol

**Goal:** Wire many sensors to two pins.

- **Derive by hand:** Open-drain, pull-up sizing t_r = 0.8473 R C; addressing, ACK.
- **Code from scratch (C):** Implement a bit-banged I2C master.
- **Interactive lab / visual:** SDA/SCL traces with start and stop.
- **Test that proves it works:** Talks to a simulated device with ACKs.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l07 · Reading an IMU over I2C

**Goal:** Get real accelerometer data.

- **Derive by hand:** Register maps, burst reads, scaling.
- **Code from scratch (C):** Write an IMU driver with a HAL.
- **Interactive lab / visual:** Live axes from IMU data.
- **Test that proves it works:** Driver passes tests against recorded register dumps.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Communication systems (generic) (generic)

## p11-l08 · SPI modes

**Goal:** Talk fast to ADCs and displays.

- **Derive by hand:** CPOL/CPHA; full duplex shift registers.
- **Code from scratch (C):** Implement SPI mode 0 to 3 bit-bang.
- **Interactive lab / visual:** Clock and data edges per mode.
- **Test that proves it works:** Correct sampling for all modes.
- **Pro / open-source tool it maps to:** PulseView (sigrok)
- **Course mapping:** Communication systems (generic) (generic)

## p11-l09 · SPI with DMA

**Goal:** Stream ADC samples at high rates.

- **Derive by hand:** Throughput = f_sck/bits per sample.
- **Code from scratch (C):** Configure SPI DMA reads from an external ADC.
- **Interactive lab / visual:** Throughput gauge.
- **Test that proves it works:** Achieves target sample rate.
- **Pro / open-source tool it maps to:** PlatformIO
- **Course mapping:** Communication systems (generic) (generic)

## p11-l10 · CAN bus physical layer and arbitration

**Goal:** Network motor drives robustly.

- **Derive by hand:** Dominant/recessive bits; bitwise arbitration.
- **Code from scratch (Python):** Simulate arbitration among three nodes.
- **Interactive lab / visual:** Bits on the bus with losing nodes backing off.
- **Test that proves it works:** Lowest ID always wins.
- **Pro / open-source tool it maps to:** python-can
- **Course mapping:** Communication systems (generic) (generic)

## p11-l11 · CAN frames and DBC decoding

**Goal:** Read signals from a vehicle or battery pack network.

- **Derive by hand:** Frame fields, bit stuffing, signal scaling.
- **Code from scratch (Python):** Decode CAN frames from a DBC file.
- **Interactive lab / visual:** Live signals decoded from frames.
- **Test that proves it works:** Decoded values match reference log.
- **Pro / open-source tool it maps to:** cantools
- **Course mapping:** Communication systems (generic) (generic)

## p11-l12 · CANopen and drive profiles

**Goal:** Command servo drives.

- **Derive by hand:** Object dictionary, PDO/SDO; CiA 402 state machine.
- **Code from scratch (Python):** Implement the CiA 402 state machine.
- **Interactive lab / visual:** Drive state diagram.
- **Test that proves it works:** State transitions follow spec.
- **Pro / open-source tool it maps to:** python-can
- **Course mapping:** Communication systems (generic) (generic)

## p11-l13 · Industrial Ethernet and EtherCAT

**Goal:** Know what fast fieldbuses do.

- **Derive by hand:** Processing on the fly; distributed clocks.
- **Code from scratch (Python):** Simulate cycle time for a chain of slaves.
- **Interactive lab / visual:** Frame passing through slaves.
- **Test that proves it works:** Cycle time estimate matches formula.
- **Pro / open-source tool it maps to:** SOEM
- **Course mapping:** Communication systems (generic) (generic)

## p11-l14 · Wireless telemetry: BLE, Wi-Fi and MQTT

**Goal:** Stream robot data to a laptop.

- **Derive by hand:** Throughput, latency and packet loss.
- **Code from scratch (Python):** Publish telemetry to MQTT and plot it.
- **Interactive lab / visual:** Live telemetry dashboard.
- **Test that proves it works:** Latency measured below target.
- **Pro / open-source tool it maps to:** Mosquitto
- **Course mapping:** Communication systems (generic) (generic)
