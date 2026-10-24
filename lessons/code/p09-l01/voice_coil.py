import numpy as np

def gap_field(z, B0=0.8, h=0.006, fringe=0.0015):
    """Radial flux density at axial position z: flat in the gap of height h, Gaussian fringe outside."""
    over = np.maximum(np.abs(z) - h / 2, 0)
    return B0 * np.exp(-(over / fringe) ** 2)

def coil_force(I, z0, N=50, r=0.030 / (2 * np.pi), coil_len=0.004, segs=360):
    """Sum I dl x B over every turn and segment. Radial B, tangential dl -> axial force."""
    zs = z0 + np.linspace(-coil_len / 2, coil_len / 2, N)      # turn positions
    phi = np.linspace(0, 2 * np.pi, segs, endpoint=False)
    dphi = 2 * np.pi / segs
    F = np.zeros(3)
    for z in zs:
        B = gap_field(z)
        dl = np.stack([-np.sin(phi), np.cos(phi), np.zeros_like(phi)], 1) * r * dphi
        Bv = np.stack([np.cos(phi), np.sin(phi), np.zeros_like(phi)], 1) * B
        F += I * np.cross(dl, Bv).sum(0)
    return F

if __name__ == "__main__":
    F = coil_force(2.0, 0.0)
    print("force at 2 A, centred:", np.round(F, 6))
    assert abs(F[0]) < 1e-9 and abs(F[1]) < 1e-9          # radial parts cancel
    assert abs(abs(F[2]) - 50 * 0.8 * 2.0 * 0.030) < 1e-9    # N B I L = 2.4 N
    # linear in current
    Is = np.linspace(-5, 5, 11)
    Fz = np.array([coil_force(I, 0.0)[2] for I in Is])
    slope, icpt = np.polyfit(Is, Fz, 1)
    assert np.max(np.abs(Fz - slope * Is)) < 1e-9 and abs(icpt) < 1e-9
    # power balance: back-EMF e = k v, so e*I == F*v
    k = abs(slope); v = 0.5
    assert abs(k * v * 2.0 - abs(F[2]) * v) < 1e-12
    # force falls once turns leave the 6 mm gap
    off = abs(coil_force(2.0, 0.004)[2])
    print(f"k_f = {k:.3f} N/A; force with the coil 4 mm off centre: {off:.2f} N")
    assert off < 0.8 * abs(F[2])
