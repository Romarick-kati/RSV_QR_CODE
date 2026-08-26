import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, authValidators, eventValidators } from '../src/validators/validators.js';
import { ApiError } from '../src/utils/ApiError.js';
import { generateReference, generateAttendanceToken } from '../src/utils/tokens.js';

test('validate() passes for a fully valid body', () => {
  assert.doesNotThrow(() => validate({ name: 'Aisha' }, { name: { required: true } }));
});

test('validate() throws ApiError with field details when required field missing', () => {
  try {
    validate({}, { email: { required: true, label: 'Email' } });
    assert.fail('expected validate() to throw');
  } catch (err) {
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.details.email, 'Email is required.');
  }
});

test('validate() rejects a malformed email', () => {
  assert.throws(() => validate({ email: 'not-an-email' }, { email: { type: 'email' } }));
});

test('validate() enforces minLength on password', () => {
  assert.throws(() => validate({ password: '123' }, { password: { minLength: 6 } }));
  assert.doesNotThrow(() => validate({ password: '123456' }, { password: { minLength: 6 } }));
});

test('authValidators.register requires name, email, and a 6+ char password', () => {
  assert.throws(() => authValidators.register({ name: 'A', email: 'a@b.com', password: '123' }));
  assert.doesNotThrow(() => authValidators.register({ name: 'A', email: 'a@b.com', password: '123456' }));
});

test('eventValidators.upsert rejects an unknown status value', () => {
  const base = {
    title: 'Conf', description: 'desc', category: 'Technology', date: '2026-09-01',
    startTime: '09:00', endTime: '10:00', venue: 'Hall', capacity: 10, registrationDeadline: '2026-08-30',
  };
  assert.throws(() => eventValidators.upsert({ ...base, status: 'not-a-real-status' }));
  assert.doesNotThrow(() => eventValidators.upsert({ ...base, status: 'published' }));
});

test('generateReference produces a unique, formatted reference each call', () => {
  const a = generateReference();
  const b = generateReference();
  assert.notEqual(a, b);
  assert.match(a, /^PRES-\d{4}-[0-9A-F]{8}$/);
});

test('generateAttendanceToken produces high-entropy, unique tokens', () => {
  const tokens = new Set(Array.from({ length: 200 }, () => generateAttendanceToken()));
  assert.equal(tokens.size, 200, 'expected all 200 generated tokens to be unique');
  for (const t of tokens) assert.match(t, /^tok_/);
});
