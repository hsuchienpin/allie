"""Generate original short, quiet game sounds; no runtime service or libraries."""
import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'wwwroot' / 'slice' / 'assets'
RATE = 22050


def make(name, notes, duration, noise=0):
    rng = random.Random(7)
    values = []
    for i in range(int(RATE * duration)):
        t = i / RATE
        value = 0
        for start, frequency, length, amplitude in notes:
            local = t - start
            if 0 <= local < length:
                envelope = min(1, local / .012) * max(0, 1 - local / length) ** 1.6
                value += amplitude * envelope * (math.sin(2 * math.pi * frequency * local) + .18 * math.sin(4 * math.pi * frequency * local))
        value += noise * (rng.random() * 2 - 1) * math.exp(-t * 38) * min(1, t / .004)
        values.append(struct.pack('<h', int(max(-.8, min(.8, value)) * 32767)))
    with wave.open(str(ROOT / (name + '.wav')), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b''.join(values))


if __name__ == '__main__':
    ROOT.mkdir(parents=True, exist_ok=True)
    make('slice', [(0, 1050, .13, .24), (.018, 620, .16, .16)], .22, .3)
    make('pop', [(0, 430, .12, .4), (.025, 720, .10, .12)], .20)
    make('progress', [(0, 780, .12, .25), (.05, 1040, .12, .17)], .22)
    make('burst', [(0, 520, .28, .2), (.1, 780, .3, .23), (.2, 1040, .32, .22)], .65, .14)
    make('chest', [(0, 523, .24, .2), (.13, 659, .25, .2), (.26, 784, .35, .24)], .72)
    make('cheer', [(0, 523, .25, .2), (.13, 659, .25, .22), (.26, 784, .25, .22), (.40, 1047, .5, .23), (.40, 784, .5, .12)], 1.0)
