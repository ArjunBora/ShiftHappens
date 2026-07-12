import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRole } from '../src/middleware/checkRole.js';

test('allows request when the simulated role matches the allowed role', () => {
  const req = { headers: { 'x-simulated-role': 'Fleet Manager' } };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
  let called = false;
  const next = () => { called = true; };

  checkRole(['Fleet Manager'])(req, res, next);

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test('blocks request when the simulated role is not allowed', () => {
  const req = { headers: { 'x-simulated-role': 'Dispatcher' } };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
  let called = false;
  const next = () => { called = true; };

  checkRole(['Fleet Manager'])(req, res, next);

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});
