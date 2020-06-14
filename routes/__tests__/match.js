global.mitm = {
  routes: require('../__fixture__/routes'),
  fn: {tldomain: require('../../cli-options/fn/tldomain')}
};

const {
  searchArr,
  searchFN,
  matched,
} = require('../match');

const {
  test, 
  expect,
  describe, 
} = global;

describe('match.js - searchArr', () => {
  test('return undefined for not found or string for found in url', () => {
    const typ = 'skip';
    const url = 'https://google.com/search?q=github+playwright';
    const fn = searchArr({typ, url});

    const r1 = fn('google');
    expect(typeof r1).toBe('undefined');

    const r2 = fn('google.com');
    expect(typeof r2).toBe('string');
  })
})

describe('match.js - searchFN', () => {
  test('return undefined for not found or object for found in url', () => {
    const typ = 'html';
    const url = 'https://www.google.com/search?q=github+playwright';
    const fn = searchFN(typ, {url});

    const r1 = fn('google');
    expect(typeof r1).toBe('undefined');

    const r2 = fn('google.com');
    expect(typeof r2).toBe('undefined');
  })
})

// const {
//   routeMock,
//   requestMock,
// } = require('../__fixture__/fetch');

describe('match.js - matched', () => {
  test('return matched name-space', () => {
    const typ = 'skip';
    const url = 'https://google.com/search?q=github+playwright';
    const fn = searchArr({typ, url});

    const found = matched(fn, {url, headers: {}})
    expect(typeof found).toBe('string');
  })

  test('return matched origin/referer', () => {
    const typ = 'html';
    const url = 'https://www.gtm.com/search?q=github+playwright';
    const fn = searchFN(typ, {url});

    const found = matched(fn, {url, headers: {
      'content-type': 'text/html',
      origin: 'https://google.com'
    }})
    expect(typeof found).toBe('object');
  })

  test('return exclude domain', () => {
    const typ = 'html';
    const url = 'https://www.exclude.com/search?q=github+playwright';
    const fn = searchArr(typ, {url});

    let found = matched(fn, {url, headers: {
      'content-type': 'text/html',
      origin: 'https://google.com'
    }})
    expect(typeof found).toBe('undefined');

    found = matched(fn, {url, headers: {
      'content-type': 'text/html',
      referer: 'https://google.com'
    }})
    expect(typeof found).toBe('undefined');
  })

  test('return with no headers', () => {
    const typ = 'html';
    const url = 'https://www.exclude.com/search?q=github+playwright';
    const fn = searchArr(typ, {url});

    const found = matched(fn, {url, headers: {}})
    expect(typeof found).toBe('undefined');
  })

})
