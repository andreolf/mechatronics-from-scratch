var e={"p21-l01":[{id:`p21-l01-q1`,type:`mc`,q:`<p>What is the one thing a cable cannot do?</p>
`,explain:`<p>A cable in compression goes slack. Every design choice in a CDPR follows from that.</p>
`,options:[`Push`,`Carry a signal`,`Pull`,`Change length`],answer:0},{id:`p21-l01-q2`,type:`mc`,q:`<p>How many cables must surround a point to hold it against a force from any direction, with no gravity to help?</p>
`,explain:`<p>n + 1 for n degrees of freedom. With three, some direction cannot be resisted with positive tensions.</p>
`,options:[`4`,`6`,`3`,`2`],answer:0},{id:`p21-l01-q3`,type:`mc`,q:`<p>Why can Stringman hold its gripper with four cables even though they all meet at one point?</p>
`,explain:`<p>A suspended robot uses its own weight as the restoring force.</p>
`,options:[`The motors push as well as pull`,`The anchors are at different heights`,`Gravity always pulls down, acting like an extra cable that never goes slack`,`The pole is stiff`],answer:2},{id:`p21-l01-q4`,type:`num`,q:`<p>Stringman’s work volume per $1,000 for a 7 × 7 × 3 m room at $795 (m³)?</p>
`,explain:`<p>147 m³ divided by 0.795.</p>
`,answer:184.9,tol:.002,unit:``},{id:`p21-l01-q5`,type:`num`,q:`<p>Volume of a 0.75 m hemisphere (m³)?</p>
`,explain:`<p>Half of (4/3)πr³.</p>
`,answer:.8836,tol:.002,unit:``},{id:`p21-l01-q6`,type:`num`,q:`<p>What mass weighs 28 N (kg)?</p>
`,explain:`<p>m = F/g.</p>
`,answer:2.854,tol:.002,unit:``},{id:`p21-l01-q7`,type:`mc`,q:`<p>What did NIST’s RoboCrane gain by using six cables to three points instead of one hook?</p>
`,explain:`<p>A single-point crane resists swing and twist poorly; six cables fix all six degrees of freedom.</p>
`,options:[`Cheaper winches`,`A higher top speed`,`Fewer cables to inspect`,`Control of the platform’s full pose, so it no longer swings or twists freely`],answer:3}],"p21-l02":[{id:`p21-l02-q1`,type:`num`,q:`<p>Length of line 2 from anchor (3.5, −3.5, 3) to a pivot at (1.0, −0.5, 0.9) (m)?</p>
`,explain:`<p>The straight-line distance.</p>
`,answer:4.434,tol:.001,unit:``},{id:`p21-l02-q2`,type:`num`,q:`<p>Rate of change of that line when the pivot moves at 0.4 m/s in +x (m/s)?</p>
`,explain:`<p>−u·v, with the x component of (p − a)/l equal to −2.5/4.434.</p>
`,answer:-.2255,tol:.005,unit:``},{id:`p21-l02-q3`,type:`mc`,q:`<p>What is row i of the length Jacobian dl/dp?</p>
`,explain:`<p>Differentiating the distance gives −u_iᵀ.</p>
`,options:[`The cable tension`,`The anchor position`,`Minus the unit vector from the pivot to anchor i`,`The cross product of two cable directions`],answer:2},{id:`p21-l02-q4`,type:`mc`,q:`<p>You want Stringman’s fingers at a point on the floor. Where do you aim the pivot?</p>
`,explain:`<p>The gripper hangs on a 50 cm pole below the pivot.</p>
`,options:[`0.5 m below the point`,`At the nearest anchor`,`At the point`,`0.5 m above the point`],answer:3},{id:`p21-l02-q5`,type:`mc`,q:`<p>The forward-kinematics residual jumps to several centimetres. What is the most likely cause?</p>
`,explain:`<p>Consistent lengths leave micrometre residuals.</p>
`,options:[`The robot is at the centre`,`Gauss-Newton always does that`,`A line has slipped or gone slack, so the lengths no longer agree`,`The anchors are too high`],answer:2},{id:`p21-l02-q6`,type:`num`,q:`<p>At the room centre, height where lifting at 0.4 m/s needs 0.2 m/s of winch speed per line (m)?</p>
`,explain:`<p>sinθ = 1/2 means (3 − z)² = 24.5/3.</p>
`,answer:.142,tol:.01,unit:``}],"p21-l03":[{id:`p21-l03-q1`,type:`num`,q:`<p>Tension in each line at the centre of a 7 × 7 × 3 m room with the pivot at 1.5 m and 1.25 kg (N)?</p>
`,explain:`<p>m g / (4 sin θ) with sin θ = 1.5/5.172.</p>
`,answer:10.57,tol:.005,unit:``},{id:`p21-l03-q2`,type:`mc`,q:`<p>What does moving along the null vector do at the centre of a square room?</p>
`,explain:`<p>n ∝ (1, −1, 1, −1); the net force does not change.</p>
`,options:[`Rotates the gripper`,`Tightens one diagonal pair and loosens the other`,`Tightens all four lines`,`Lifts the gripper`],answer:1},{id:`p21-l03-q3`,type:`mc`,q:`<p>Why can’t a robot with all four anchors above the payload be pretensioned?</p>
`,explain:`<p>All lines can only pull upwards; gravity provides the tension.</p>
`,options:[`The pole is too short`,`Its motors are too weak`,`Cables stretch`,`Every null-space direction has mixed signs, so no internal force tightens all lines at once`],answer:3},{id:`p21-l03-q4`,type:`mc`,q:`<p>The minimum-norm tensions at a pose have one negative entry, and the feasible interval for λ is empty. What does that mean?</p>
`,explain:`<p>An empty interval means there is no all-pulling solution; one line would have to push.</p>
`,options:[`Use the minimax solution`,`The Jacobian is wrong`,`No combination of pulling cables can hold the load there`,`Increase the payload`],answer:2},{id:`p21-l03-q5`,type:`num`,q:`<p>Lowest possible peak tension at the pivot (1.0, −0.5, 0.9) with 1.25 kg (N)?</p>
`,explain:`<p>The minimax choice, with lines 2 and 3 equal at the peak.</p>
`,answer:8.96,tol:.01,unit:``},{id:`p21-l03-q6`,type:`num`,q:`<p>With a position-controlled four-line robot at the centre, one line is commanded 1 mm too long. How many lines are left carrying the load in the ideal rigid model?</p>
`,explain:`<p>Three lines fix the point; the fourth goes slack.</p>
`,answer:3,tol:0,unit:``}],"p21-l04":[{id:`p21-l04-q1`,type:`num`,q:`<p>Capacity at the centre of the 7 × 7 × 3 m room, gripper on the floor (pivot 0.5 m), with a 28 N limit (kg)?</p>
`,explain:`<p>4 T sin θ / g with sin θ = 2.5/5.545.</p>
`,answer:5.15,tol:.005,unit:``},{id:`p21-l04-q2`,type:`mc`,q:`<p>You lower the tension limit from 28 N to 14 N. What happens to the capacity map?</p>
`,explain:`<p>Tensions scale with the mass, so capacity is linear in the limit.</p>
`,options:[`The centre goes up`,`Only the corners change`,`Every value halves`,`Nothing, capacity depends only on geometry`],answer:2},{id:`p21-l04-q3`,type:`mc`,q:`<p>Close under the ceiling, where does a four-line robot hold the most?</p>
`,explain:`<p>At the centre the lines are nearly flat there; under an anchor one line can take the whole load.</p>
`,options:[`At the centre`,`Halfway along a wall`,`Everywhere equally`,`Under an anchor, where one line hangs nearly vertical`],answer:3},{id:`p21-l04-q4`,type:`num`,q:`<p>Capacity at the centre with the pivot at 1.5 m and a 28 N limit (kg)?</p>
`,explain:`<p>sin θ = 0.290.</p>
`,answer:3.31,tol:.005,unit:``},{id:`p21-l04-q5`,type:`mc`,q:`<p>The capacity of the lines is 3 kg at a point and the gripper weighs 0.6 kg. What can it pick up there?</p>
`,explain:`<p>Everything that hangs counts against the same tensions.</p>
`,options:[`3.6 kg`,`0.6 kg`,`2.4 kg`,`3 kg`],answer:2},{id:`p21-l04-q6`,type:`num`,q:`<p>In the point-mass model, what working tension per line gives 2 kg at the floor centre (N)?</p>
`,explain:`<p>T = m g / (4 sin θ).</p>
`,answer:10.9,tol:.01,unit:``}],"p21-l05":[{id:`p21-l05-q1`,type:`num`,q:`<p>Line tension from 1 N·m on an empty 72 mm diameter spool (N)?</p>
`,explain:`<p>T = τ / r with r = 36 mm.</p>
`,answer:27.8,tol:.005,unit:``},{id:`p21-l05-q2`,type:`num`,q:`<p>Motor speed for 0.4 m/s of line on that spool (rpm)?</p>
`,explain:`<p>ω = v / r = 11.1 rad/s.</p>
`,answer:106,tol:.01,unit:``},{id:`p21-l05-q3`,type:`num`,q:`<p>Length of line per count of a 12-bit encoder on a 72 mm spool (mm)?</p>
`,explain:`<p>π D / 4096.</p>
`,answer:.0552,tol:.01,unit:``},{id:`p21-l05-q4`,type:`mc`,q:`<p>Why does Stringman’s firmware use an exponential relation between motor angle and wound length?</p>
`,explain:`<p>ds/dθ = π D(s) with D linear in s.</p>
`,options:[`The motor is non-linear`,`It approximates a gearbox`,`The diameter grows linearly with line wound on, so wound length grows exponentially with angle`,`Line stretch is exponential`],answer:2},{id:`p21-l05-q5`,type:`mc`,q:`<p>What must you subtract from the measured motor torque before dividing by the radius to get tension?</p>
`,explain:`<p>Friction differs from unit to unit and in Stringman’s measurements was worth up to about 0.9 N.</p>
`,options:[`The encoder offset`,`The gravity torque of the spool`,`The motor’s own holding or friction torque`,`Nothing`],answer:2},{id:`p21-l05-q6`,type:`mc`,q:`<p>What is the main reason to use direct drive for a cable robot’s winches?</p>
`,explain:`<p>No gearbox friction in between, and the drive is back-drivable.</p>
`,options:[`It is the cheapest option`,`It needs no encoder`,`Torque becomes a usable tension estimate and the line can be pulled off by hand when relaxed`,`It gives the most torque`],answer:2}],"p21-l06":[{id:`p21-l06-q1`,type:`mc`,q:`<p>A suspended four-line robot winds its lines to lengths from a model. Where does the gripper come to rest?</p>
`,explain:`<p>Gravity pulls it down until the lines stop it; usually three are taut.</p>
`,options:[`At the least-squares point`,`At the commanded point`,`At the lowest point no further from each real anchor than its line`,`Directly under the centre of the room`],answer:2},{id:`p21-l06-q2`,type:`num`,q:`<p>The lines rise at sin θ = 0.375 and a line is 6.6 cm too short. Roughly how far does the gripper rise to make up the length (cm)?</p>
`,explain:`<p>To first order, Δz = Δl / sin θ.</p>
`,answer:17.6,tol:.01,unit:``},{id:`p21-l06-q3`,type:`mc`,q:`<p>Your calibration says the ceiling is 5 cm lower than it is. What do you see?</p>
`,explain:`<p>A common height error is a pure translation.</p>
`,options:[`Slack lines everywhere`,`The whole workspace shifted up by 5 cm`,`A sideways drift`,`An arch`],answer:1},{id:`p21-l06-q4`,type:`mc`,q:`<p>Which pair of unknowns is hardest to tell apart in an anchor calibration?</p>
`,explain:`<p>Both change the reading by the same amount until the line direction changes.</p>
`,options:[`The payload and the tension limit`,`An anchor’s position along its own line and that line’s counter offset`,`Two different anchors’ heights`,`The x and y of the gripper`],answer:1},{id:`p21-l06-q5`,type:`mc`,q:`<p>What does Stringman’s quick calibration do?</p>
`,explain:`<p>It takes seconds and fixes slight slack, not anchor errors.</p>
`,options:[`Tightens the lines and resets the line-length counters from what the cameras see`,`Measures the payload`,`Re-solves all the anchor positions`,`Calibrates the camera lenses`],answer:0},{id:`p21-l06-q6`,type:`mc`,q:`<p>The calibration residual is 1 mm, the same as the measurement noise. What does that prove?</p>
`,explain:`<p>Poorly spread poses can give a small residual and a wrong answer.</p>
`,options:[`The poses were well chosen`,`The anchors are within 1 mm`,`Nothing at all`,`Only that the model can explain the data, not that the anchors are right`],answer:3}],"p21-l07":[{id:`p21-l07-q1`,type:`num`,q:`<p>Period of a 0.5 m pendulum (s)?</p>
`,explain:`<p>T = 2π √(l/g).</p>
`,answer:1.419,tol:.001,unit:``},{id:`p21-l07-q2`,type:`num`,q:`<p>Swing amplitude after a sudden stop from 0.4 m/s on that pole (cm)?</p>
`,explain:`<p>The gripper keeps 0.4 m/s; amplitude is v/ω.</p>
`,answer:9.03,tol:.005,unit:``},{id:`p21-l07-q3`,type:`num`,q:`<p>How much time does a zero-vibration shaper add to a move for that pole (s)?</p>
`,explain:`<p>Half a period.</p>
`,answer:.709,tol:.002,unit:``},{id:`p21-l07-q4`,type:`mc`,q:`<p>Which law on the pivot’s acceleration damps the swing?</p>
`,explain:`<p>It turns the −a coupling into −k_d d’, a damping term.</p>
`,options:[`a = −k_d d’`,`a = k_d d’, towards the direction the gripper is moving`,`a = 0`,`a = constant`],answer:1},{id:`p21-l07-q5`,type:`mc`,q:`<p>Why does Stringman project its fitted swing state forward before computing the correction?</p>
`,explain:`<p>The projection is by the measured round-trip latency.</p>
`,options:[`To make the correction land in phase despite the delay between measuring and moving`,`To filter gyro noise`,`To find the pole length`,`To save bandwidth`],answer:0},{id:`p21-l07-q6`,type:`mc`,q:`<p>What does a ZV shaper do about a swing started by someone bumping the gripper?</p>
`,explain:`<p>Shaping is open loop.</p>
`,options:[`It damps it in half a period`,`Nothing; it only shapes commanded moves`,`It measures it`,`It doubles it`],answer:1}],"p21-l08":[{id:`p21-l08-q1`,type:`num`,q:`<p>What mass has a weight of 28 N (kg)?</p>
`,explain:`<p>m = F / g.</p>
`,answer:2.85,tol:.005,unit:``},{id:`p21-l08-q2`,type:`num`,q:`<p>Most force a line at 28 N can press on a body it wraps around, bent 90° on each side (N)?</p>
`,explain:`<p>F = 2 T sin φ with φ = 90°.</p>
`,answer:56,tol:.001,unit:``},{id:`p21-l08-q3`,type:`mc`,q:`<p>A 15 N push is applied suddenly to a hanging 1.25 kg gripper. How does the peak pole force compare with the steady value?</p>
`,explain:`<p>33.6 N against 19.4 N in the undamped model.</p>
`,options:[`The same`,`About 1.7 times higher, because the swing overshoots`,`Ten times higher`,`Half`],answer:1},{id:`p21-l08-q4`,type:`num`,q:`<p>Kinetic energy of a 1.25 kg gripper dropped from 2.5 m when it reaches the floor (J)?</p>
`,explain:`<p>m g h.</p>
`,answer:30.7,tol:.005,unit:``},{id:`p21-l08-q5`,type:`mc`,q:`<p>Which of these does a 28 N line-tension limit NOT protect against?</p>
`,explain:`<p>At the spool the force comes from the motor torque directly.</p>
`,options:[`A finger pinched at a spool`,`A line bent around a wrist`,`A line snapping from overload`,`The gripper pushing hard on a person`],answer:0},{id:`p21-l08-q6`,type:`mc`,q:`<p>Why must the safety supervisor latch?</p>
`,explain:`<p>An unlatched stop oscillates between trip and recovery.</p>
`,options:[`Because sensors are noisy`,`To keep the calibration`,`Otherwise it re-tightens into the same fault as soon as relaxing lowers the tension`,`To save power`],answer:2}],"p21-l09":[{id:`p21-l09-q1`,type:`num`,q:`<p>Phase lag of a 0.5 m swing for a 200 ms loop delay (degrees)?</p>
`,explain:`<p>ω τ with ω = 4.43 rad/s.</p>
`,answer:50.8,tol:.005,unit:``},{id:`p21-l09-q2`,type:`num`,q:`<p>Data rate of a 2 × 2 state of 4-byte floats sent at 100 Hz (kB/s)?</p>
`,explain:`<p>16 bytes per message.</p>
`,answer:1.6,tol:.001,unit:``},{id:`p21-l09-q3`,type:`mc`,q:`<p>Which loop does Stringman keep on the anchor instead of across the network?</p>
`,explain:`<p>The 50 Hz tension loop runs on the anchor itself.</p>
`,options:[`Line tension regulation and the 40 N cut-off`,`Calibration`,`Swing cancellation`,`The learned policy`],answer:0},{id:`p21-l09-q4`,type:`mc`,q:`<p>How does the motion controller find the robot’s components?</p>
`,explain:`<p>The component server registers an mDNS service.</p>
`,options:[`Over Bluetooth`,`Through a cloud server only`,`They announce themselves with mDNS and serve WebSockets on port 8765`,`You type their IP addresses`],answer:2},{id:`p21-l09-q5`,type:`mc`,q:`<p>What does projecting the measured swing forward by the delay assume?</p>
`,explain:`<p>It is a rotation by ωτ, exact only for a free pendulum.</p>
`,options:[`That the pendulum swings freely during the delay`,`That the gyro is noise-free`,`That the pivot is fixed forever`,`That there is no delay`],answer:0},{id:`p21-l09-q6`,type:`num`,q:`<p>Delay at which the phase lag of a 0.5 m swing reaches 90° (s)?</p>
`,explain:`<p>A quarter period.</p>
`,answer:.355,tol:.005,unit:``}],"p21-l10":[{id:`p21-l10-q1`,type:`mc`,q:`<p>What breaks the usual i.i.d. assumption in imitation learning?</p>
`,explain:`<p>The clone’s mistakes take it to states the expert never visited.</p>
`,options:[`The images are too large`,`The robot has four motors`,`Future observations depend on the policy’s own previous actions`,`The dataset is public`],answer:2},{id:`p21-l10-q2`,type:`num`,q:`<p>Spread after 100 steps of a random walk with 1.5 cm steps (cm)?</p>
`,explain:`<p>σ √n.</p>
`,answer:15,tol:.001,unit:``},{id:`p21-l10-q3`,type:`mc`,q:`<p>What does DART change about the demonstrations?</p>
`,explain:`<p>The expert has to correct the injected errors.</p>
`,options:[`It injects noise while the expert demonstrates, so the data show recoveries`,`It removes noisy demonstrations`,`It records at a higher frame rate`,`It uses a different robot`],answer:0},{id:`p21-l10-q4`,type:`mc`,q:`<p>Which Stringman interface should a new autonomous behaviour written in Python use?</p>
`,explain:`<p>The observer owns connections, state and motion primitives.</p>
`,options:[`A Maneuver registered with the AsyncObserver`,`Raw CAN messages to the motors`,`Writing to configuration.json`,`SSH into an anchor`],answer:0},{id:`p21-l10-q5`,type:`mc`,q:`<p>What does Neufangled recommend about swing cancellation when recording datasets?</p>
`,explain:`<p>The policy learns what it sees; keep the same conditions.</p>
`,options:[`Turn it off for recording`,`It does not matter`,`Record and evaluate with it on`,`Only use it for evaluation`],answer:2},{id:`p21-l10-q6`,type:`mc`,q:`<p>Why can time distortion in a dataset hurt the trained policy?</p>
`,explain:`<p>The observation-action pairing is what the model learns.</p>
`,options:[`It changes the camera colours`,`It makes the files bigger`,`Frames and commands drift apart, so the model learns actions for the wrong observations`,`It slows down training only`],answer:2}],"p21-l11":[{id:`p21-l11-q1`,type:`num`,q:`<p>Capacity at the centre of the desk frame with the pivot at 0.1 m and a 5 N limit (kg)?</p>
`,explain:`<p>4 T sin θ / g with the lines rising 0.4 m over 0.5 m.</p>
`,answer:1.27,tol:.005,unit:``},{id:`p21-l11-q2`,type:`num`,q:`<p>Tension in each line at rest in the middle, 0.2 kg hanging, pivot at 0.2 m (N)?</p>
`,explain:`<p>m g / (4 sin θ) with sin θ = 0.3/0.583.</p>
`,answer:.953,tol:.005,unit:``},{id:`p21-l11-q3`,type:`num`,q:`<p>Longest line needed in the desk frame, anchor to the opposite bottom corner (m)?</p>
`,explain:`<p>The space diagonal.</p>
`,answer:1.118,tol:.001,unit:``},{id:`p21-l11-q4`,type:`mc`,q:`<p>Why write the BOM as requirements instead of part numbers?</p>
`,explain:`<p>A requirement says why a part was chosen.</p>
`,options:[`It is shorter`,`Suppliers prefer it`,`It avoids licences`,`Requirements stay valid when parts and prices change, and each line can be checked against a lesson`],answer:3},{id:`p21-l11-q5`,type:`mc`,q:`<p>Under which licence are Stringman’s hardware designs released?</p>
`,explain:`<p>Per Neufangled’s downloads page; the software is Apache-2.0.</p>
`,options:[`CERN-OHL-W 2.0 with a responsibility addendum`,`They are proprietary`,`Apache-2.0`,`MIT`],answer:0},{id:`p21-l11-q6`,type:`mc`,q:`<p>What should be the first test of the build?</p>
`,explain:`<p>Every later stage depends on the winch.</p>
`,options:[`Swing damping with an IMU`,`One winch on the bench: commanded length against a measured weight`,`Calibrate all four anchors`,`Train a policy`],answer:1}]};export{e as default};