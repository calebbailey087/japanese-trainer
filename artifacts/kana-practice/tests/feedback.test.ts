import test from 'node:test';
import assert from 'node:assert/strict';
import { insertRetry, rowHint, typedFeedback } from '../src/practice/feedback';
import { backupOverdue, emptyData, validateData } from '../src/storage/store';

test('hints give a row without giving away the reading', () => {
  assert.equal(rowHint('ま'), 'Hint: ma-row.');
  assert.equal(rowHint('マ'), 'Hint: ma-row.');
  assert.ok(rowHint('コーヒー').includes('ka-row'));
  assert.equal(typedFeedback('sa', true), 'You typed sa → that’s さ');
  assert.equal(typedFeedback('si', true, true), 'You typed si → that’s シ');
  assert.equal(typedFeedback('cat', false), 'You typed “cat”');
});

test('remedial card returns after two other cards or at the end of a short queue', () => {
  assert.deepEqual(insertRetry(['a', 'b', 'c', 'd'], 0, 'retry-a'), ['a', 'b', 'c', 'retry-a', 'd']);
  assert.deepEqual(insertRetry(['a'], 0, 'retry-a'), ['a', 'retry-a']);
});

test('fresh installs default to three minutes and no personal countdown', () => {
  const data = emptyData();
  assert.equal(data.settings.minutes, 3);
  assert.equal(data.settings.countdown, null);
  data.settings.countdown = { name: 'My event', date: '2030-06-15' };
  assert.deepEqual(validateData(JSON.parse(JSON.stringify(data))), data);
  assert.throws(() => validateData({ ...data, settings: { ...data.settings, countdown: { name: 'Bad', date: '2027-02-30' } } }), /Countdown/);
});

test('backup reminder uses last export or first tracked day, at fourteen days', () => {
  const data = emptyData();
  const start = Date.parse('2026-01-01T12:00:00Z');
  data.backup = { trackingSince: new Date(start).toISOString(), lastExportAt: null };
  assert.equal(backupOverdue(data, start + 13 * 86400000), false);
  assert.equal(backupOverdue(data, start + 14 * 86400000), true);
  data.backup.lastExportAt = new Date(start + 13 * 86400000).toISOString();
  assert.equal(backupOverdue(data, start + 14 * 86400000), false);
  const { backup: _backup, ...old } = data;
  const { countdown: _countdown, ...oldSettings } = old.settings;
  const migrated = validateData({ ...old, settings: oldSettings, practiceDays: ['2026-01-01'] });
  assert.equal(migrated.settings.countdown, null);
  assert.equal(backupOverdue(migrated, start + 15 * 86400000), true);
  assert.throws(() => validateData({ ...data, backup: { trackingSince: 'nonsense', lastExportAt: null } }), /backup reminder/);
});
