const { _proxy, _noproxy } = require('../../init/fn/_proxies')
const _tldomain = require('../../init/fn/_tldomain')
global.mitm = {
  fn: {
    _proxy,
    _noproxy,
    _tldomain
  },
  argv: {
    verbose: true,
    browser: { chromium: true }
  }
}

const {
  test,
  expect,
  describe
} = global

const {
  extract,
  fetch
} = require('../fetch')

describe('fetch.js - extract', () => {
  test('return object keys without \'_\'', () => {
    const request = {
      url: () => 'http://google.com',
      method: () => 'GET',
      headers: () => [{ 'content-type': 'text/css' }],
      postData: () => null
    }
    const route = {}
    return extract({ route, request, browserName: 'chromium' }).then(function (result) {
      expect(Object.keys(result).join(',')).toBe('method,body,url,browserName,headers,oriRef,page')
    });
  })
})

const {
  routeMock,
  requestMock
} = require('../__fixture__/fetch')
const nock = require('nock')

describe('fetch.js - fetch', () => {
  test('call fetch api w/ HTTP_PROXY', done => {
    const url = 'https://api.github.com/one'
    nock('https://api.github.com').get('/one').reply(
      200,
      { license: {} },
      { 'set-cookie': ['one', 'two'] })

    const handler = resp => {
      done()
      return resp
    }

    const options = {
      ...requestMock,
      proxy: true,
      url
    }

    process.env.HTTP_PROXY = 'http://proxy.com/lah/'
    const result = fetch(routeMock, 'chromium', options, handler)
    expect(result).toBe(undefined)
  })

  test('call fetch api w/ http_proxy', done => {
    const url = 'https://api.github.com/one'
    nock('https://api.github.com').get('/one').reply(
      200,
      { license: {} },
      { 'set-cookie': ['one', 'two'] })

    const handler = resp => {
      done()
      return resp
    }

    const options = {
      ...requestMock,
      proxy: true,
      url
    }

    delete process.env.HTTP_PROXY
    process.env.http_proxy = 'http://proxy.com/lah/'
    const result = fetch(routeMock, 'chromium', options, handler)
    expect(result).toBe(undefined)
  })

  test('call fetch api with error', () => {
    const url = 'http://www.google.com/two'
    nock('http://www.google.com').get('/two').replyWithError({
      message: 'something awful happened',
      code: 'AWFUL_ERROR'
    })

    const handler = () => {
      throw new Error('err')
    }

    const options = {
      ...requestMock,
      proxy: 'http://proxy.com/lah/',
      url
    }
    const result = fetch(routeMock, 'chromium', options, handler)
    expect(result).toBe(undefined)
  })
})
