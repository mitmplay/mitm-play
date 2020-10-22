const ext = require('../ext')

const {
  test,
  expect,
  describe
} = global

describe('ext.js - function', () => {
  test('return known ext', () => {
    const result = ext({ headers: { 'content-type': ['text/html'] } })
    expect(result).toBe('html')
  })

  test('return weird known ext', () => {
    const result = ext({ headers: { 'content-type': 'application/script' } })
    expect(result).toBe('js')
  })

  test('return "" for unknown ext', () => {
    const result = ext({ headers: { 'content-type': 'unkown/ext' } })
    expect(result).toBe('')
  })
})
