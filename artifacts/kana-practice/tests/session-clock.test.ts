import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock, pauseClock, remainingTime, resumeClock } from '../src/practice/session-clock';

for (const minutes of [3, 5, 10]) {
  test(`${minutes}-minute session excludes all paused time, including a long break`, () => {
    const duration = minutes * 60000;
    let clock = createClock(duration, 0);
    clock = pauseClock(clock, 10000);
    assert.equal(remainingTime(clock, 3600000), duration - 10000);
    assert.equal(pauseClock(clock, 3600000), clock);
    clock = resumeClock(clock, 3600000);
    assert.equal(remainingTime(clock, 3600000), duration - 10000);
    assert.equal(remainingTime(clock, 3601000), duration - 11000);
    assert.equal(resumeClock(clock, 3601000), clock);
    clock = pauseClock(clock, 3602000);
    clock = resumeClock(clock, 7200000);
    assert.equal(remainingTime(clock, 7200000), duration - 12000);
    assert.equal(remainingTime(clock, 7200000 + duration), 0);
  });
}

test('pause cannot revive an expired session', () => {
  const expired = createClock(1000, 0);
  assert.equal(pauseClock(expired, 2000), expired);
  assert.equal(remainingTime(resumeClock(expired, 4000), 4000), 0);
});
