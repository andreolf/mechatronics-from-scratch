import math

def ldo(vin, iload, vout=5.0, drop=0.3, theta=50.0, ta=25.0):
    vo = min(vout, max(0.0, vin - drop))
    p = (vin - vo) * iload
    return vo, p, vo / vin, ta + p * theta

def max_current(vin, vout=5.0, tj_max=125.0, theta=50.0, ta=25.0):
    return (tj_max - ta) / (theta * (vin - vout))

if __name__ == "__main__":
    vo, p, eff, tj = ldo(12.0, 0.3)
    assert vo == 5.0 and abs(p - 2.1) < 1e-12 and abs(tj - 130.0) < 1e-9 and abs(eff - 5 / 12) < 1e-12
    imax = max_current(12.0)
    print(f"max load at 12 V in: {imax*1e3:.0f} mA")
    assert abs(imax - 0.285714) < 1e-6 and abs(ldo(12.0, imax)[3] - 125.0) < 1e-9
    assert abs(ldo(7.0, 0.3)[3] - 55.0) < 1e-9
    assert ldo(5.1, 0.1)[0] < 5.0                     # in dropout the output sags
    # thermal transient: first-order heating with a 30 s thermal time constant
    tau = 30.0
    t_cross = -tau * math.log(1 - (125 - 25) / (130 - 25))
    assert abs(t_cross - 91.4) < 0.1                  # it takes about 1.5 minutes to overheat
