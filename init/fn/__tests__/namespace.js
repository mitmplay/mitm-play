global.mitm = {
  __tag2: {},
  __tag3: {},
  __tag4: {},
  routes: require('../__fixture__/routes'),
  routex: {
    _global_: {}
  },
  router: {
    _global_: {
      config: {}
    }
  },
  data: {},
  argv: {},
  fn: {_routeSet: require('../_route-set')._routeSet}
}

global.mitm.fn._routeSet(global.mitm.routes._global_, '_global_', 'index.js')
global.mitm.fn._routeSet(global.mitm.routes['google.com'], 'google.com', 'index.js')

const _namespace = require('../_namespace')

const {
  test,
  expect,
  describe
} = global

describe('name-space.js - function', () => {
  test('return namespace exist or not', () => {
    let ns = _namespace('google.com')
    expect(ns).toBe('google.com')

    ns = _namespace('www.google.com')
    expect(ns).toBe('google.com')
  })
})
