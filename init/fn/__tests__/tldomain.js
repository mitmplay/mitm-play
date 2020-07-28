const {
  test, 
  expect,
  describe, 
} = global;

global.mitm = {
  fn: {tldomain: require('../tldomain')}
};

describe('tldomain.js - function', () => {
  test('return one dots', () => {
    const result = global.mitm.fn.tldomain('https://www.one-s.com')
    expect(result).toBe('one-s.com');
  });
  test('return two dots', () => {
    const result = global.mitm.fn.tldomain('https://www.one.two.three-s.com')
    expect(result).toBe('two.three-s.com');
  });
  test('return same value', () => {
    const result = global.mitm.fn.tldomain('chrome://')
    expect(result).toBe('chrome://');
  });
  test('return with undefined', () => {
    const result = global.mitm.fn.tldomain(undefined)
    expect(result).toBe(undefined);
  });
  test('return with **tld-error**', () => {
    const result = global.mitm.fn.tldomain('googler')
    expect(result).toBe('**tld-error**');
  });
})
