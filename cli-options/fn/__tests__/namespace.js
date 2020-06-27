global.mitm = {
  routes: require('../__fixture__/routes'),
  data: {},
  argv: {},
  fn: {
    routeSet: require('../route-set'),
  }
};

global.mitm.fn.routeSet(global.mitm.routes['google.com'], 'google.com', true);

const namespace = require('../namespace');

const {
  test, 
  expect,
  describe, 
} = global;

describe('name-space.js - function', () => {
  test('return namespace exist or not', () => {
    let ns = namespace('google.com');
    expect(ns).toBe('google.com');

    ns = namespace('www.google.com');
    expect(ns).toBe('google.com');
  })
})