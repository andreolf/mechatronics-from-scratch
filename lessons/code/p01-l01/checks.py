import numpy as np

def assert_close(actual, expected, rtol=1e-9, atol=1e-12):
    a = np.asarray(actual, dtype=float)
    e = np.asarray(expected, dtype=float)
    bound = atol + rtol * np.abs(e)
    err = np.abs(a - e)
    if np.all(err <= bound):
        return True
    i = np.unravel_index(np.argmax(err - bound), err.shape)
    raise AssertionError(
        f"element {i}: got {a[i]!r}, expected {e[i]!r}, "
        f"error {err[i]:.3e} > bound {bound[i]:.3e}")

if __name__ == "__main__":
    assert 0.1 + 0.2 != 0.3            # exact comparison fails
    assert_close(0.1 + 0.2, 0.3)       # tolerance comparison passes
    assert_close([1.0, 2.0], [1.0, 2.0 + 1e-10])
    try:
        assert_close(0.3001, 0.3)
    except AssertionError as err:
        print("rejected as expected:", err)
    else:
        raise SystemExit("0.3001 should fail")
    print("eps =", np.finfo(float).eps)
