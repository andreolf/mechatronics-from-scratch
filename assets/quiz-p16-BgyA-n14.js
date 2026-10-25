var e={"p16-l01":[{id:`p16-l01-q1`,type:`num`,q:`<p>C-obstacle side length for a 0.5 m square obstacle and a 0.3 m square robot that only translates?</p>
`,explain:`<p>The obstacle grows by half the robot’s width on each side.</p>
`,answer:.8,tol:.001,unit:`m`},{id:`p16-l01-q2`,type:`num`,q:`<p>The most edges the Minkowski sum of a convex 4-gon and a convex 3-gon can have?</p>
`,explain:`<p>Each edge of either polygon appears at most once, ordered by angle.</p>
`,answer:7,tol:.001,unit:``},{id:`p16-l01-q3`,type:`num`,q:`<p>Largest movement of any point of the arm (L1 = 1.0, L2 = 0.8 m) when both joints step by 2°?</p>
`,explain:`<p>(L1 + L2)|Δq1| + L2|Δq2|.</p>
`,answer:9.08,tol:.005,unit:`cm`},{id:`p16-l01-q4`,type:`num`,q:`<p>Cells in a C-space grid for a 2-link arm at 2° resolution?</p>
`,explain:`<p>180 values per joint, squared.</p>
`,answer:32400,tol:.001,unit:``},{id:`p16-l01-q5`,type:`mc`,q:`<p>The C-space of a planar 2-link arm with unlimited revolute joints is…</p>
`,explain:`<p>Both angles wrap round.</p>
`,options:[`a disc`,`a sphere`,`a plane`,`a torus`],answer:3},{id:`p16-l01-q6`,type:`mc`,q:`<p>Why add a safety margin when gridding C-space?</p>
`,explain:`<p>The margin covers the motion between neighbouring checked configurations.</p>
`,options:[`to remove the wrap-around`,`because the Minkowski sum is approximate`,`the arm moves between cell centres, and the grid only checks the centres`,`to make the search faster`],answer:2}],"p16-l02":[{id:`p16-l02-q1`,type:`num`,q:`<p>Peak velocity of a rest-to-rest cubic moving 0.6 rad in 1.5 s?</p>
`,explain:`<p>1.5 D/T.</p>
`,answer:.6,tol:.001,unit:`rad/s`},{id:`p16-l02-q2`,type:`num`,q:`<p>Peak velocity of a rest-to-rest quintic moving 0.6 rad in 1.5 s?</p>
`,explain:`<p>1.875 D/T.</p>
`,answer:.75,tol:.001,unit:`rad/s`},{id:`p16-l02-q3`,type:`num`,q:`<p>Starting acceleration of a rest-to-rest cubic with D = 1 rad and T = 0.5 s?</p>
`,explain:`<p>6D/T², applied instantly at t = 0.</p>
`,answer:24,tol:.001,unit:`rad/s²`},{id:`p16-l02-q4`,type:`num`,q:`<p>Normalised quintic position 10τ³ − 15τ⁴ + 6τ⁵ at τ = 0.25?</p>
`,explain:`<p>A quarter of the way through the time, about a tenth of the way.</p>
`,answer:.1035,tol:.002,unit:``},{id:`p16-l02-q5`,type:`mc`,q:`<p>How many boundary conditions does a quintic satisfy?</p>
`,explain:`<p>Position, velocity and acceleration at both ends.</p>
`,options:[`six`,`four`,`three`,`five`],answer:0},{id:`p16-l02-q6`,type:`mc`,q:`<p>The main drawback of a cubic for a rest-to-rest move is that…</p>
`,explain:`<p>A step in acceleration is a step in torque, which excites vibration.</p>
`,options:[`its acceleration jumps at the start and end`,`its velocity is not zero at the ends`,`it overshoots the goal`,`it can’t reach the goal exactly`],answer:0}],"p16-l03":[{id:`p16-l03-q1`,type:`num`,q:`<p>Total time to move 3 m with vmax = 1 m/s and amax = 2 m/s²?</p>
`,explain:`<p>D/v + v/a, since v²/a = 0.5 m is less than 3 m.</p>
`,answer:3.5,tol:.001,unit:`s`},{id:`p16-l03-q2`,type:`num`,q:`<p>Shortest move that still reaches vmax = 1 m/s with amax = 2 m/s²?</p>
`,explain:`<p>v²/a, half for accelerating and half for braking.</p>
`,answer:.5,tol:.001,unit:`m`},{id:`p16-l03-q3`,type:`num`,q:`<p>Peak velocity of a 0.2 m move with vmax = 1 m/s and amax = 2 m/s²?</p>
`,explain:`<p>Triangle: √(a D).</p>
`,answer:.6325,tol:.002,unit:`m/s`},{id:`p16-l03-q4`,type:`num`,q:`<p>Total time of that 0.2 m move?</p>
`,explain:`<p>2√(D/a).</p>
`,answer:.6325,tol:.002,unit:`s`},{id:`p16-l03-q5`,type:`mc`,q:`<p>The trapezoidal profile is time-optimal because…</p>
`,explain:`<p>Bang-coast-bang uses the full acceleration or the full speed at every instant.</p>
`,options:[`at every instant it accelerates, brakes or cruises at a limit`,`it uses the least energy`,`its acceleration is continuous`,`it has the lowest jerk`],answer:0},{id:`p16-l03-q6`,type:`mc`,q:`<p>Its main weakness is that…</p>
`,explain:`<p>Steps in acceleration excite vibration; S-curves (lesson 04) limit jerk.</p>
`,options:[`it can overshoot the target`,`it can’t do short moves`,`acceleration jumps instantly, which means infinite jerk`,`it can exceed the speed limit`],answer:2}],"p16-l04":[{id:`p16-l04-q1`,type:`num`,q:`<p>Jerk time to reach 3 m/s² at a jerk limit of 30 m/s³?</p>
`,explain:`<p>amax/jmax.</p>
`,answer:.1,tol:.001,unit:`s`},{id:`p16-l04-q2`,type:`num`,q:`<p>Constant-acceleration time to reach 1.2 m/s with amax = 3 m/s² and a 0.1 s jerk time?</p>
`,explain:`<p>vmax/amax − Tj.</p>
`,answer:.3,tol:.001,unit:`s`},{id:`p16-l04-q3`,type:`num`,q:`<p>Distance covered while accelerating to 1.2 m/s with those times?</p>
`,explain:`<p>Symmetric phase: v(2Tj + Ta)/2.</p>
`,answer:.3,tol:.001,unit:`m`},{id:`p16-l04-q4`,type:`num`,q:`<p>Jerk time that cancels the residual vibration of a 5 Hz load?</p>
`,explain:`<p>One vibration period.</p>
`,answer:.2,tol:.001,unit:`s`},{id:`p16-l04-q5`,type:`mc`,q:`<p>How many segments does a full S-curve move have?</p>
`,explain:`<p>Three to accelerate, one to cruise, three to brake.</p>
`,options:[`three`,`nine`,`seven`,`five`],answer:2},{id:`p16-l04-q6`,type:`mc`,q:`<p>An S-curve with T_j equal to the load’s period works because…</p>
`,explain:`<p>A ramp is a step smoothed by a box, and the box’s spectrum is zero at multiples of 1/T_j.</p>
`,options:[`the load’s damping increases`,`the ramp’s spectrum has a zero at the load’s natural frequency`,`the jerk is zero during the ramp`,`it is slower`],answer:1}],"p16-l05":[{id:`p16-l05-q1`,type:`num`,q:`<p>Unknown coefficients in a cubic spline through 5 knots?</p>
`,explain:`<p>Four per interval, four intervals.</p>
`,answer:16,tol:.001,unit:``},{id:`p16-l05-q2`,type:`num`,q:`<p>Equations from continuity at the interior knots of a 5-knot spline (value on both sides, slope, curvature)?</p>
`,explain:`<p>8 interpolation conditions plus slope and curvature at 3 interior knots; the 2 end conditions make 16.</p>
`,answer:14,tol:.001,unit:``},{id:`p16-l05-q3`,type:`num`,q:`<p>Natural spline through (0, 0), (1, 2), (2, 0) with h = 1. What is M₁?</p>
`,explain:`<p>4M₁ = 6((0 − 2) − (2 − 0)).</p>
`,answer:-6,tol:.001,unit:``},{id:`p16-l05-q4`,type:`num`,q:`<p>Its slope at x = 0?</p>
`,explain:`<p>(y₁ − y₀)/h − h(2M₀ + M₁)/6.</p>
`,answer:3,tol:.001,unit:``},{id:`p16-l05-q5`,type:`mc`,q:`<p>A natural cubic spline sets…</p>
`,explain:`<p>M₀ = Mₙ = 0.</p>
`,options:[`the third derivative continuous`,`the end values free`,`the slope to zero at both ends`,`the second derivative to zero at both ends`],answer:3},{id:`p16-l05-q6`,type:`mc`,q:`<p>The spline system can be solved in O(n) because…</p>
`,explain:`<p>Each equation involves only a knot and its two neighbours.</p>
`,options:[`the knots are equally spaced`,`it is tridiagonal and diagonally dominant`,`it is triangular`,`it is orthogonal`],answer:1}],"p16-l06":[{id:`p16-l06-q1`,type:`num`,q:`<p>BFS steps on an empty 4-connected grid from (0, 0) to (6, 2)?</p>
`,explain:`<p>The Manhattan distance.</p>
`,answer:8,tol:.001,unit:``},{id:`p16-l06-q2`,type:`num`,q:`<p>8-connected Dijkstra cost on an empty grid from (0, 0) to (6, 2)?</p>
`,explain:`<p>Two diagonals and four straight steps.</p>
`,answer:6.828,tol:.002,unit:``},{id:`p16-l06-q3`,type:`num`,q:`<p>Largest ratio of 8-connected path length to straight-line distance, at 22.5° (cos 22.5° + (√2 − 1) sin 22.5°)?</p>
`,explain:`<p>The worst angle for an 8-direction grid, about 8 % too long.</p>
`,answer:1.0824,tol:.002,unit:``},{id:`p16-l06-q4`,type:`num`,q:`<p>Edges in a fully free 4-connected 10 × 10 grid, counting each once?</p>
`,explain:`<p>9 horizontal edges in each of 10 rows, and the same vertically.</p>
`,answer:180,tol:.001,unit:``},{id:`p16-l06-q5`,type:`mc`,q:`<p>BFS finds optimal paths only when…</p>
`,explain:`<p>It counts steps, not costs.</p>
`,options:[`the grid is 8-connected`,`the goal is reachable in under 100 steps`,`every step has the same cost`,`there are no obstacles`],answer:2},{id:`p16-l06-q6`,type:`mc`,q:`<p>Dijkstra can mark a dequeued cell final because…</p>
`,explain:`<p>No detour through a more expensive cell can make it cheaper.</p>
`,options:[`every other queued cell costs at least as much and step costs are non-negative`,`it has the fewest steps`,`it was added first`,`it is the closest to the goal`],answer:0}],"p16-l07":[{id:`p16-l07-q1`,type:`num`,q:`<p>Octile distance from (0, 0) to (7, 3)?</p>
`,explain:`<p>max + (√2 − 1) min.</p>
`,answer:8.243,tol:.002,unit:``},{id:`p16-l07-q2`,type:`num`,q:`<p>Manhattan distance from (0, 0) to (7, 3), the 4-connected heuristic?</p>
`,explain:`<p>Δx + Δy.</p>
`,answer:10,tol:.001,unit:``},{id:`p16-l07-q3`,type:`num`,q:`<p>Worst-case cost bound for weighted A* with w = 1.5 when the optimum is 40?</p>
`,explain:`<p>At most w times optimal.</p>
`,answer:60,tol:.001,unit:``},{id:`p16-l07-q4`,type:`num`,q:`<p>Fraction of Dijkstra’s expansions A* needed on the building map?</p>
`,explain:`<p>309 of 975 cells.</p>
`,answer:.317,tol:.005,unit:``},{id:`p16-l07-q5`,type:`mc`,q:`<p>A heuristic is admissible when…</p>
`,explain:`<p>Then A* returns an optimal path.</p>
`,options:[`it never overestimates the true remaining cost`,`it is zero at the start`,`it equals the Euclidean distance`,`it never underestimates it`],answer:0},{id:`p16-l07-q6`,type:`mc`,q:`<p>A* with h = 0 is…</p>
`,explain:`<p>It orders cells by g alone.</p>
`,options:[`Dijkstra’s algorithm`,`greedy best-first search`,`depth-first search`,`breadth-first search on any grid`],answer:0}],"p16-l08":[{id:`p16-l08-q1`,type:`num`,q:`<p>Attractive force magnitude 3 m from the goal with k_att = 1.5?</p>
`,explain:`<p>k_att times the distance.</p>
`,answer:4.5,tol:.001,unit:``},{id:`p16-l08-q2`,type:`num`,q:`<p>Repulsive force magnitude at ρ = 0.5 m with k_rep = 2 and ρ0 = 1 m?</p>
`,explain:`<p>k_rep(1/ρ − 1/ρ0)/ρ².</p>
`,answer:8,tol:.001,unit:``},{id:`p16-l08-q3`,type:`num`,q:`<p>Repulsive force at ρ = 1.2 m with ρ0 = 1 m?</p>
`,explain:`<p>Outside the range, no repulsion.</p>
`,answer:0,tol:.001,unit:``},{id:`p16-l08-q4`,type:`num`,q:`<p>Repulsive potential at ρ = 0.25 m with k_rep = 2 and ρ0 = 1 m?</p>
`,explain:`<p>½ k_rep (1/ρ − 1/ρ0)².</p>
`,answer:9,tol:.001,unit:``},{id:`p16-l08-q5`,type:`mc`,q:`<p>A potential-field planner is incomplete because…</p>
`,explain:`<p>Forces can cancel away from the goal.</p>
`,options:[`its repulsion is unbounded`,`it can’t handle moving goals`,`it needs a grid`,`it can stop at a local minimum when a path exists`],answer:3},{id:`p16-l08-q6`,type:`mc`,q:`<p>A sensible response to a detected local minimum is…</p>
`,explain:`<p>Reactive fields work best combined with a global plan.</p>
`,options:[`set the repulsive gain to zero`,`increase the step size until it escapes`,`fall back to a global planner such as A*`,`stop and report success`],answer:2}],"p16-l09":[{id:`p16-l09-q1`,type:`num`,q:`<p>Probability that 500 uniform samples all miss a region of 1 % of C-space?</p>
`,explain:`<p>(1 − p)ⁿ.</p>
`,answer:.00657,tol:.005,unit:``},{id:`p16-l09-q2`,type:`num`,q:`<p>Collision checks along an edge spanning 30° of joint motion at 2° resolution, counting both ends?</p>
`,explain:`<p>15 steps, 16 configurations.</p>
`,answer:16,tol:.001,unit:``},{id:`p16-l09-q3`,type:`num`,q:`<p>Grid cells needed for a 6-joint arm at 10 values per joint?</p>
`,explain:`<p>The curse of dimensionality.</p>
`,answer:1e6,tol:.001,unit:``},{id:`p16-l09-q4`,type:`num`,q:`<p>Shortest angle difference between 175° and −175°?</p>
`,explain:`<p>The torus wraps round.</p>
`,answer:10,tol:.001,unit:`°`},{id:`p16-l09-q5`,type:`mc`,q:`<p>PRM is called multi-query because…</p>
`,explain:`<p>The roadmap depends on the obstacles, not on the query.</p>
`,options:[`it samples many times`,`one roadmap answers many start and goal pairs`,`it runs several searches in parallel`,`it needs many queries to the collision checker`],answer:1},{id:`p16-l09-q6`,type:`mc`,q:`<p>If a PRM finds no path, you know that…</p>
`,explain:`<p>Probabilistic completeness only bounds the chance of missing a path.</p>
`,options:[`k was too small`,`there is no path`,`the goal is in collision`,`none was found with these samples, which does not prove there is none`],answer:3}],"p16-l10":[{id:`p16-l10-q1`,type:`num`,q:`<p>Expected number of goal samples in 1000 iterations with a 5 % goal bias?</p>
`,explain:`<p>5 % of the samples.</p>
`,answer:50,tol:.001,unit:``},{id:`p16-l10-q2`,type:`num`,q:`<p>Nodes needed in a straight line of 0.5 m steps to cover 12 m?</p>
`,explain:`<p>Each extension moves at most η.</p>
`,answer:24,tol:.001,unit:``},{id:`p16-l10-q3`,type:`num`,q:`<p>Length of a path from (0, 0) to (3, 4) via no obstacles?</p>
`,explain:`<p>The straight line, which the visibility graph finds when it’s free.</p>
`,answer:5,tol:.001,unit:`m`},{id:`p16-l10-q4`,type:`num`,q:`<p>Ratio of the RRT* radius at n = 4000 to that at n = 1000 in 2D, (log n/n)^½?</p>
`,explain:`<p>The neighbourhood shrinks slightly slower than 1/√n.</p>
`,answer:.5479,tol:.005,unit:``},{id:`p16-l10-q5`,type:`mc`,q:`<p>The Voronoi bias of RRT means…</p>
`,explain:`<p>The nearest node to a uniform sample is likely to border unexplored space.</p>
`,options:[`frontier nodes, with large Voronoi cells, are extended most often`,`the tree grows towards the goal only`,`nodes are connected to all neighbours`,`samples are taken on a grid`],answer:0},{id:`p16-l10-q6`,type:`mc`,q:`<p>What makes RRT* asymptotically optimal, unlike RRT?</p>
`,explain:`<p>The tree keeps being repaired as samples arrive.</p>
`,options:[`a smaller step size`,`choosing the cheapest parent and rewiring neighbours`,`a larger goal bias`,`growing two trees`],answer:1}],"p16-l11":[{id:`p16-l11-q1`,type:`num`,q:`<p>Most axes SAT tests for a convex pentagon against a convex hexagon?</p>
`,explain:`<p>One per edge normal.</p>
`,answer:11,tol:.001,unit:``},{id:`p16-l11-q2`,type:`num`,q:`<p>Distinct axes for two rectangles in 2D, at any angles?</p>
`,explain:`<p>Each rectangle has only two edge directions.</p>
`,answer:4,tol:.001,unit:``},{id:`p16-l11-q3`,type:`num`,q:`<p>Projection interval length of a unit square onto the unit axis at 45°?</p>
`,explain:`<p>The diagonal.</p>
`,answer:1.4142,tol:.002,unit:``},{id:`p16-l11-q4`,type:`num`,q:`<p>Axes for two oriented boxes in 3D?</p>
`,explain:`<p>Face normals plus edge-pair cross products.</p>
`,answer:15,tol:.001,unit:``},{id:`p16-l11-q5`,type:`mc`,q:`<p>SAT applies directly to…</p>
`,explain:`<p>Concave shapes are split into convex pieces first.</p>
`,options:[`only rectangles`,`only circles`,`pairs of convex shapes`,`any polygons`],answer:2},{id:`p16-l11-q6`,type:`mc`,q:`<p>A broad phase must never…</p>
`,explain:`<p>False alarms cost time; misses cost crashes.</p>
`,options:[`be faster than the narrow phase`,`report a collision that the exact test rejects`,`report two shapes as clear when they collide`,`use bounding boxes`],answer:2}],"p16-l12":[{id:`p16-l12-q1`,type:`num`,q:`<p>Obstacle cost at d = 0.3 m with ε = 0.6 m?</p>
`,explain:`<p>(ε − d)²/(2ε).</p>
`,answer:.075,tol:.001,unit:``},{id:`p16-l12-q2`,type:`num`,q:`<p>Obstacle cost at d = −0.2 m (inside) with ε = 0.6 m?</p>
`,explain:`<p>−d + ε/2.</p>
`,answer:.5,tol:.001,unit:``},{id:`p16-l12-q3`,type:`num`,q:`<p>Smoothness cost ½ Σ|Δx|² of a 3 m straight path split into 3 equal steps?</p>
`,explain:`<p>Three steps of 1 m, each contributing ½.</p>
`,answer:1.5,tol:.001,unit:``},{id:`p16-l12-q4`,type:`num`,q:`<p>Rows of K for 50 free waypoints between two fixed ends?</p>
`,explain:`<p>One first difference per gap between consecutive points.</p>
`,answer:51,tol:.001,unit:``},{id:`p16-l12-q5`,type:`mc`,q:`<p>CHOMP’s update multiplies the gradient by A⁻¹ in order to…</p>
`,explain:`<p>It is gradient descent in a smoothness-weighted norm.</p>
`,options:[`normalise it to unit length`,`spread each correction smoothly along the whole path`,`make the cost convex`,`remove the obstacle term`],answer:1},{id:`p16-l12-q6`,type:`mc`,q:`<p>Trajectory optimisation is usually seeded with a sampling planner’s path because…</p>
`,explain:`<p>It can’t jump across an obstacle to a better route.</p>
`,options:[`sampling paths are already smooth`,`it finds only a local optimum near its starting path`,`it needs a collision-free start to compute gradients`,`it can’t handle straight lines`],answer:1}],"p16-l13":[{id:`p16-l13-q1`,type:`num`,q:`<p>Path speed limit ṡ where |q’| = 2 m and the joint speed limit is 1 m/s?</p>
`,explain:`<p>|q’| ṡ ≤ v.</p>
`,answer:.5,tol:.001,unit:`1/s`},{id:`p16-l13-q2`,type:`num`,q:`<p>Fastest speed round a curve of radius 0.5 m with a 2 m/s² acceleration limit?</p>
`,explain:`<p>v²/R ≤ a.</p>
`,answer:1,tol:.001,unit:`m/s`},{id:`p16-l13-q3`,type:`num`,q:`<p>Duration of a stage of Δs = 0.01 with ṡ² = 0.25 at both ends?</p>
`,explain:`<p>2Δs/(√x_k + √x_k+1).</p>
`,answer:.02,tol:.001,unit:`s`},{id:`p16-l13-q4`,type:`num`,q:`<p>Path acceleration that takes x = ṡ² from 0.2 to 0.3 over Δs = 0.05?</p>
`,explain:`<p>dx/ds = 2u.</p>
`,answer:1,tol:.001,unit:`1/s²`},{id:`p16-l13-q5`,type:`mc`,q:`<p>TOPP works in x = ṡ² because…</p>
`,explain:`<p>Linear constraints make each stage a tiny linear program.</p>
`,options:[`it removes the velocity limits`,`x is always positive`,`the limits become linear in x and u, and dx/ds = 2u`,`time is then linear in s`],answer:2},{id:`p16-l13-q6`,type:`mc`,q:`<p>The time-optimal profile has the property that…</p>
`,explain:`<p>It is bang-bang along the limits.</p>
`,options:[`all joints reach their limits together`,`the path speed is constant`,`at every point some limit is active`,`the jerk is minimal`],answer:2}],"p16-l14":[{id:`p16-l14-q1`,type:`num`,q:`<p>Curvature to a goal point with lateral offset y = 0.1 m and L = 0.5 m?</p>
`,explain:`<p>2y/L².</p>
`,answer:.8,tol:.001,unit:`1/m`},{id:`p16-l14-q2`,type:`num`,q:`<p>Turn rate at 0.5 m/s for that curvature?</p>
`,explain:`<p>ω = vκ.</p>
`,answer:.4,tol:.001,unit:`rad/s`},{id:`p16-l14-q3`,type:`num`,q:`<p>Turning radius for κ = 0.8 1/m?</p>
`,explain:`<p>R = 1/κ.</p>
`,answer:1.25,tol:.001,unit:`m`},{id:`p16-l14-q4`,type:`num`,q:`<p>Curvature when the goal point is straight ahead (y = 0)?</p>
`,explain:`<p>Drive straight.</p>
`,answer:0,tol:.001,unit:`1/m`},{id:`p16-l14-q5`,type:`mc`,q:`<p>A longer lookahead distance…</p>
`,explain:`<p>It trades accuracy on curves for stability.</p>
`,options:[`makes the robot weave`,`has no effect on a circle smaller than L`,`cuts corners more but steers more calmly`,`always reduces the cross-track error`],answer:2},{id:`p16-l14-q6`,type:`mc`,q:`<p>Pure pursuit tracks a circle exactly because…</p>
`,explain:`<p>A chord and a tangent define the circle uniquely.</p>
`,options:[`the cross-track error is fed back`,`the lookahead is zero`,`the arc through the robot and a goal point on the circle, tangent to the circle, is the circle`,`the robot slows down on curves`],answer:2}]};export{e as default};