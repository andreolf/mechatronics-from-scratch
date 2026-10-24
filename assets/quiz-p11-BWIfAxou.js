var e={"p11-l01":[{id:`p11-l01-q1`,type:`num`,q:`<p>Bytes per second at 115 200 baud, 8N1?</p>
`,explain:`<p>Ten bit times per byte.</p>
`,answer:11520,tol:.001,unit:`bytes/s`},{id:`p11-l01-q2`,type:`num`,q:`<p>Maximum total clock mismatch in percent for 8N1 (stop-bit middle at 9.5 bits)?</p>
`,explain:`<p>Half a bit over 9.5 bit times.</p>
`,answer:5.263,tol:.001,unit:`%`},{id:`p11-l01-q3`,type:`num`,q:`<p>Actual baud rate with USARTDIV = 45.5625 at 84 MHz (16× oversampling)?</p>
`,explain:`<p>f/(16·USARTDIV).</p>
`,answer:115226.3,tol:1e-4,unit:`baud`},{id:`p11-l01-q4`,type:`num`,q:`<p>Error in percent of rounding every 115 200-baud bit to 9 µs?</p>
`,explain:`<p>Most of the budget gone.</p>
`,answer:3.68,tol:.002,unit:`%`},{id:`p11-l01-q5`,type:`mc`,q:`<p>What is the even parity bit for data 0x4B?</p>
`,explain:`<p>Four 1s already, so parity 0 keeps the count even.</p>
`,options:[`0`,`1`,`it depends on the stop bits`,`parity is not defined for 8 bits`],answer:0},{id:`p11-l01-q6`,type:`mc`,q:`<p>The UART line when idle is…</p>
`,explain:`<p>The start bit is the falling edge out of idle.</p>
`,options:[`low`,`high`,`floating`,`toggling at the baud rate`],answer:1}],"p11-l02":[{id:`p11-l02-q1`,type:`num`,q:`<p>Samples per bit at 16× oversampling for a transmitter 3 % slow?</p>
`,explain:`<p>Its bits are 3 % longer.</p>
`,answer:16.48,tol:.001,unit:`samples`},{id:`p11-l02-q2`,type:`num`,q:`<p>Where does the stop bit start (in receiver samples) when the transmitter is 6 % slow?</p>
`,explain:`<p>Past samples 151 and 152, so the vote reads the previous data bit.</p>
`,answer:152.64,tol:.001,unit:`samples`},{id:`p11-l02-q3`,type:`num`,q:`<p>Drift of the stop-bit centre in samples at 3 % baud error (16×, 8N1)?</p>
`,explain:`<p>9.5 bits × 16 × 0.03.</p>
`,answer:4.56,tol:.001,unit:`samples`},{id:`p11-l02-q4`,type:`num`,q:`<p>Sample rate in Hz for 16× oversampling at 115 200 baud?</p>
`,explain:`<p>Which is why 1.8432 MHz crystals exist.</p>
`,answer:1843200,tol:.001,unit:`Hz`},{id:`p11-l02-q5`,type:`mc`,q:`<p>The line is high at the middle of a detected start bit. What does the receiver do?</p>
`,explain:`<p>False-start detection.</p>
`,options:[`reads the byte anyway`,`treats it as a glitch and returns to idle`,`reports a parity error`,`doubles its sample rate`],answer:1},{id:`p11-l02-q6`,type:`mc`,q:`<p>What does a majority vote of three samples reject?</p>
`,explain:`<p>Two adjacent bad samples still win the vote.</p>
`,options:[`any noise`,`an isolated one-sample spike`,`a 10 % baud error`,`a broken wire`],answer:1}],"p11-l03":[{id:`p11-l03-q1`,type:`num`,q:`<p>CRC-16/CCITT-FALSE check value of “123456789”, in decimal?</p>
`,explain:`<p>0x29B1.</p>
`,answer:10673,tol:0,unit:``},{id:`p11-l03-q2`,type:`num`,q:`<p>Fraction of 17-bit bursts a CRC-16 misses, as 1 in how many?</p>
`,explain:`<p>Only B = G, one in 2^(r−1).</p>
`,answer:32768,tol:0,unit:``},{id:`p11-l03-q3`,type:`num`,q:`<p>Approximate fraction of random errors a CRC-32 misses, as 1 in how many?</p>
`,explain:`<p>2^−r.</p>
`,answer:4294967296,tol:1e-4,unit:``},{id:`p11-l03-q4`,type:`num`,q:`<p>Table size in bytes for a byte-wise CRC-16 table?</p>
`,explain:`<p>256 entries of 2 bytes.</p>
`,answer:512,tol:0,unit:`bytes`},{id:`p11-l03-q5`,type:`mc`,q:`<p>The remainder of 1101000 divided by 1011 in GF(2) is…</p>
`,explain:`<p>The worked example.</p>
`,options:[`001`,`011`,`101`,`000`],answer:0},{id:`p11-l03-q6`,type:`mc`,q:`<p>Why does a generator with a factor (x+1) catch every odd number of flips?</p>
`,explain:`<p>Multiples of (x+1) evaluate to 0 at x = 1.</p>
`,options:[`because E(1) = 1 for odd weight, which a multiple of (x+1) can’t be`,`because odd errors are bursts`,`because the CRC is reflected`,`it doesn’t`],answer:0}],"p11-l04":[{id:`p11-l04-q1`,type:`num`,q:`<p>Worst-case encoded length (without the delimiter) of a 508-byte packet?</p>
`,explain:`<p>Two FF blocks of 254, then a final 01 code for the empty last block.</p>
`,answer:511,tol:0,unit:`bytes`},{id:`p11-l04-q2`,type:`num`,q:`<p>Percentage overhead of COBS for long packets in the worst case?</p>
`,explain:`<p>One byte per 254.</p>
`,answer:.394,tol:.002,unit:`%`},{id:`p11-l04-q3`,type:`num`,q:`<p>Encoded length of a packet of 300 zeros?</p>
`,explain:`<p>Each zero becomes code 01, plus a final 01.</p>
`,answer:301,tol:0,unit:`bytes`},{id:`p11-l04-q4`,type:`num`,q:`<p>The code byte for “two data bytes, then a zero”?</p>
`,explain:`<p>Code = data bytes + 1.</p>
`,answer:3,tol:0,unit:``},{id:`p11-l04-q5`,type:`mc`,q:`<p>What does the code byte FF mean?</p>
`,explain:`<p>Long runs are split every 254 bytes.</p>
`,options:[`254 data bytes and no zero after them`,`end of packet`,`an escaped zero`,`an error`],answer:0},{id:`p11-l04-q6`,type:`mc`,q:`<p>Why do COBS frames still need a CRC?</p>
`,explain:`<p>A flipped bit decodes to a wrong but well-formed packet.</p>
`,options:[`COBS finds packet boundaries but doesn’t detect corrupted bytes`,`COBS output contains zeros`,`the UART needs it`,`they don’t`],answer:0}],"p11-l05":[{id:`p11-l05-q1`,type:`num`,q:`<p>One 8E1 character time at 19 200 baud, in µs?</p>
`,explain:`<p>Eleven bits.</p>
`,answer:572.9,tol:.001,unit:`µs`},{id:`p11-l05-q2`,type:`num`,q:`<p>The 3.5-character silence at 9600 baud with 11-bit characters, in ms?</p>
`,explain:`<p>Below 19 200 baud it scales with the baud rate.</p>
`,answer:4.01,tol:.001,unit:`ms`},{id:`p11-l05-q3`,type:`num`,q:`<p>Response length in bytes for reading 10 registers with function 03?</p>
`,explain:`<p>Address, function, byte count, 20 data bytes, 2 CRC bytes.</p>
`,answer:25,tol:0,unit:`bytes`},{id:`p11-l05-q4`,type:`num`,q:`<p>Load in ohms seen by the driver from two 120 Ω terminators?</p>
`,explain:`<p>The standard’s 54 Ω also allows for the receivers.</p>
`,answer:60,tol:0,unit:`Ω`},{id:`p11-l05-q5`,type:`mc`,q:`<p>A slave answers function 03 with function code 0x83 and data 02. What happened?</p>
`,explain:`<p>Top bit set means an exception; code 02 is illegal data address.</p>
`,options:[`illegal data address`,`CRC error`,`the slave is busy`,`success`],answer:0},{id:`p11-l05-q6`,type:`mc`,q:`<p>Why does RS-485 survive ground shifts that break a plain UART?</p>
`,explain:`<p>Common-mode rejection.</p>
`,options:[`the receiver looks only at the difference between A and B, within a wide common-mode range`,`it uses higher voltages`,`it’s optical`,`it has no ground`],answer:0}],"p11-l06":[{id:`p11-l06-q1`,type:`num`,q:`<p>Rise time in ns for 4.7 kΩ and 100 pF?</p>
`,explain:`<p>0.8473 RC; too slow for 400 kHz.</p>
`,answer:398.2,tol:.001,unit:`ns`},{id:`p11-l06-q2`,type:`num`,q:`<p>Largest pull-up in Ω for standard mode (1000 ns) with 400 pF?</p>
`,explain:`<p>t_r/(0.8473 C_b).</p>
`,answer:2950.5,tol:.001,unit:`Ω`},{id:`p11-l06-q3`,type:`num`,q:`<p>Smallest pull-up in Ω at 5 V for 3 mA sink at V_OL = 0.4 V?</p>
`,explain:`<p>(V_DD − V_OL)/I_OL.</p>
`,answer:1533.3,tol:.001,unit:`Ω`},{id:`p11-l06-q4`,type:`num`,q:`<p>The first byte sent to read from a device at 0x48?</p>
`,explain:`<p>0x91, address shifted left with R/W = 1.</p>
`,answer:145,tol:0,unit:``},{id:`p11-l06-q5`,type:`mc`,q:`<p>What is a START condition?</p>
`,explain:`<p>SDA rising with SCL high is a STOP.</p>
`,options:[`SDA falls while SCL is high`,`SCL falls while SDA is high`,`SDA rises while SCL is high`,`nine clocks with SDA low`],answer:0},{id:`p11-l06-q6`,type:`mc`,q:`<p>Why can a slave stretch the clock?</p>
`,explain:`<p>The master releases SCL and waits until it actually rises.</p>
`,options:[`SCL is open drain, so holding it low makes the master wait`,`the slave generates the clock`,`the pull-up is weak`,`it can’t`],answer:0}],"p11-l07":[{id:`p11-l07-q1`,type:`num`,q:`<p>Accelerometer sensitivity in LSB/g at ±4 g?</p>
`,explain:`<p>32 768 counts over the range.</p>
`,answer:8192,tol:0,unit:`LSB/g`},{id:`p11-l07-q2`,type:`num`,q:`<p>Temperature in °C for a raw reading of 0?</p>
`,explain:`<p>The datasheet’s offset.</p>
`,answer:36.53,tol:1e-4,unit:`°C`},{id:`p11-l07-q3`,type:`num`,q:`<p>Roll in degrees for a_y = 0.5 g and a_z = 0.866 g?</p>
`,explain:`<p>atan2(a_y, a_z).</p>
`,answer:30,tol:.001,unit:`°`},{id:`p11-l07-q4`,type:`num`,q:`<p>Rate in °/s for a raw gyro reading of 1000 at ±500 °/s?</p>
`,explain:`<p>65.536 LSB per °/s.</p>
`,answer:15.26,tol:.002,unit:`°/s`},{id:`p11-l07-q5`,type:`mc`,q:`<p>Why read all 14 output bytes in one burst?</p>
`,explain:`<p>Separate reads can tear between samples.</p>
`,options:[`the chip latches them, so all values come from one sample`,`I2C can’t read single bytes`,`it saves flash`,`to avoid clock stretching`],answer:0},{id:`p11-l07-q6`,type:`mc`,q:`<p>What does the recorded-dump test catch that a fake returning fixed values doesn’t?</p>
`,explain:`<p>It checks every transaction against what the real chip saw.</p>
`,options:[`wrong registers, wrong order or extra bus accesses`,`wiring faults`,`timing jitter`,`nothing more`],answer:0}],"p11-l08":[{id:`p11-l08-q1`,type:`num`,q:`<p>Maximum SCK in MHz with t_pd = 1 ns, t_co = 8 ns and t_su = 3 ns?</p>
`,explain:`<p>Half a period covers the round trip.</p>
`,answer:38.46,tol:.001,unit:`MHz`},{id:`p11-l08-q2`,type:`num`,q:`<p>Clock edges during one 8-bit SPI transfer?</p>
`,explain:`<p>A leading and a trailing edge per bit.</p>
`,answer:16,tol:0,unit:``},{id:`p11-l08-q3`,type:`num`,q:`<p>Time in µs to read 4096 bytes at 10 MHz SCK, ignoring gaps?</p>
`,explain:`<p>8 bits per byte at 100 ns per bit.</p>
`,answer:3276.8,tol:1e-4,unit:`µs`},{id:`p11-l08-q4`,type:`num`,q:`<p>Which SPI mode number has CPOL = 1 and CPHA = 0?</p>
`,explain:`<p>mode = 2·CPOL + CPHA.</p>
`,answer:2,tol:0,unit:``},{id:`p11-l08-q5`,type:`mc`,q:`<p>In mode 0, when must the slave have its first bit on MISO?</p>
`,explain:`<p>CPHA 0 samples on the leading edge.</p>
`,options:[`as soon as CS falls, before the first rising edge`,`after the first rising edge`,`after the first falling edge`,`after 8 clocks`],answer:0},{id:`p11-l08-q6`,type:`mc`,q:`<p>Why can modes 0 and 3 often interoperate?</p>
`,explain:`<p>Only the idle level differs.</p>
`,options:[`both sample on rising edges, and many slaves detect the idle clock level at CS fall`,`they have the same CPOL`,`SPI ignores the clock polarity`,`they can’t`],answer:0}],"p11-l09":[{id:`p11-l09-q1`,type:`num`,q:`<p>Sample time in µs with t_conv = 0.7 µs, 16 bits at 10.5 MHz and a 0.1 µs gap?</p>
`,explain:`<p>Conversion plus the word plus the gap.</p>
`,answer:2.324,tol:.001,unit:`µs`},{id:`p11-l09-q2`,type:`num`,q:`<p>Timer reload value (ARR) for 250 kS/s from 84 MHz?</p>
`,explain:`<p>336 counts per period.</p>
`,answer:335,tol:0,unit:``},{id:`p11-l09-q3`,type:`num`,q:`<p>Half-buffer interrupts per second at 250 kS/s with 512-sample halves?</p>
`,explain:`<p>One per half.</p>
`,answer:488.28,tol:.001,unit:`per s`},{id:`p11-l09-q4`,type:`num`,q:`<p>Time budget in ms to process a 512-sample half at 250 kS/s?</p>
`,explain:`<p>Until the DMA wraps back.</p>
`,answer:2.048,tol:.001,unit:`ms`},{id:`p11-l09-q5`,type:`mc`,q:`<p>What paces the samples in the DMA design?</p>
`,explain:`<p>Jitter-free sampling.</p>
`,options:[`a hardware timer`,`the CPU’s main loop`,`the DMA’s own speed`,`the half-transfer interrupt`],answer:0},{id:`p11-l09-q6`,type:`mc`,q:`<p>What happens if processing a half takes longer than the half-buffer time?</p>
`,explain:`<p>A circular DMA never waits for the CPU.</p>
`,options:[`the DMA overwrites data still being read, so samples are torn or lost`,`the DMA waits`,`the SPI slows down`,`nothing`],answer:0}],"p11-l10":[{id:`p11-l10-q1`,type:`num`,q:`<p>Maximum cable length in m at 500 kbit/s (75 % sample point, 5 ns/m, 150 ns transceivers)?</p>
`,explain:`<p>The round trip must fit before the sample point.</p>
`,answer:120,tol:.001,unit:`m`},{id:`p11-l10-q2`,type:`num`,q:`<p>Duration in µs of a 111-bit frame at 500 kbit/s?</p>
`,explain:`<p>Two microseconds per bit.</p>
`,answer:222,tol:.001,unit:`µs`},{id:`p11-l10-q3`,type:`num`,q:`<p>Bus load in percent from one 111-bit frame every 1 ms at 500 kbit/s?</p>
`,explain:`<p>Frame time over period.</p>
`,answer:22.2,tol:.001,unit:`%`},{id:`p11-l10-q4`,type:`num`,q:`<p>At which identifier bit (10 = MSB) does 0x6F0 lose to 0x658?</p>
`,explain:`<p>The first bit where they differ, counting from the MSB.</p>
`,answer:7,tol:0,unit:``},{id:`p11-l10-q5`,type:`mc`,q:`<p>What is a dominant bit?</p>
`,explain:`<p>Recessive is the undriven 1.</p>
`,options:[`logic 0, driven, overrides recessive`,`logic 1, driven`,`the idle level`,`an error flag`],answer:0},{id:`p11-l10-q6`,type:`mc`,q:`<p>Why is CAN arbitration called non-destructive?</p>
`,explain:`<p>No bandwidth is lost to the collision.</p>
`,options:[`the winning frame continues unchanged; the losers just stop`,`all frames are retransmitted`,`nodes can’t collide`,`the bus is never shared`],answer:0}],"p11-l11":[{id:`p11-l11-q1`,type:`num`,q:`<p>Unstuffed length in bits of a classic data frame with 4 data bytes, including the interframe space?</p>
`,explain:`<p>47 + 8n.</p>
`,answer:79,tol:0,unit:`bits`},{id:`p11-l11-q2`,type:`num`,q:`<p>Maximum stuff bits for an 8-byte frame?</p>
`,explain:`<p>One per four bits after the first five.</p>
`,answer:24,tol:0,unit:`bits`},{id:`p11-l11-q3`,type:`num`,q:`<p>Physical value for raw 0xF83 as a 12-bit signed signal with factor 0.1?</p>
`,explain:`<p>Two’s complement.</p>
`,answer:-12.5,tol:1e-4,unit:`A`},{id:`p11-l11-q4`,type:`num`,q:`<p>Worst-case duration in µs of an 8-byte frame at 500 kbit/s?</p>
`,explain:`<p>111 + 24 stuff bits.</p>
`,answer:270,tol:.001,unit:`µs`},{id:`p11-l11-q5`,type:`mc`,q:`<p>What does @0 mean in a DBC signal definition?</p>
`,explain:`<p>@1 is little-endian (Intel).</p>
`,options:[`big-endian (Motorola) byte order`,`unsigned`,`start bit zero`,`no scaling`],answer:0},{id:`p11-l11-q6`,type:`mc`,q:`<p>Why does CAN stuff bits?</p>
`,explain:`<p>There’s no clock line.</p>
`,options:[`so receivers see edges often enough to stay synchronised`,`to add error correction`,`to encrypt the data`,`to pad frames to 8 bytes`],answer:0}],"p11-l12":[{id:`p11-l12-q1`,type:`num`,q:`<p>COB-ID in decimal of the SDO request to node 5?</p>
`,explain:`<p>0x605.</p>
`,answer:1541,tol:0,unit:``},{id:`p11-l12-q2`,type:`num`,q:`<p>Statusword masked with 0x6F in Operation enabled, in decimal?</p>
`,explain:`<p>x01x 0111.</p>
`,answer:39,tol:0,unit:``},{id:`p11-l12-q3`,type:`num`,q:`<p>Data bytes carried per SDO expedited frame for a u32 object?</p>
`,explain:`<p>Four bytes of command, index and subindex.</p>
`,answer:4,tol:0,unit:`bytes`},{id:`p11-l12-q4`,type:`num`,q:`<p>Controlword in decimal for Enable operation?</p>
`,explain:`<p>Bits 0–3 set.</p>
`,answer:15,tol:0,unit:``},{id:`p11-l12-q5`,type:`mc`,q:`<p>Which command takes Operation enabled to Quick stop active?</p>
`,explain:`<p>Transition 11.</p>
`,options:[`quick stop (bit 2 cleared, bit 1 set)`,`shutdown`,`fault reset`,`switch on`],answer:0},{id:`p11-l12-q6`,type:`mc`,q:`<p>How do you leave the Fault state?</p>
`,explain:`<p>Transition 15.</p>
`,options:[`a rising edge on controlword bit 7, which goes to Switch on disabled`,`write 0x0F`,`power cycle only`,`write 0x06`],answer:0}],"p11-l13":[{id:`p11-l13-q1`,type:`num`,q:`<p>Time in µs to send a 1012-byte frame at 100 Mbit/s?</p>
`,explain:`<p>80 ns per byte.</p>
`,answer:80.96,tol:.001,unit:`µs`},{id:`p11-l13-q2`,type:`num`,q:`<p>Minimum cycle in µs for 10 slaves × 2 bytes, 1 m cables, with the lesson’s delays?</p>
`,explain:`<p>Frame + slave delays + cable both ways.</p>
`,answer:13.72,tol:.001,unit:`µs`},{id:`p11-l13-q3`,type:`num`,q:`<p>Expected working counter for an LRW to 20 slaves that all respond?</p>
`,explain:`<p>1 for read + 2 for write per slave.</p>
`,answer:60,tol:0,unit:``},{id:`p11-l13-q4`,type:`num`,q:`<p>Round-trip cable delay in ns over 100 m of total cable?</p>
`,explain:`<p>Out and back at 5 ns/m.</p>
`,answer:1e3,tol:0,unit:`ns`},{id:`p11-l13-q5`,type:`mc`,q:`<p>What does “processing on the fly” mean in EtherCAT?</p>
`,explain:`<p>Cut-through with a fixed delay.</p>
`,options:[`each slave reads and writes its data while the frame streams through, without storing the whole frame`,`the master processes all frames`,`slaves send their own frames`,`frames are compressed`],answer:0},{id:`p11-l13-q6`,type:`mc`,q:`<p>Why can the loop time e_i − a_i be measured even though slave clocks have unknown offsets?</p>
`,explain:`<p>Only differences within one clock are used.</p>
`,options:[`both timestamps come from the same slave’s clock, so the offset cancels`,`the offsets are zero`,`the master measures it`,`it can’t`],answer:0}],"p11-l14":[{id:`p11-l14-q1`,type:`num`,q:`<p>Remaining-length bytes for a 200-byte MQTT packet body?</p>
`,explain:`<p>Values above 127 need a second byte.</p>
`,answer:2,tol:0,unit:`bytes`},{id:`p11-l14-q2`,type:`num`,q:`<p>95th percentile in ms of 8 ms + exponential jitter with mean 4 ms?</p>
`,explain:`<p>The exponential’s 95th percentile is mean × ln 20.</p>
`,answer:19.98,tol:.001,unit:`ms`},{id:`p11-l14-q3`,type:`num`,q:`<p>Percentage of messages that need at least two resends with 2 % loss?</p>
`,explain:`<p>p^k.</p>
`,answer:.04,tol:.001,unit:`%`},{id:`p11-l14-q4`,type:`num`,q:`<p>Size in bytes of a QoS 1 PUBLISH with topic robot/1/telemetry and a 16-byte payload?</p>
`,explain:`<p>Fixed header, topic length, topic, packet id, payload.</p>
`,answer:39,tol:0,unit:`bytes`},{id:`p11-l14-q5`,type:`mc`,q:`<p>Which topics does the filter robot/+/telemetry match?</p>
`,explain:`<ul>
<li>matches exactly one level.</li>
</ul>
`,options:[`robot/1/telemetry and robot/arm/telemetry`,`robot/telemetry`,`robot/1/2/telemetry`,`every topic under robot`],answer:0},{id:`p11-l14-q6`,type:`mc`,q:`<p>What does QoS 1 guarantee?</p>
`,explain:`<p>Resends after a lost PUBACK create duplicates.</p>
`,options:[`at least once delivery, so duplicates are possible`,`exactly once`,`at most once`,`delivery within a deadline`],answer:0}]};export{e as default};