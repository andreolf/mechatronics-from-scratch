var e={"p15-l01":[{id:`p15-l01-q1`,type:`num`,q:`<p>DOF of a planar four-bar linkage by Grubler’s formula?</p>
`,explain:`<p>One input angle sets the whole linkage.</p>
`,answer:1,tol:.001,unit:``},{id:`p15-l01-q2`,type:`num`,q:`<p>DOF of a planar five-bar linkage?</p>
`,explain:`<p>Two motors are needed.</p>
`,answer:2,tol:.001,unit:``},{id:`p15-l01-q3`,type:`num`,q:`<p>DOF of a Stewart platform with 6 U, 6 S and 6 P joints and 14 bodies?</p>
`,explain:`<p>A full 6-DOF parallel robot.</p>
`,answer:6,tol:.001,unit:``},{id:`p15-l01-q4`,type:`num`,q:`<p>How many coordinates does a free rigid body need in space?</p>
`,explain:`<p>Three for position, three for orientation.</p>
`,answer:6,tol:.001,unit:``},{id:`p15-l01-q5`,type:`mc`,q:`<p>Grubler’s formula gives 0 for the double parallelogram but it moves because…</p>
`,explain:`<p>The rank of the constraint Jacobian is one less than the count assumes.</p>
`,options:[`one constraint is redundant for that special geometry`,`the formula is only for spatial mechanisms`,`the ground counts twice`,`revolute joints have backlash`],answer:0},{id:`p15-l01-q6`,type:`mc`,q:`<p>The configuration space of a planar 2R arm with unlimited joints is…</p>
`,explain:`<p>Two angles, each wrapping round.</p>
`,options:[`a sphere`,`a torus`,`a plane`,`a line segment`],answer:1}],"p15-l02":[{id:`p15-l02-q1`,type:`num`,q:`<p>Outer radius of the lab arm’s workspace?</p>
`,explain:`<p>Fully stretched, q2 = 0.</p>
`,answer:1.8,tol:.001,unit:`m`},{id:`p15-l02-q2`,type:`num`,q:`<p>Free-joint workspace area of the lab arm?</p>
`,explain:`<p>An annulus from 0.2 m to 1.8 m.</p>
`,answer:10.053,tol:.002,unit:`m²`},{id:`p15-l02-q3`,type:`num`,q:`<p>Tool x position at q1 = 60°, q2 = −70°?</p>
`,explain:`<p>0.5 + 0.788.</p>
`,answer:1.288,tol:.002,unit:`m`},{id:`p15-l02-q4`,type:`num`,q:`<p>Distance from base to tool when q2 = 90°?</p>
`,explain:`<p>The links are at right angles.</p>
`,answer:1.2806,tol:.002,unit:`m`},{id:`p15-l02-q5`,type:`mc`,q:`<p>In T(θ, a) = rotate then translate, the tool position is…</p>
`,explain:`<p>The translation part sits in the last column.</p>
`,options:[`the last column of the chained matrix`,`the diagonal`,`the determinant`,`the first row`],answer:0},{id:`p15-l02-q6`,type:`mc`,q:`<p>The inner hole of the workspace exists because…</p>
`,explain:`<p>The tool can come no closer than |l1 − l2|.</p>
`,options:[`of gravity`,`the links have different lengths`,`the base is offset`,`of joint friction`],answer:1}],"p15-l03":[{id:`p15-l03-q1`,type:`num`,q:`<p>How many DH parameters describe each link?</p>
`,explain:`<p>θ, d, a and α.</p>
`,answer:4,tol:.001,unit:``},{id:`p15-l03-q2`,type:`num`,q:`<p>Height of the tool at q = (30°, 45°, −60°)?</p>
`,explain:`<p>The shoulder height plus the planar arm’s rise.</p>
`,answer:.65,tol:.002,unit:`m`},{id:`p15-l03-q3`,type:`num`,q:`<p>Tool x position when all joints are at zero?</p>
`,explain:`<p>Arm stretched along x.</p>
`,answer:.9,tol:.001,unit:`m`},{id:`p15-l03-q4`,type:`num`,q:`<p>Entry (3, 3) of a DH transform with α = 90°?</p>
`,explain:`<p>The entry is cos α.</p>
`,answer:0,tol:.001,unit:``},{id:`p15-l03-q5`,type:`mc`,q:`<p>In the DH convention, axis z_i lies along…</p>
`,explain:`<p>Each z axis is a joint axis.</p>
`,options:[`link i`,`the axis of joint i + 1`,`the common normal`,`gravity`],answer:1},{id:`p15-l03-q6`,type:`mc`,q:`<p>For a prismatic joint the variable is…</p>
`,explain:`<p>It slides along z.</p>
`,options:[`d`,`θ`,`a`,`α`],answer:0}],"p15-l04":[{id:`p15-l04-q1`,type:`num`,q:`<p>The x component of v for the elbow screw axis of the lesson 03 arm?</p>
`,explain:`<p>v = −ω × p.</p>
`,answer:.4,tol:.001,unit:`m`},{id:`p15-l04-q2`,type:`num`,q:`<p>The z component of v for the elbow screw axis?</p>
`,explain:`<p>The axis passes 0.5 m out along x.</p>
`,answer:-.5,tol:.001,unit:`m`},{id:`p15-l04-q3`,type:`num`,q:`<p>How many numbers describe one screw axis?</p>
`,explain:`<p>ω and v.</p>
`,answer:6,tol:.001,unit:``},{id:`p15-l04-q4`,type:`num`,q:`<p>Trace of e^([ω]θ) for θ = 90° (any unit axis)?</p>
`,explain:`<p>A rotation’s trace is 1 + 2 cos θ.</p>
`,answer:1,tol:.001,unit:``},{id:`p15-l04-q5`,type:`mc`,q:`<p>Compared with DH, the product of exponentials needs…</p>
`,explain:`<p>Axes and M are all you need.</p>
`,options:[`no frame at each link, only the axes and the home pose M`,`exactly 4 numbers per joint`,`a frame on every link`,`the Jacobian`],answer:0},{id:`p15-l04-q6`,type:`mc`,q:`<p>A prismatic joint’s screw has…</p>
`,explain:`<p>Pure translation.</p>
`,options:[`an infinite rotation`,`ω = 0`,`v = 0`,`ω parallel to v with pitch 1`],answer:1}],"p15-l05":[{id:`p15-l05-q1`,type:`num`,q:`<p>Minimum number of joints for an arm to reach a general position and orientation?</p>
`,explain:`<p>Three for position, three for orientation.</p>
`,answer:6,tol:.001,unit:``},{id:`p15-l05-q2`,type:`num`,q:`<p>Height of the wrist centre at q1..q3 = (30°, 45°, −60°)?</p>
`,explain:`<p>Lesson 03’s arm, unchanged.</p>
`,answer:.65,tol:.002,unit:`m`},{id:`p15-l05-q3`,type:`num`,q:`<p>Tool x position at home (all joints zero)?</p>
`,explain:`<p>Upper arm, forearm and flange in a line.</p>
`,answer:1,tol:.001,unit:`m`},{id:`p15-l05-q4`,type:`num`,q:`<p>Distance between the tool flange and the wrist centre in any pose?</p>
`,explain:`<p>The wrist only rotates about the centre.</p>
`,answer:.1,tol:.001,unit:`m`},{id:`p15-l05-q5`,type:`mc`,q:`<p>In a spherical wrist the three axes…</p>
`,explain:`<p>That is what makes the decomposition work.</p>
`,options:[`lie in one plane`,`are all parallel`,`are all vertical`,`intersect at one point`],answer:3},{id:`p15-l05-q6`,type:`mc`,q:`<p>A URDF joint’s origin element gives…</p>
`,explain:`<p>Then the joint rotates about its axis.</p>
`,options:[`the link’s mass`,`the joint limits`,`the fixed transform from the parent link to the joint frame`,`the joint’s current angle`],answer:2}],"p15-l06":[{id:`p15-l06-q1`,type:`num`,q:`<p>cos q2 for the lab arm reaching (1.2, 0.6)?</p>
`,explain:`<p>Law of cosines.</p>
`,answer:.1,tol:.001,unit:``},{id:`p15-l06-q2`,type:`num`,q:`<p>Elbow angle magnitude for that target?</p>
`,explain:`<p>Either sign.</p>
`,answer:84.26,tol:.001,unit:`°`},{id:`p15-l06-q3`,type:`num`,q:`<p>q1 of the branch the lab picks for (1.2, 0.6)?</p>
`,explain:`<p>The elbow-up branch, inside the limits.</p>
`,answer:62.96,tol:.002,unit:`°`},{id:`p15-l06-q4`,type:`num`,q:`<p>How many IK solutions for a target strictly inside the annulus?</p>
`,explain:`<p>Elbow up and elbow down.</p>
`,answer:2,tol:.001,unit:``},{id:`p15-l06-q5`,type:`mc`,q:`<p>Why use atan2 rather than atan?</p>
`,explain:`<p>atan alone loses half the circle.</p>
`,options:[`it is faster`,`it keeps the quadrant from the signs of both arguments`,`atan is undefined for negative numbers`,`it avoids the law of cosines`],answer:1},{id:`p15-l06-q6`,type:`mc`,q:`<p>For a 3-link arm with tool orientation φ, you first solve…</p>
`,explain:`<p>The planar wrist decomposition.</p>
`,options:[`the wrist point x − l3 cos φ, y − l3 sin φ with the 2-link formula`,`q3 from the law of cosines`,`the Jacobian`,`q1 = φ`],answer:0}],"p15-l07":[{id:`p15-l07-q1`,type:`num`,q:`<p>How many rows does the Jacobian of a 3-link planar arm have for a 2-D position target?</p>
`,explain:`<p>Two task coordinates, three joints.</p>
`,answer:2,tol:.001,unit:``},{id:`p15-l07-q2`,type:`num`,q:`<p>J₂₂ (∂y/∂q2) for the lab arm at q = (90°, 0°)?</p>
`,explain:`<p>Link 2 points straight up, so the elbow moves the tool sideways.</p>
`,answer:0,tol:.001,unit:``},{id:`p15-l07-q3`,type:`num`,q:`<p>In the worked example the error fell from 0.018 m to 1.5e-4 m in one step. By what factor?</p>
`,explain:`<p>Near the answer each step multiplies the number of correct digits, roughly doubling it.</p>
`,answer:120,tol:.001,unit:``},{id:`p15-l07-q4`,type:`num`,q:`<p>Determinant of J for the lab arm at q2 = 90°?</p>
`,explain:`<p>det J = l1 l2 sin q2.</p>
`,answer:.8,tol:.001,unit:``},{id:`p15-l07-q5`,type:`mc`,q:`<p>The pseudo-inverse step for a redundant arm is…</p>
`,explain:`<p>Minimum norm.</p>
`,options:[`the smallest joint change that achieves J dq = e`,`always zero in the null space of J transposed`,`the largest`,`undefined`],answer:0},{id:`p15-l07-q6`,type:`mc`,q:`<p>Why cap the Newton step?</p>
`,explain:`<p>J⁺ blows up near singular poses.</p>
`,options:[`the pseudo-inverse needs it`,`to save memory`,`near singularities a full step can be huge and overshoot`,`joint encoders are slow`],answer:2}],"p15-l08":[{id:`p15-l08-q1`,type:`num`,q:`<p>Maximum DLS gain per singular direction with λ = 0.08 m?</p>
`,explain:`<p>σ/(σ² + λ²) peaks at σ = λ.</p>
`,answer:6.25,tol:.001,unit:`rad/m`},{id:`p15-l08-q2`,type:`num`,q:`<p>Pseudo-inverse gain along a direction with σ = 0.01?</p>
`,explain:`<p>1/σ.</p>
`,answer:100,tol:.001,unit:`rad/m`},{id:`p15-l08-q3`,type:`num`,q:`<p>DLS gain along that direction with λ = 0.08?</p>
`,explain:`<p>σ/(σ² + λ²).</p>
`,answer:1.5385,tol:.002,unit:`rad/m`},{id:`p15-l08-q4`,type:`num`,q:`<p>Manipulability det J of the lab arm at q2 = 1°?</p>
`,explain:`<p>l1 l2 sin q2, nearly zero.</p>
`,answer:.013962,tol:.002,unit:`m²`},{id:`p15-l08-q5`,type:`mc`,q:`<p>Damped least squares minimises…</p>
`,explain:`<p>A regularised least-squares problem.</p>
`,options:[`tracking error squared plus λ² times joint speed squared`,`tracking error only`,`joint speed only`,`the condition number of J`],answer:0},{id:`p15-l08-q6`,type:`mc`,q:`<p>Far from singularities, DLS…</p>
`,explain:`<p>σ ≫ λ, so σ/(σ² + λ²) ≈ 1/σ.</p>
`,options:[`needs a larger λ`,`is always much slower`,`is almost identical to the pseudo-inverse`,`cannot move the tool`],answer:2}],"p15-l09":[{id:`p15-l09-q1`,type:`num`,q:`<p>Manipulability of the lab arm at q2 = 90°?</p>
`,explain:`<p>l1 l2 |sin q2|.</p>
`,answer:.8,tol:.001,unit:`m²`},{id:`p15-l09-q2`,type:`num`,q:`<p>Manipulability of the lab arm at q2 = 30°?</p>
`,explain:`<p>Half of the maximum.</p>
`,answer:.4,tol:.001,unit:`m²`},{id:`p15-l09-q3`,type:`num`,q:`<p>Tool speed from the base yaw alone at 1 rad/s when the tool is 0.74 m from the vertical axis?</p>
`,explain:`<p>|z × p| is the distance from the axis.</p>
`,answer:.74,tol:.001,unit:`m/s`},{id:`p15-l09-q4`,type:`num`,q:`<p>Rank of the linear Jacobian of the lesson 03 arm with the elbow straight (q3 = 0) in a general pose?</p>
`,explain:`<p>Radial motion along the arm is lost.</p>
`,answer:2,tol:.001,unit:``},{id:`p15-l09-q5`,type:`mc`,q:`<p>Column i of the geometric Jacobian for a revolute joint has a linear part…</p>
`,explain:`<p>The velocity of a point on a rotating body.</p>
`,options:[`z(i−1) × (p − p(i−1))`,`zero`,`z(i−1)`,`p − p(i−1)`],answer:0},{id:`p15-l09-q6`,type:`mc`,q:`<p>The semi-axes of the velocity ellipsoid have lengths…</p>
`,explain:`<p>The unit ball of joint speeds maps through J.</p>
`,options:[`the joint lengths`,`one over the singular values`,`the eigenvalues of q`,`the singular values of the linear Jacobian`],answer:3}],"p15-l10":[{id:`p15-l10-q1`,type:`num`,q:`<p>Shoulder torque to hold the lab arm stretched horizontally with no payload?</p>
`,explain:`<p>Both links’ weights times their distances from the shoulder.</p>
`,answer:21.09,tol:.002,unit:`N·m`},{id:`p15-l10-q2`,type:`num`,q:`<p>Extra shoulder torque per kilogram of payload at full horizontal reach?</p>
`,explain:`<p>Weight times 1.8 m.</p>
`,answer:17.658,tol:.002,unit:`N·m/kg`},{id:`p15-l10-q3`,type:`num`,q:`<p>Maximum payload the lab arm can hold stretched horizontally?</p>
`,explain:`<p>The shoulder limit is reached first.</p>
`,answer:1.354,tol:.005,unit:`kg`},{id:`p15-l10-q4`,type:`num`,q:`<p>Elbow torque to hold the forearm horizontal with no payload?</p>
`,explain:`<p>m2 g times half of l2.</p>
`,answer:3.924,tol:.002,unit:`N·m`},{id:`p15-l10-q5`,type:`mc`,q:`<p>tau = J transpose F follows from…</p>
`,explain:`<p>Work in, work out, for any small motion.</p>
`,options:[`equal virtual work at the joints and at the tool`,`conservation of momentum`,`Newton’s third law only`,`the inverse of J`],answer:0},{id:`p15-l10-q6`,type:`mc`,q:`<p>At a singular pose, the static relation tau = J transpose F…</p>
`,explain:`<p>Only the transpose is used.</p>
`,options:[`still holds; some force directions need no torque at all`,`fails, because J has no inverse`,`needs damped least squares`,`gives infinite torque`],answer:0}],"p15-l11":[{id:`p15-l11-q1`,type:`num`,q:`<p>Rank of the null-space projector for a 3-link planar arm with a 2-D position task (away from singularities)?</p>
`,explain:`<p>Joints minus task dimensions.</p>
`,answer:1,tol:.001,unit:``},{id:`p15-l11-q2`,type:`num`,q:`<p>Number of spare degrees of freedom for a 7-joint arm doing a full 6-D pose task?</p>
`,explain:`<p>Like the human arm’s elbow swivel.</p>
`,answer:1,tol:.001,unit:``},{id:`p15-l11-q3`,type:`num`,q:`<p>H contribution of a joint at its limit (|q − mid| = half the range)?</p>
`,explain:`<p>((range/2)/range)².</p>
`,answer:.25,tol:.001,unit:``},{id:`p15-l11-q4`,type:`num`,q:`<p>In the worked example, by how many degrees did the pseudo-inverse break the elbow limit?</p>
`,explain:`<p>q2 reached −148.7°.</p>
`,answer:13.7,tol:.01,unit:`°`},{id:`p15-l11-q5`,type:`mc`,q:`<p>J (I − J⁺J) equals…</p>
`,explain:`<p>Null-space motions don’t move the tool.</p>
`,options:[`zero`,`the identity`,`J⁺`,`J`],answer:0},{id:`p15-l11-q6`,type:`mc`,q:`<p>If the secondary goal conflicts with the tool task…</p>
`,explain:`<p>Strict priority.</p>
`,options:[`they average`,`the arm stops`,`the tool task wins, because the projector removes the conflicting part`,`the secondary goal wins`],answer:2}],"p15-l12":[{id:`p15-l12-q1`,type:`num`,q:`<p>Moment of inertia of the lab’s forearm about its centre (1.0 kg, 0.8 m uniform rod)?</p>
`,explain:`<p>m l² / 12.</p>
`,answer:.053333,tol:.002,unit:`kg·m²`},{id:`p15-l12-q2`,type:`num`,q:`<p>M22 for the lab arm (any pose)?</p>
`,explain:`<p>m2 lc2² + I2.</p>
`,answer:.21333,tol:.002,unit:`kg·m²`},{id:`p15-l12-q3`,type:`num`,q:`<p>Centripetal acceleration of a point 0.5 m from a joint spinning at 2 rad/s?</p>
`,explain:`<p>ω² r.</p>
`,answer:2,tol:.001,unit:`m/s²`},{id:`p15-l12-q4`,type:`num`,q:`<p>How many RNEA calls build M(q) for a 6-joint arm (one per column)?</p>
`,explain:`<p>Unit acceleration on each joint in turn.</p>
`,answer:6,tol:.001,unit:``},{id:`p15-l12-q5`,type:`mc`,q:`<p>In RNEA, gravity is included by…</p>
`,explain:`<p>Then every link feels its weight.</p>
`,options:[`ignoring it`,`a downward force on the tool only`,`adding a separate potential-energy term`,`giving the base an upward acceleration g`],answer:3},{id:`p15-l12-q6`,type:`mc`,q:`<p>The cost of RNEA grows with the number of links n as…</p>
`,explain:`<p>One pass out, one pass in.</p>
`,options:[`O(2ⁿ)`,`O(n)`,`O(n²)`,`O(n³)`],answer:1}],"p15-l13":[{id:`p15-l13-q1`,type:`num`,q:`<p>M11 of the lab arm with the elbow straight (q2 = 0)?</p>
`,explain:`<p>The forearm is as far from the shoulder as it can be.</p>
`,answer:2.5133,tol:.002,unit:`kg·m²`},{id:`p15-l13-q2`,type:`num`,q:`<p>M11 of the lab arm at q2 = 90°?</p>
`,explain:`<p>cos q2 = 0.</p>
`,answer:1.7133,tol:.002,unit:`kg·m²`},{id:`p15-l13-q3`,type:`num`,q:`<p>Coefficient of cos q1 in the shoulder gravity torque?</p>
`,explain:`<p>(m1 lc1 + m2 l1) g.</p>
`,answer:17.1675,tol:.002,unit:`N·m`},{id:`p15-l13-q4`,type:`num`,q:`<p>Potential energy change when the 1.0 kg forearm’s centre drops 0.5 m?</p>
`,explain:`<p>m g Δy.</p>
`,answer:-4.905,tol:.002,unit:`J`},{id:`p15-l13-q5`,type:`mc`,q:`<p>Constraint forces in the joints do not appear in the Lagrange equations because…</p>
`,explain:`<p>Generalised coordinates satisfy the constraints automatically.</p>
`,options:[`gravity cancels them`,`they act only at rest`,`they are small`,`they do no work on motions the joints allow`],answer:3},{id:`p15-l13-q6`,type:`mc`,q:`<p>Terms in C q-dot proportional to q-dot1 times q-dot2 are called…</p>
`,explain:`<p>Squared terms are centrifugal.</p>
`,options:[`centrifugal terms`,`friction terms`,`Coriolis terms`,`gravity terms`],answer:2}],"p15-l14":[{id:`p15-l14-q1`,type:`num`,q:`<p>Kp for a critically damped error with ωn = 10 rad/s?</p>
`,explain:`<p>Kp = ωn².</p>
`,answer:100,tol:.001,unit:`1/s²`},{id:`p15-l14-q2`,type:`num`,q:`<p>Kd for the same design?</p>
`,explain:`<p>Kd = 2ωn.</p>
`,answer:20,tol:.001,unit:`1/s`},{id:`p15-l14-q3`,type:`num`,q:`<p>Fraction of the initial error left after 0.5 s with ωn = 10 (zero initial error rate)?</p>
`,explain:`<p>(1 + ωn t) e^(−ωn t).</p>
`,answer:.040428,tol:.002,unit:``},{id:`p15-l14-q4`,type:`num`,q:`<p>Residual elbow error estimate for a 3.9 N·m unmodelled torque, 0.2 kg·m² inertia and ωn = 10?</p>
`,explain:`<p>Δτ / (M ωn²).</p>
`,answer:.195,tol:.002,unit:`rad`},{id:`p15-l14-q5`,type:`mc`,q:`<p>Computed torque makes the error dynamics linear because…</p>
`,explain:`<p>Feedback linearisation.</p>
`,options:[`the model’s M, c and g cancel the arm’s own nonlinear terms`,`the gains are very high`,`the arm is light`,`gravity is ignored`],answer:0},{id:`p15-l14-q6`,type:`mc`,q:`<p>PD with gravity compensation leaves a tracking error on a moving reference because…</p>
`,explain:`<p>It only cancels gravity.</p>
`,options:[`the torque limits are too low`,`PD is unstable`,`it has no M times desired-acceleration or Coriolis feedforward`,`its gravity model is wrong`],answer:2}],"p15-l15":[{id:`p15-l15-q1`,type:`num`,q:`<p>Deflection under a 10 N push with K = 300 N/m?</p>
`,explain:`<p>F/K.</p>
`,answer:33.33,tol:.002,unit:`mm`},{id:`p15-l15-q2`,type:`num`,q:`<p>Force needed to deflect the tool 5 mm vertically with K = 800 N/m?</p>
`,explain:`<p>K Δx.</p>
`,answer:4,tol:.001,unit:`N`},{id:`p15-l15-q3`,type:`num`,q:`<p>Effective stiffness along a (6, 8) N push for K = diag(300, 800)?</p>
`,explain:`<p>The squared magnitude of F over F·Δx.</p>
`,answer:500,tol:.001,unit:`N/m`},{id:`p15-l15-q4`,type:`num`,q:`<p>Critical damping for K = 300 N/m and an apparent mass of 2 kg?</p>
`,explain:`<p>2√(K m).</p>
`,answer:48.99,tol:.002,unit:`N·s/m`},{id:`p15-l15-q5`,type:`mc`,q:`<p>The impedance law maps the virtual spring force to joint torques using…</p>
`,explain:`<p>Statics, lesson 10.</p>
`,options:[`the mass matrix`,`the Jacobian transpose`,`the Jacobian inverse`,`inverse kinematics`],answer:1},{id:`p15-l15-q6`,type:`mc`,q:`<p>The simple law tau = J transpose F plus g shapes…</p>
`,explain:`<p>The arm’s own mass remains.</p>
`,options:[`nothing, unless a force sensor is used`,`only gravity`,`inertia only`,`stiffness and damping, but not the apparent inertia`],answer:3}],"p15-l16":[{id:`p15-l16-q1`,type:`num`,q:`<p>Forward speed with r = 0.05 m and both wheels at 10 rad/s?</p>
`,explain:`<p>r times the wheel speed.</p>
`,answer:.5,tol:.001,unit:`m/s`},{id:`p15-l16-q2`,type:`num`,q:`<p>Turn rate with wheels at 8 and 12 rad/s, r = 0.05 m, b = 0.3 m?</p>
`,explain:`<p>r(ωR − ωL)/b.</p>
`,answer:.6667,tol:.002,unit:`rad/s`},{id:`p15-l16-q3`,type:`num`,q:`<p>Turning radius for those wheel speeds?</p>
`,explain:`<p>v/ω.</p>
`,answer:.75,tol:.001,unit:`m`},{id:`p15-l16-q4`,type:`num`,q:`<p>Distance per encoder count with r = 0.05 m and 2048 counts per turn?</p>
`,explain:`<p>Circumference over counts.</p>
`,answer:.1534,tol:.002,unit:`mm`},{id:`p15-l16-q5`,type:`mc`,q:`<p>The nonholonomic constraint of a differential-drive robot says…</p>
`,explain:`<p>No sideways sliding.</p>
`,options:[`its velocity perpendicular to its heading is zero`,`it can’t turn on the spot`,`its wheels must turn at the same speed`,`it can’t reach every position`],answer:0},{id:`p15-l16-q6`,type:`mc`,q:`<p>Odometry error grows without bound because…</p>
`,explain:`<p>Dead reckoning has no absolute reference.</p>
`,options:[`encoders lose counts every second`,`the unicycle model is wrong`,`it integrates small errors in r, b and wheel slip`,`of the ICR`],answer:2}],"p15-l17":[{id:`p15-l17-q1`,type:`num`,q:`<p>Body speed with 0.20 m steps and a 2 s cycle?</p>
`,explain:`<p>One step per cycle.</p>
`,answer:.1,tol:.001,unit:`m/s`},{id:`p15-l17-q2`,type:`num`,q:`<p>Minimum number of feet on the ground for static stability with area?</p>
`,explain:`<p>Three points make a triangle.</p>
`,answer:3,tol:.001,unit:``},{id:`p15-l17-q3`,type:`num`,q:`<p>Fraction of the cycle with four feet down in a crawl with duty factor 0.85?</p>
`,explain:`<p>Each of the four swings takes 0.15 of the cycle.</p>
`,answer:.4,tol:.001,unit:``},{id:`p15-l17-q4`,type:`num`,q:`<p>Inradius of a 3-4-5 right triangle of feet (m)?</p>
`,explain:`<p>Area over half the perimeter.</p>
`,answer:1,tol:.001,unit:`m`},{id:`p15-l17-q5`,type:`mc`,q:`<p>A crawl gait with duty factor exactly 0.75 has…</p>
`,explain:`<p>The CoM must sit on the shared diagonal.</p>
`,options:[`two feet down at times`,`four feet down half the time`,`the largest possible margin`,`zero stability margin at each leg change`],answer:3},{id:`p15-l17-q6`,type:`mc`,q:`<p>The body sways right while a left leg swings because…</p>
`,explain:`<p>It keeps the CoM inside the polygon.</p>
`,options:[`the remaining support triangle lies on the right`,`the left legs are heavier`,`it looks natural`,`the motors need it`],answer:0}],"p15-l18":[{id:`p15-l18-q1`,type:`num`,q:`<p>Size of q for a quadruped with 3 joints per leg and a floating base?</p>
`,explain:`<p>6 base coordinates plus 12 joints.</p>
`,answer:18,tol:.001,unit:``},{id:`p15-l18-q2`,type:`num`,q:`<p>Vertical force per foot for a 50 kg robot standing symmetrically on four feet?</p>
`,explain:`<p>mg/4.</p>
`,answer:122.625,tol:.002,unit:`N`},{id:`p15-l18-q3`,type:`num`,q:`<p>Steepest slope a robot can stand on with friction coefficient 0.6?</p>
`,explain:`<p>tan α ≤ μ.</p>
`,answer:30.96,tol:.002,unit:`°`},{id:`p15-l18-q4`,type:`num`,q:`<p>Slope at which the illustrative quadruped would tip over backwards (feet 0.35 m fore-aft of the CoM, CoM 0.5 m up)?</p>
`,explain:`<p>The weight’s line of action passes the hind feet.</p>
`,answer:34.99,tol:.002,unit:`°`},{id:`p15-l18-q5`,type:`mc`,q:`<p>The first 6 rows of the floating-base equations contain…</p>
`,explain:`<p>The base is unactuated.</p>
`,options:[`nothing useful`,`only the joint torques`,`no joint torques, only gravity, inertia and contact forces`,`the friction coefficient`],answer:2},{id:`p15-l18-q6`,type:`mc`,q:`<p>A standing quadruped on four feet is statically indeterminate because…</p>
`,explain:`<p>The robot can choose among many force distributions.</p>
`,options:[`the CoM is unknown`,`there are 12 unknown force components but only 6 balance equations`,`friction is nonlinear`,`the legs are flexible`],answer:1}]};export{e as default};