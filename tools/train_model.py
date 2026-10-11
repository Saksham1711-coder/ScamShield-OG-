"""Trains the tiny fraud-risk model used by the UPI Lab simulation.
IMPORTANT: the data is SYNTHETIC (generated below), so the metrics say nothing about real-world accuracy.
Replace generate() with real labelled data from a bank/NPCI pilot, retrain, paste the printed MODEL into engine.js."""
import numpy as np, json
rng = np.random.default_rng(7)
NAMES = ['age', 'complaints', 'senders', 'outflow', 'fri', 'mismatch', 'amount', 'firstTime', 'text']
def row(kind):
    if kind == 'person':   a, c, s, o, f, m = rng.uniform(200, 2500), rng.random() < .1, rng.uniform(0, 8), rng.uniform(0, .3), (rng.random() < .05) * 1, 0
    elif kind == 'shop':   a, c, s, o, f, m = rng.uniform(100, 2000), rng.random() < .05, rng.uniform(15, 80), rng.uniform(0, .25), (rng.random() < .03) * 1, 0
    else:
        clean = rng.random() < .12
        a = rng.uniform(60, 400) if clean else rng.uniform(0, 60)
        c = 0 if clean else rng.integers(0, 9); s = rng.uniform(5, 40) if clean else rng.uniform(10, 90)
        o = rng.uniform(.1, .5) if clean else rng.uniform(.5, 1); f = 0 if clean else rng.choice([0, 1, 2, 3], p=[.2, .2, .3, .3])
        m = int(rng.random() < .3)
    scam = kind == 'scam'
    t = (rng.uniform(.2, 1) if rng.random() < .6 else 0) if scam else (rng.uniform(0, .3) if rng.random() < .15 else 0)
    amt = rng.uniform(.1, .9) if scam else rng.uniform(0, .5)
    first = float(rng.random() < (.9 if scam else .5))
    return [np.log1p(a) / 7.8, min(c, 10) / 10, s / 90, o, f / 3, m, amt, first, t], float(scam)
data = [row(k) for k in rng.choice(['person', 'shop', 'scam'], 8000, p=[.4, .3, .3])]
X = np.array([d[0] for d in data]); y = np.array([d[1] for d in data]); n = 6000
w = np.zeros(X.shape[1]); b = 0.0
for _ in range(4000):
    p = 1 / (1 + np.exp(-(X[:n] @ w + b))); g = p - y[:n]
    w -= .8 * (X[:n].T @ g / n + 1e-3 * w); b -= .8 * g.mean()
p = 1 / (1 + np.exp(-(X[n:] @ w + b)))
print('held-out synthetic accuracy: %.3f' % (((p > .5) == y[n:]).mean()))
print('MODEL =', json.dumps({'bias': round(float(b), 3), 'w': {k: round(float(v), 3) for k, v in zip(NAMES, w)}}))
