var e={"p19-l01":[{id:`p19-l01-q1`,type:`num`,q:`<p>Best possible efficiency of a linear regulator from 5 V to 3.3 V (percent)?</p>
`,explain:`<p>Vout over Vin.</p>
`,answer:66,tol:.002,unit:``},{id:`p19-l01-q2`,type:`num`,q:`<p>Heat in a linear regulator from 12 V to 5 V at 0.5 A (watts, ignore Iq)?</p>
`,explain:`<p>(Vin − Vout) Iout.</p>
`,answer:3.5,tol:.002,unit:``},{id:`p19-l01-q3`,type:`num`,q:`<p>Gate-drive loss of one MOSFET with Qg 10 nC at 5 V and 1 MHz (mW)?</p>
`,explain:`<p>Qg Vg fs.</p>
`,answer:50,tol:.002,unit:``},{id:`p19-l01-q4`,type:`num`,q:`<p>Switching-overlap loss at 24 V, 3 A, tr + tf = 20 ns, 400 kHz (W)?</p>
`,explain:`<p>½ V I (tr + tf) fs.</p>
`,answer:.288,tol:.002,unit:``},{id:`p19-l01-q5`,type:`mc`,q:`<p>Raising the switching frequency mainly…</p>
`,explain:`<p>Size against switching loss.</p>
`,options:[`lowers every loss`,`raises conduction losses`,`shrinks the inductor and capacitor but raises switching losses`,`has no effect on efficiency`],answer:2},{id:`p19-l01-q6`,type:`mc`,q:`<p>A linear regulator is the better choice for…</p>
`,explain:`<p>Its loss is small only when dropout or current is small.</p>
`,options:[`a low-noise supply at small current and small dropout`,`a 12 V to 1 V conversion at 10 A`,`20 A from 48 V to 12 V`,`a battery-powered motor driver`],answer:0}],"p19-l02":[{id:`p19-l02-q1`,type:`num`,q:`<p>Duty cycle for 5 V from 24 V in an ideal buck?</p>
`,explain:`<p>D = Vout/Vin.</p>
`,answer:.2083,tol:.002,unit:``},{id:`p19-l02-q2`,type:`num`,q:`<p>Inductor ripple for Vin 24 V, Vout 5 V, L 33 µH, 300 kHz (A)?</p>
`,explain:`<p>(Vin − Vout) D / (L fs).</p>
`,answer:.3998,tol:.002,unit:``},{id:`p19-l02-q3`,type:`num`,q:`<p>Output ripple from 0.4 A ripple with 22 µF at 300 kHz (mV)?</p>
`,explain:`<p>ΔI / (8 C fs).</p>
`,answer:7.576,tol:.002,unit:``},{id:`p19-l02-q4`,type:`num`,q:`<p>Average inductor current of a buck delivering 3 A?</p>
`,explain:`<p>The capacitor carries no DC current.</p>
`,answer:3,tol:.001,unit:`A`},{id:`p19-l02-q5`,type:`mc`,q:`<p>Volt-second balance states that in steady state…</p>
`,explain:`<p>Otherwise the current would keep growing.</p>
`,options:[`the duty cycle is one half`,`the average inductor voltage over a period is zero`,`the average capacitor voltage is zero`,`the inductor current is constant`],answer:1},{id:`p19-l02-q6`,type:`mc`,q:`<p>Doubling the inductance of a buck…</p>
`,explain:`<p>ΔI is inversely proportional to L.</p>
`,options:[`doubles the current ripple`,`halves the current ripple`,`doubles the output voltage`,`changes the duty cycle needed`],answer:1}],"p19-l03":[{id:`p19-l03-q1`,type:`num`,q:`<p>Ideal boost output from 3.3 V at D = 0.6?</p>
`,explain:`<p>Vin/(1 − D).</p>
`,answer:8.25,tol:.002,unit:`V`},{id:`p19-l03-q2`,type:`num`,q:`<p>Duty cycle to boost 5 V to 20 V?</p>
`,explain:`<p>D = 1 − Vin/Vout.</p>
`,answer:.75,tol:.002,unit:``},{id:`p19-l03-q3`,type:`num`,q:`<p>Average inductor current for 2 A out at D = 0.5 (A)?</p>
`,explain:`<p>Iout/(1 − D).</p>
`,answer:4,tol:.002,unit:``},{id:`p19-l03-q4`,type:`num`,q:`<p>Boost gain at D = 0.5 with rL/R = 0.05?</p>
`,explain:`<p>The resistance term is 0.2.</p>
`,answer:1.6667,tol:.002,unit:``},{id:`p19-l03-q5`,type:`mc`,q:`<p>At very light load a fixed-duty boost’s output…</p>
`,explain:`<p>Discontinuous conduction raises the gain.</p>
`,options:[`falls to Vin`,`goes negative`,`rises above Vin/(1 − D)`,`stays at Vin/(1 − D)`],answer:2},{id:`p19-l03-q6`,type:`mc`,q:`<p>With the boost switch held off, the output is…</p>
`,explain:`<p>The inductor and diode connect input to output.</p>
`,options:[`negative`,`zero`,`Vin/(1 − D)`,`about Vin minus a diode drop`],answer:3}],"p19-l04":[{id:`p19-l04-q1`,type:`num`,q:`<p>Flyback output from 48 V with n = 0.2 at D = 0.4?</p>
`,explain:`<p>Vin n D/(1 − D).</p>
`,answer:6.4,tol:.002,unit:`V`},{id:`p19-l04-q2`,type:`num`,q:`<p>Buck-boost output magnitude from 12 V at D = 0.25?</p>
`,explain:`<p>Vin D/(1 − D).</p>
`,answer:4,tol:.002,unit:`V`},{id:`p19-l04-q3`,type:`num`,q:`<p>Energy in 100 µH carrying 2 A (µJ)?</p>
`,explain:`<p>½ L i².</p>
`,answer:200,tol:.002,unit:``},{id:`p19-l04-q4`,type:`num`,q:`<p>Voltage across a flyback switch when off, Vin 24 V, Vout 5 V, n = 0.25 (no leakage spike)?</p>
`,explain:`<p>Vin plus the reflected voltage.</p>
`,answer:44,tol:.002,unit:`V`},{id:`p19-l04-q5`,type:`mc`,q:`<p>In a flyback, primary and secondary currents flow…</p>
`,explain:`<p>Energy is stored, then released.</p>
`,options:[`at different times in the period`,`only at start-up`,`only in the secondary`,`at the same time, like a transformer`],answer:0},{id:`p19-l04-q6`,type:`mc`,q:`<p>The energy in a flyback’s leakage inductance…</p>
`,explain:`<p>A snubber or clamp absorbs it.</p>
`,options:[`increases the output voltage`,`is negligible in every design`,`does not reach the output and must be clamped`,`is fully delivered to the output`],answer:2}],"p19-l05":[{id:`p19-l05-q1`,type:`num`,q:`<p>LC resonance of 10 µH and 100 µF (Hz)?</p>
`,explain:`<p>1/(2π√(LC)).</p>
`,answer:5033,tol:.002,unit:``},{id:`p19-l05-q2`,type:`num`,q:`<p>ESR zero of 220 µF with 0.1 Ω (Hz)?</p>
`,explain:`<p>1/(2π C rc).</p>
`,answer:7234,tol:.002,unit:``},{id:`p19-l05-q3`,type:`num`,q:`<p>Phase boost of a type-II pair with k = 3 (degrees)?</p>
`,explain:`<p>2 arctan k − 90°.</p>
`,answer:53.13,tol:.002,unit:``},{id:`p19-l05-q4`,type:`num`,q:`<p>Output dip from 50 mΩ ESR on a 2 A load step (mV)?</p>
`,explain:`<p>rc ΔI.</p>
`,answer:100,tol:.002,unit:``},{id:`p19-l05-q5`,type:`mc`,q:`<p>The integrator in the compensator…</p>
`,explain:`<p>Infinite DC gain.</p>
`,options:[`adds phase lead at crossover`,`cancels the ESR zero`,`removes the steady-state output error`,`raises the switching frequency`],answer:2},{id:`p19-l05-q6`,type:`mc`,q:`<p>With low-ESR ceramic output capacitors, voltage-mode control usually needs…</p>
`,explain:`<p>Two zeros recover the phase lost at the LC pole.</p>
`,options:[`a pure proportional controller`,`a type-III compensator`,`a lower duty cycle`,`no compensation`],answer:1}],"p19-l06":[{id:`p19-l06-q1`,type:`num`,q:`<p>Junction temperature with 3 W through 0.5 + 0.3 + 4 K/W at 35 °C ambient (°C)?</p>
`,explain:`<p>Ta + P Σθ.</p>
`,answer:49.4,tol:.002,unit:``},{id:`p19-l06-q2`,type:`num`,q:`<p>Conduction loss of 20 A at D = 0.4 through 10 mΩ (W)?</p>
`,explain:`<p>D I² Rds.</p>
`,answer:1.6,tol:.002,unit:``},{id:`p19-l06-q3`,type:`num`,q:`<p>Rds at 125 °C if it is 5 mΩ at 25 °C and rises 0.45 %/K (mΩ)?</p>
`,explain:`<p>Linear temperature coefficient.</p>
`,answer:7.25,tol:.002,unit:``},{id:`p19-l06-q4`,type:`num`,q:`<p>Largest heatsink resistance for 10 W, Tj 110 °C, Ta 40 °C, θjc + θcs = 1 K/W (K/W)?</p>
`,explain:`<p>Total allowed minus the rest of the path.</p>
`,answer:6,tol:.002,unit:``},{id:`p19-l06-q5`,type:`mc`,q:`<p>The fixed-point iteration for Tj finds no equilibrium when…</p>
`,explain:`<p>The temperature keeps rising.</p>
`,options:[`the heatsink is too large`,`the ambient temperature is below 25 °C`,`the switching frequency is low`,`losses grow with temperature faster than the thermal path removes them`],answer:3},{id:`p19-l06-q6`,type:`mc`,q:`<p>A Foster network’s longest time constant usually belongs to…</p>
`,explain:`<p>The largest thermal mass.</p>
`,options:[`the heatsink`,`the silicon die`,`the bond wires`,`the gate capacitance`],answer:0}],"p19-l07":[{id:`p19-l07-q1`,type:`num`,q:`<p>Minimum bootstrap capacitor for 80 nC per cycle and 0.4 V droop (nF)?</p>
`,explain:`<p>Q/ΔV.</p>
`,answer:200,tol:.002,unit:``},{id:`p19-l07-q2`,type:`num`,q:`<p>Charge drawn by 200 µA over a 100 µs on-time (nC)?</p>
`,explain:`<p>I t.</p>
`,answer:20,tol:.002,unit:``},{id:`p19-l07-q3`,type:`num`,q:`<p>Peak gate current to deliver 40 nC in 10 ns (A)?</p>
`,explain:`<p>Q/t.</p>
`,answer:4,tol:.002,unit:``},{id:`p19-l07-q4`,type:`num`,q:`<p>Initial bootstrap voltage from a 15 V supply with a 0.7 V diode (V)?</p>
`,explain:`<p>Vdd − Vf.</p>
`,answer:14.3,tol:.002,unit:``},{id:`p19-l07-q5`,type:`mc`,q:`<p>The bootstrap capacitor recharges when…</p>
`,explain:`<p>Only then is the diode forward biased.</p>
`,options:[`the low-side switch is on and the switch node is at ground`,`the input voltage is maximum`,`both switches are on`,`the high-side switch is on`],answer:0},{id:`p19-l07-q6`,type:`mc`,q:`<p>A design that must keep the high-side switch on indefinitely needs…</p>
`,explain:`<p>A bootstrap only refills during low-side on-time.</p>
`,options:[`a lower switching frequency`,`a charge pump or isolated gate supply`,`a slower diode`,`a larger bootstrap capacitor only`],answer:1}],"p19-l08":[{id:`p19-l08-q1`,type:`num`,q:`<p>Largest linear SVPWM phase amplitude on a 400 V bus (V)?</p>
`,explain:`<p>Vdc/√3.</p>
`,answer:230.9,tol:.002,unit:``},{id:`p19-l08-q2`,type:`num`,q:`<p>Switch states of a three-leg inverter?</p>
`,explain:`<p>Six active, two zero.</p>
`,answer:8,tol:.001,unit:``},{id:`p19-l08-q3`,type:`num`,q:`<p>Modulation index m for 20 V on a 60 V bus?</p>
`,explain:`<p>√3 |v| / Vdc.</p>
`,answer:.5774,tol:.002,unit:``},{id:`p19-l08-q4`,type:`num`,q:`<p>Extra voltage of SVPWM over sine PWM (percent)?</p>
`,explain:`<p>2/√3 − 1.</p>
`,answer:15.47,tol:.002,unit:``},{id:`p19-l08-q5`,type:`mc`,q:`<p>The zero-vector time in SVPWM is usually…</p>
`,explain:`<p>That centres the pattern.</p>
`,options:[`always spent in 111`,`split between 000 and 111`,`removed by raising the frequency`,`always spent in 000`],answer:1},{id:`p19-l08-q6`,type:`mc`,q:`<p>SVPWM is equivalent to sine PWM plus…</p>
`,explain:`<p>Min-max injection.</p>
`,options:[`a common-mode signal of minus half the sum of max and min`,`a third harmonic of the current`,`a dead-time correction`,`a DC offset on one phase`],answer:0}],"p19-l09":[{id:`p19-l09-q1`,type:`num`,q:`<p>Potential energy of 10 t descending 200 m (kWh)?</p>
`,explain:`<p>m g h divided by 3.6 MJ per kWh.</p>
`,answer:5.45,tol:.01,unit:``},{id:`p19-l09-q2`,type:`num`,q:`<p>Fraction stored from mechanical braking with 93 %, 97 % and 95 % efficiencies (%)?</p>
`,explain:`<p>Multiply the efficiencies.</p>
`,answer:85.7,tol:.01,unit:``},{id:`p19-l09-q3`,type:`num`,q:`<p>Braking power for 20 kN at 15 m/s (kW)?</p>
`,explain:`<p>P = F v.</p>
`,answer:300,tol:.001,unit:``},{id:`p19-l09-q4`,type:`num`,q:`<p>Air drag power with cdA 8 m², ρ 1.2 kg/m³ at 10 m/s (kW)?</p>
`,explain:`<p>½ρ cdA v³.</p>
`,answer:4.8,tol:.01,unit:``},{id:`p19-l09-q5`,type:`mc`,q:`<p>What happens to braking energy the battery cannot accept?</p>
`,explain:`<p>The excess must be dissipated somewhere.</p>
`,options:[`It is stored in the motor`,`It goes to friction brakes or a braking resistor`,`It disappears`,`It raises the bus voltage harmlessly forever`],answer:1},{id:`p19-l09-q6`,type:`mc`,q:`<p>Why check that the energy accounts close?</p>
`,explain:`<p>Every joule must be booked once.</p>
`,options:[`It catches sign errors and missing loss terms`,`It makes the battery larger`,`It speeds up the simulation`,`It is required by the motor`],answer:0}],"p19-l10":[{id:`p19-l10-q1`,type:`num`,q:`<p>Current for 0.5C on a 4 Ah cell (A)?</p>
`,explain:`<p>C-rate times capacity.</p>
`,answer:2,tol:.001,unit:``},{id:`p19-l10-q2`,type:`num`,q:`<p>Terminal voltage at OCV 3.7 V, 6 A and 25 mΩ (V)?</p>
`,explain:`<p>V = OCV − i R0.</p>
`,answer:3.55,tol:.002,unit:``},{id:`p19-l10-q3`,type:`num`,q:`<p>Heat in R0 = 30 mΩ at 15 A (W)?</p>
`,explain:`<p>i² R0.</p>
`,answer:6.75,tol:.002,unit:``},{id:`p19-l10-q4`,type:`num`,q:`<p>SOC after drawing 1.5 Ah from a full 3 Ah cell (%)?</p>
`,explain:`<p>Coulomb counting.</p>
`,answer:50,tol:.001,unit:``},{id:`p19-l10-q5`,type:`mc`,q:`<p>Why does a cell deliver less energy at high C-rate?</p>
`,explain:`<p>Voltage drop and early cut-off.</p>
`,options:[`The capacity label is wrong`,`Lithium is used up faster`,`Cells only work at 1C`,`Internal resistance lowers the voltage and the cut-off is reached earlier`],answer:3},{id:`p19-l10-q6`,type:`mc`,q:`<p>Which chemistry has the flattest OCV curve?</p>
`,explain:`<p>LFP sits near 3.3 V for most of its range.</p>
`,options:[`NMC`,`LFP`,`All are equally steep`,`Lead-acid`],answer:1}],"p19-l11":[{id:`p19-l11-q1`,type:`num`,q:`<p>Time constant of R = 15 mΩ, C = 2000 F (s)?</p>
`,explain:`<p>τ = R C.</p>
`,answer:30,tol:.001,unit:``},{id:`p19-l11-q2`,type:`num`,q:`<p>Fraction of an RC branch’s final voltage reached after one time constant (%)?</p>
`,explain:`<p>1 − e⁻¹.</p>
`,answer:63.2,tol:.002,unit:``},{id:`p19-l11-q3`,type:`num`,q:`<p>Terminal voltage at OCV 3.8 V, 4 A, R0 20 mΩ and v1 30 mV (V)?</p>
`,explain:`<p>OCV − i R0 − v1.</p>
`,answer:3.69,tol:.002,unit:``},{id:`p19-l11-q4`,type:`num`,q:`<p>Discrete decay factor exp(−Δt/τ) for Δt 0.1 s and τ 20 s?</p>
`,explain:`<p>Close to 1 for fast sampling.</p>
`,answer:.995,tol:.001,unit:``},{id:`p19-l11-q5`,type:`mc`,q:`<p>What sets R0 in a pulse test?</p>
`,explain:`<p>The ohmic part responds at once.</p>
`,options:[`The capacity`,`The slowest time constant`,`The voltage after a long rest`,`The instantaneous voltage step divided by the current step`],answer:3},{id:`p19-l11-q6`,type:`mc`,q:`<p>Why do ECMs suit battery management systems?</p>
`,explain:`<p>Cheap and well-fitted.</p>
`,options:[`They ignore SOC`,`They need no parameters`,`They run in a few multiplications per step and fit measured data`,`They model every chemical reaction`],answer:2}],"p19-l12":[{id:`p19-l12-q1`,type:`num`,q:`<p>SOC drift per hour from a 100 mA offset on a 3 Ah cell (%)?</p>
`,explain:`<p>Offset over capacity.</p>
`,answer:3.33,tol:.003,unit:``},{id:`p19-l12-q2`,type:`num`,q:`<p>SOC after 1 Ah from 80 % on a 4 Ah cell (%)?</p>
`,explain:`<p>Coulomb counting.</p>
`,answer:55,tol:.001,unit:``},{id:`p19-l12-q3`,type:`num`,q:`<p>Number of states in the 1-RC SOC filter?</p>
`,explain:`<p>SOC and the RC voltage.</p>
`,answer:2,tol:.001,unit:``},{id:`p19-l12-q4`,type:`num`,q:`<p>Kalman gain for scalar P 0.04, H 1.2 and R 1e-5?</p>
`,explain:`<p>K = P H / (H² P + R).</p>
`,answer:.833,tol:.003,unit:``},{id:`p19-l12-q5`,type:`mc`,q:`<p>What can Coulomb counting never fix on its own?</p>
`,explain:`<p>It has no feedback.</p>
`,options:[`Sampling at 1 Hz`,`Regenerative pulses`,`A wrong initial SOC`,`Fast current changes`],answer:2},{id:`p19-l12-q6`,type:`mc`,q:`<p>What does the EKF use to correct SOC?</p>
`,explain:`<p>The voltage innovation.</p>
`,options:[`The capacity label`,`Nothing, it only integrates current`,`The temperature only`,`The difference between measured and predicted terminal voltage`],answer:3}],"p19-l13":[{id:`p19-l13-q1`,type:`num`,q:`<p>Bleed current at 4.1 V through 47 Ω (mA)?</p>
`,explain:`<p>v / R.</p>
`,answer:87.2,tol:.003,unit:``},{id:`p19-l13-q2`,type:`num`,q:`<p>Power in a 33 Ω bleed resistor at 4.2 V (W)?</p>
`,explain:`<p>v² / R.</p>
`,answer:.535,tol:.003,unit:``},{id:`p19-l13-q3`,type:`num`,q:`<p>Hours to bleed 0.15 Ah at 120 mA?</p>
`,explain:`<p>Charge over current.</p>
`,answer:1.25,tol:.002,unit:``},{id:`p19-l13-q4`,type:`num`,q:`<p>Energy wasted bleeding 0.1 Ah at about 4 V (Wh)?</p>
`,explain:`<p>Charge times voltage.</p>
`,answer:.4,tol:.002,unit:``},{id:`p19-l13-q5`,type:`mc`,q:`<p>Which cell limits charging in a series string?</p>
`,explain:`<p>It reaches maximum voltage first.</p>
`,options:[`The fullest cell`,`The middle cell`,`The emptiest cell`,`None, the pack voltage decides`],answer:0},{id:`p19-l13-q6`,type:`mc`,q:`<p>What does passive balancing do with excess charge?</p>
`,explain:`<p>Active balancing moves charge; passive burns it.</p>
`,options:[`Turns it into heat in a resistor`,`Returns it to the charger`,`Stores it in a capacitor permanently`,`Moves it to the lowest cell`],answer:0}],"p19-l14":[{id:`p19-l14-q1`,type:`num`,q:`<p>Precharge current at C/10 for a 3.5 Ah cell (A)?</p>
`,explain:`<p>Capacity over 10.</p>
`,answer:.35,tol:.002,unit:``},{id:`p19-l14-q2`,type:`num`,q:`<p>Termination current at C/20 for a 4 Ah cell (mA)?</p>
`,explain:`<p>Capacity over 20.</p>
`,answer:200,tol:.001,unit:``},{id:`p19-l14-q3`,type:`num`,q:`<p>Minutes of CC at 1C to add 80 % SOC (ignoring losses)?</p>
`,explain:`<p>1C adds 100 % per hour.</p>
`,answer:48,tol:.001,unit:``},{id:`p19-l14-q4`,type:`num`,q:`<p>Voltage during CC with OCV 4.0 V, 3 A, R0 22 mΩ and v1 30 mV (V)?</p>
`,explain:`<p>Charging adds the drops.</p>
`,answer:4.096,tol:.001,unit:``},{id:`p19-l14-q5`,type:`mc`,q:`<p>When does a CC/CV charger terminate?</p>
`,explain:`<p>The taper current signals full.</p>
`,options:[`When the cell is warm`,`After exactly one hour`,`As soon as the voltage reaches the maximum`,`When the current in CV falls below the termination level`],answer:3},{id:`p19-l14-q6`,type:`mc`,q:`<p>What should over-temperature during charging do?</p>
`,explain:`<p>Fail safe.</p>
`,options:[`Nothing`,`Increase the current`,`Enter a fault state with zero current`,`Switch to CV`],answer:2}],"p19-l15":[{id:`p19-l15-q1`,type:`num`,q:`<p>Induced voltage for M = 0.5 nH and di/dt = 1 A/ns (V)?</p>
`,explain:`<p>v = M di/dt.</p>
`,answer:.5,tol:.002,unit:``},{id:`p19-l15-q2`,type:`num`,q:`<p>Current injected through 1 pF by 24 V in 4 ns (mA)?</p>
`,explain:`<p>i = C dV/dt.</p>
`,answer:6,tol:.002,unit:``},{id:`p19-l15-q3`,type:`num`,q:`<p>Spectrum corner frequency for a 5 ns rise time (MHz)?</p>
`,explain:`<p>1/(π tr).</p>
`,answer:63.7,tol:.003,unit:``},{id:`p19-l15-q4`,type:`num`,q:`<p>Field 5 mm from a long wire carrying 1 A (µT)?</p>
`,explain:`<p>μ0 I / (2π r).</p>
`,answer:40,tol:.002,unit:``},{id:`p19-l15-q5`,type:`mc`,q:`<p>What is the first layout step for a buck converter?</p>
`,explain:`<p>It minimises the hot loop.</p>
`,options:[`Make the switch node copper large`,`Place the input capacitor tight against the switches`,`Route the feedback trace first`,`Put the inductor far away`],answer:1},{id:`p19-l15-q6`,type:`mc`,q:`<p>Slower switching edges…</p>
`,explain:`<p>The classic trade-off.</p>
`,options:[`reduce high-frequency emissions but increase switching loss`,`increase emissions`,`reduce both emissions and loss`,`have no effect on EMC`],answer:0}],"p19-l16":[{id:`p19-l16-q1`,type:`num`,q:`<p>Risk score for severity 3 and likelihood 4 on the lesson’s scales?</p>
`,explain:`<p>S × L.</p>
`,answer:12,tol:.001,unit:``},{id:`p19-l16-q2`,type:`num`,q:`<p>Cells in a 4 × 4 risk matrix?</p>
`,explain:`<p>Every severity and likelihood pair.</p>
`,answer:16,tol:.001,unit:``},{id:`p19-l16-q3`,type:`num`,q:`<p>Steps in the ISO 12100 three-step risk reduction method?</p>
`,explain:`<p>Design, safeguarding, information.</p>
`,answer:3,tol:.001,unit:``},{id:`p19-l16-q4`,type:`num`,q:`<p>Score reduction from 4 × 3 to 4 × 1 (%)?</p>
`,explain:`<p>From 12 to 4.</p>
`,answer:66.7,tol:.003,unit:``},{id:`p19-l16-q5`,type:`mc`,q:`<p>Which risk reduction measure comes first?</p>
`,explain:`<p>Design out the hazard if possible.</p>
`,options:[`Training`,`Warning labels`,`Inherently safe design`,`Personal protective equipment`],answer:2},{id:`p19-l16-q6`,type:`mc`,q:`<p>What does ISO 12100 define?</p>
`,explain:`<p>Teams choose their own scales.</p>
`,options:[`Battery charging rules`,`Robot speed limits`,`A mandatory 5 × 5 risk matrix`,`The risk assessment and reduction process`],answer:3}],"p19-l17":[{id:`p19-l17-q1`,type:`num`,q:`<p>Dangerous failure rate for MTTFd 20 years (per hour, ×10⁻⁶)?</p>
`,explain:`<p>1/(MTTFd in hours).</p>
`,answer:5.71,tol:.003,unit:``},{id:`p19-l17-q2`,type:`num`,q:`<p>λDU for λD = 4e-6 per hour and DC 90 % (per hour, ×10⁻⁷)?</p>
`,explain:`<p>(1 − DC) λD.</p>
`,answer:4,tol:.002,unit:``},{id:`p19-l17-q3`,type:`num`,q:`<p>Common-cause floor βλDU for β 5 % and λDU 2e-7 per hour (×10⁻⁸)?</p>
`,explain:`<p>Both channels fail together.</p>
`,answer:1,tol:.002,unit:``},{id:`p19-l17-q4`,type:`num`,q:`<p>Simplified 1oo2 PFH with λDU 1e-7, β 0 and T 100000 h (×10⁻⁹)?</p>
`,explain:`<p>λ² T.</p>
`,answer:1,tol:.002,unit:``},{id:`p19-l17-q5`,type:`mc`,q:`<p>Which PL corresponds to PFH 5e-8 per hour?</p>
`,explain:`<p>1e-8 to 1e-7 is PL e.</p>
`,options:[`PL a`,`PL c`,`PL e`,`PL d`],answer:2},{id:`p19-l17-q6`,type:`mc`,q:`<p>What limits the benefit of redundancy?</p>
`,explain:`<p>β λDU is a floor.</p>
`,options:[`Diagnostic coverage above 99 %`,`Common-cause failures`,`The mission time only`,`The number of wires`],answer:1}],"p19-l18":[{id:`p19-l18-q1`,type:`num`,q:`<p>Deceleration for 3 N·m on 0.002 kg·m² (rad/s²)?</p>
`,explain:`<p>α = T / J.</p>
`,answer:1500,tol:.002,unit:``},{id:`p19-l18-q2`,type:`num`,q:`<p>Kinetic energy at 300 rad/s with 0.002 kg·m² (J)?</p>
`,explain:`<p>½ J ω².</p>
`,answer:90,tol:.001,unit:``},{id:`p19-l18-q3`,type:`num`,q:`<p>ISO 13855 distance with K 2000 mm/s, T 0.15 s and C 128 mm (mm)?</p>
`,explain:`<p>S = K T + C, under 500 mm so K = 2000 stands.</p>
`,answer:428,tol:.002,unit:``},{id:`p19-l18-q4`,type:`num`,q:`<p>Intrusion allowance C for a light curtain detecting 14 mm objects (mm)?</p>
`,explain:`<p>C = 8(d − 14).</p>
`,answer:0,tol:.001,unit:``},{id:`p19-l18-q5`,type:`mc`,q:`<p>Which stop category keeps power on after stopping?</p>
`,explain:`<p>Category 2 holds position with power.</p>
`,options:[`Category 2`,`Category 0`,`None`,`Category 1`],answer:0},{id:`p19-l18-q6`,type:`mc`,q:`<p>What does Safe Torque Off do?</p>
`,explain:`<p>It blocks the gate signals.</p>
`,options:[`Brakes the motor with maximum torque`,`Disconnects the mains supply`,`Prevents the drive from producing torque through independent channels`,`Lowers the speed setpoint`],answer:2}],"p19-l19":[{id:`p19-l19-q1`,type:`num`,q:`<p>Largest true change per sample at 2 rad/s and 1 kHz (mrad)?</p>
`,explain:`<p>Rate divided by sampling rate.</p>
`,answer:2,tol:.001,unit:``},{id:`p19-l19-q2`,type:`num`,q:`<p>Cross-check delay for 10 samples at 1 kHz (ms)?</p>
`,explain:`<p>Persistence count over the rate.</p>
`,answer:10,tol:.001,unit:``},{id:`p19-l19-q3`,type:`num`,q:`<p>Time for a 0.2 rad/s drift to exceed 0.02 rad (ms)?</p>
`,explain:`<p>Tolerance over drift rate.</p>
`,answer:100,tol:.001,unit:``},{id:`p19-l19-q4`,type:`num`,q:`<p>Watchdog timeout for 25 missed samples at 1 kHz (ms)?</p>
`,explain:`<p>One millisecond per sample.</p>
`,answer:25,tol:.001,unit:``},{id:`p19-l19-q5`,type:`mc`,q:`<p>Which monitor catches a sensor stuck at a valid value?</p>
`,explain:`<p>A stuck value stays in range and does not jump.</p>
`,options:[`The cross-check against a second sensor`,`None of them`,`The range check`,`The rate check`],answer:0},{id:`p19-l19-q6`,type:`mc`,q:`<p>Why require a disagreement to persist for several samples?</p>
`,explain:`<p>Persistence trades latency for false alarms.</p>
`,options:[`To avoid nuisance trips from noise`,`To save memory`,`To make detection faster`,`Because sensors are always wrong`],answer:0}],"p19-l20":[{id:`p19-l20-q1`,type:`num`,q:`<p>RPN for S 7, O 4 and D 5?</p>
`,explain:`<p>S × O × D.</p>
`,answer:140,tol:.001,unit:``},{id:`p19-l20-q2`,type:`num`,q:`<p>Largest possible RPN on 1 to 10 scales?</p>
`,explain:`<p>10³.</p>
`,answer:1e3,tol:.001,unit:``},{id:`p19-l20-q3`,type:`num`,q:`<p>RPN reduction from 180 to 54 (%)?</p>
`,explain:`<p>(180 − 54)/180.</p>
`,answer:70,tol:.002,unit:``},{id:`p19-l20-q4`,type:`num`,q:`<p>New RPN if detection improves from 6 to 2 with S 9 and O 2?</p>
`,explain:`<p>Only D changes.</p>
`,answer:36,tol:.001,unit:``},{id:`p19-l20-q5`,type:`mc`,q:`<p>What is the main weakness of ranking by RPN?</p>
`,explain:`<p>Multiplying ordinal scores hides severity.</p>
`,options:[`It is too hard to compute`,`A severe failure can rank below a mild frequent one`,`It ignores occurrence`,`It only works for software`],answer:1},{id:`p19-l20-q6`,type:`mc`,q:`<p>What does a detection rating of 10 mean?</p>
`,explain:`<p>Higher D is worse.</p>
`,options:[`The failure is always detected`,`The failure never occurs`,`The effect is harmless`,`The failure cannot be detected before it causes harm`],answer:3}],"p19-l21":[{id:`p19-l21-q1`,type:`num`,q:`<p>Coverage if 5 of 6 fault classes always react in time (%)?</p>
`,explain:`<p>Classes covered over classes tested.</p>
`,answer:83.3,tol:.003,unit:``},{id:`p19-l21-q2`,type:`num`,q:`<p>Total injections for 6 classes × 15 trials?</p>
`,explain:`<p>Classes times trials.</p>
`,answer:90,tol:.001,unit:``},{id:`p19-l21-q3`,type:`num`,q:`<p>Current mismatch for a dead motor commanded 0.6 N·m with kt 0.1 N·m/A (A)?</p>
`,explain:`<p>τ/kt with zero measured current.</p>
`,answer:6,tol:.001,unit:``},{id:`p19-l21-q4`,type:`num`,q:`<p>Watchdog delay for 10 missed messages at 1 kHz (ms)?</p>
`,explain:`<p>One millisecond per message.</p>
`,answer:10,tol:.001,unit:``},{id:`p19-l21-q5`,type:`mc`,q:`<p>What must a campaign check besides detection?</p>
`,explain:`<p>Nuisance trips erode trust and availability.</p>
`,options:[`That the code is short`,`That faults never happen`,`That the motor is large`,`That healthy runs raise no false trips`],answer:3},{id:`p19-l21-q6`,type:`mc`,q:`<p>Which monitor catches a lost setpoint stream?</p>
`,explain:`<p>Stale data are detected by freshness.</p>
`,options:[`The range check`,`Current plausibility`,`The encoder rate check`,`A watchdog on the message counter`],answer:3}],"p19-l22":[{id:`p19-l22-q1`,type:`num`,q:`<p>Creepage around a 1 mm slot reaching 3 mm beyond pads 3 mm apart (mm)?</p>
`,explain:`<p>Two diagonals and the slot width.</p>
`,answer:7.325,tol:.002,unit:``},{id:`p19-l22-q2`,type:`num`,q:`<p>Reinforced creepage if basic needs 2.5 mm and reinforced doubles it (mm)?</p>
`,explain:`<p>Roughly twice basic.</p>
`,answer:5,tol:.001,unit:``},{id:`p19-l22-q3`,type:`num`,q:`<p>Clearance between pads at x 17 mm and x 22 mm on the same row (mm)?</p>
`,explain:`<p>Straight line through air.</p>
`,answer:5,tol:.001,unit:``},{id:`p19-l22-q4`,type:`num`,q:`<p>Diagonal from (17, 9) to (18.5, 12) in mm?</p>
`,explain:`<p>Part of the creepage path.</p>
`,answer:3.354,tol:.002,unit:``},{id:`p19-l22-q5`,type:`mc`,q:`<p>Which insulation grade separates mains from touchable SELV circuits?</p>
`,explain:`<p>Two levels of protection.</p>
`,options:[`Functional`,`None`,`Basic only`,`Double or reinforced`],answer:3},{id:`p19-l22-q6`,type:`mc`,q:`<p>Which distance does a slot lengthen?</p>
`,explain:`<p>Air paths go over the slot.</p>
`,options:[`Clearance`,`Both equally`,`Neither`,`Creepage`],answer:3}]};export{e as default};