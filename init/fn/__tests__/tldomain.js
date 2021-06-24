const logmsg = require('../../logmsg')
global.mitm = {fn: {logmsg}}

const {
  test,
  expect,
  describe
} = global

global.mitm = {
  fn: {
    logmsg,
    _tldomain: require('../_tldomain')
  }
}

describe('_tldomain.js - function', () => {
  test('return one dots', () => {
    const result = global.mitm.fn._tldomain('https://www.one-s.com')
    expect(result).toBe('www.one-s.com')
  })
  test('return two dots', () => {
    const result = global.mitm.fn._tldomain('https://www.one.two.three-s.com')
    expect(result).toBe('www.one.two.three-s.com')
  })
  test('return same value', () => {
    const result = global.mitm.fn._tldomain('chrome://')
    expect(result).toBe('chrome://')
  })
  test('return with undefined', () => {
    const result = global.mitm.fn._tldomain(undefined)
    expect(result).toBe(undefined)
  })
  test('return with **tld-error**', () => {
    const result = global.mitm.fn._tldomain('googler')
    expect(result).toBe('**tld-error**')
  })
})
