# Phase 17 · Computer Vision, Estimation & SLAM

> Cameras, features, localisation and mapping, built from pixels and probabilities.

- **Lessons:** 20
- **Maps to:** Vision and mobile robot estimation (generic) (generic topic, not an exact ETH title)
- **Main tool:** OpenCV · **Default language:** Python

Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.

## p17-l01 · Images as arrays

**Goal:** Treat an image as numbers.

- **Derive by hand:** Pixels, channels, colour spaces.
- **Code from scratch (Python):** Load and manipulate images with NumPy only.
- **Interactive lab / visual:** Pixel inspector.
- **Test that proves it works:** Conversions match OpenCV.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l02 · The pinhole camera model

**Goal:** Map 3D points to pixels.

- **Derive by hand:** u = f x/z + cx; intrinsic matrix K.
- **Code from scratch (Python):** Project 3D points to an image.
- **Interactive lab / visual:** 3D scene with camera frustum.
- **Test that proves it works:** Matches cv2.projectPoints.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l03 · Camera calibration

**Goal:** Estimate K from checkerboard images.

- **Derive by hand:** Zhang's homography method.
- **Code from scratch (Python):** Implement calibration from synthetic data.
- **Interactive lab / visual:** Checkerboard views.
- **Test that proves it works:** Recovers intrinsics within 1 percent.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l04 · Lens distortion

**Goal:** Undistort images.

- **Derive by hand:** Radial and tangential models.
- **Code from scratch (Python):** Implement undistortion.
- **Interactive lab / visual:** Warped grid straightening.
- **Test that proves it works:** Matches OpenCV undistortion.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l05 · Convolution and edges

**Goal:** Find edges.

- **Derive by hand:** Sobel kernels; gradient magnitude.
- **Code from scratch (Python):** Implement Sobel and Canny-style non-max suppression.
- **Interactive lab / visual:** Edge map.
- **Test that proves it works:** Matches OpenCV within tolerance.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l06 · Thresholding and blobs

**Goal:** Find coloured objects.

- **Derive by hand:** Otsu's method; connected components.
- **Code from scratch (Python):** Implement Otsu and blob labelling.
- **Interactive lab / visual:** Blobs labelled with centroids.
- **Test that proves it works:** Counts match ground truth.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l07 · Harris corners

**Goal:** Find trackable points.

- **Derive by hand:** Structure tensor eigenvalues.
- **Code from scratch (Python):** Implement Harris detection.
- **Interactive lab / visual:** Corners highlighted.
- **Test that proves it works:** Repeatable under rotation.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l08 · Descriptors and matching

**Goal:** Match features between images.

- **Derive by hand:** Binary descriptors and Hamming distance; ratio test.
- **Code from scratch (Python):** Implement BRIEF-like descriptors and matching.
- **Interactive lab / visual:** Matches drawn between frames.
- **Test that proves it works:** Inlier ratio above target.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l09 · Homographies and DLT

**Goal:** Map planes between views.

- **Derive by hand:** Direct linear transform with SVD.
- **Code from scratch (Python):** Implement DLT homography.
- **Interactive lab / visual:** Image warped onto a plane.
- **Test that proves it works:** Reprojection error below 1 px.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l10 · RANSAC

**Goal:** Fit models with outliers.

- **Derive by hand:** Iteration count from inlier ratio.
- **Code from scratch (Python):** Implement RANSAC for homographies.
- **Interactive lab / visual:** Inliers versus outliers coloured.
- **Test that proves it works:** Robust to 50 percent outliers.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l11 · Fiducial markers and PnP

**Goal:** Get pose from a marker.

- **Derive by hand:** Perspective-n-point; iterative refinement.
- **Code from scratch (Python):** Estimate pose from four corners.
- **Interactive lab / visual:** Axes drawn on a marker.
- **Test that proves it works:** Pose error below 1 degree in simulation.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l12 · Stereo depth

**Goal:** Get depth from two cameras.

- **Derive by hand:** Disparity z = f B/d.
- **Code from scratch (Python):** Implement block matching.
- **Interactive lab / visual:** Disparity map.
- **Test that proves it works:** Depth error within expectation.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l13 · Optical flow

**Goal:** Track motion between frames.

- **Derive by hand:** Lucas-Kanade least squares.
- **Code from scratch (Python):** Implement LK optical flow.
- **Interactive lab / visual:** Flow vectors.
- **Test that proves it works:** Tracks synthetic motion within 0.2 px.
- **Pro / open-source tool it maps to:** OpenCV
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l14 · Odometry and dead reckoning

**Goal:** Integrate wheel and IMU motion.

- **Derive by hand:** Error growth over distance.
- **Code from scratch (Python):** Implement odometry with drift analysis.
- **Interactive lab / visual:** Drifting path versus truth.
- **Test that proves it works:** Drift matches error model.
- **Pro / open-source tool it maps to:** ROS 2
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l15 · Particle filter localisation

**Goal:** Localise on a known map.

- **Derive by hand:** Monte Carlo localisation.
- **Code from scratch (Python):** Implement MCL with a laser model.
- **Interactive lab / visual:** Particles converging on a map.
- **Test that proves it works:** Converges from global uncertainty.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Recursive Estimation (ETH)

## p17-l16 · EKF localisation with landmarks

**Goal:** Localise with known landmarks.

- **Derive by hand:** Range-bearing measurement Jacobians.
- **Code from scratch (Python):** Implement EKF localisation.
- **Interactive lab / visual:** Ellipse following robot.
- **Test that proves it works:** Consistent NEES.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p17-l17 · Occupancy grid mapping

**Goal:** Build a map from range scans.

- **Derive by hand:** Log-odds updates; inverse sensor model.
- **Code from scratch (Python):** Implement occupancy mapping.
- **Interactive lab / visual:** Map filling in.
- **Test that proves it works:** Map matches ground truth above 95 percent.
- **Pro / open-source tool it maps to:** Nav2
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l18 · Scan matching with ICP

**Goal:** Align two scans.

- **Derive by hand:** Point-to-point ICP via SVD.
- **Code from scratch (Python):** Implement ICP.
- **Interactive lab / visual:** Scans snapping together.
- **Test that proves it works:** Converges for small initial errors.
- **Pro / open-source tool it maps to:** Open3D
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)

## p17-l19 · EKF-SLAM

**Goal:** Map and localise together.

- **Derive by hand:** Joint state of robot and landmarks; correlations.
- **Code from scratch (Python):** Implement EKF-SLAM in 2D.
- **Interactive lab / visual:** Landmark ellipses shrinking on loop closure.
- **Test that proves it works:** Consistent estimates.
- **Pro / open-source tool it maps to:** FilterPy
- **Course mapping:** Recursive Estimation (ETH)

## p17-l20 · Pose-graph optimisation

**Goal:** Fix drift with loop closures.

- **Derive by hand:** Nonlinear least squares on SE(2).
- **Code from scratch (Python):** Implement Gauss-Newton pose graph.
- **Interactive lab / visual:** Graph snapping into shape.
- **Test that proves it works:** Error reduced after optimisation.
- **Pro / open-source tool it maps to:** GTSAM
- **Course mapping:** Vision and mobile robot estimation (generic) (generic)
