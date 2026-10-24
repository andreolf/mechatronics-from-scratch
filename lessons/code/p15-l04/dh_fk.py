import numpy as np   # lesson 03's DH forward kinematics, compact

def dh(theta, d, a, alpha):
    ct, st, ca, sa = np.cos(theta), np.sin(theta), np.cos(alpha), np.sin(alpha)
    return np.array([[ct, -st * ca, st * sa, a * ct], [st, ct * ca, -ct * sa, a * st], [0, sa, ca, d], [0, 0, 0, 1]])

DH_TABLE = [(0.0, 0.4, 0.0, np.pi / 2), (0.0, 0.0, 0.5, 0.0), (0.0, 0.0, 0.4, 0.0)]

def fk_dh(q, table=DH_TABLE):
    T = np.eye(4); frames = [T]
    for qi, (off, d, a, al) in zip(q, table):
        T = T @ dh(qi + off, d, a, al); frames.append(T)
    return T, frames
