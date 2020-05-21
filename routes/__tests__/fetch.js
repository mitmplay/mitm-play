const assert = require('assert');
const {
  script_src,
  extract,
  source,
  e_head,
  fetch,
} = require('../fetch');

describe('fetch.js - extract', () => {
  test(`return object keys without '_'`, () => {
    const _request = {
      _url: 'http://google.com',
      _methods: 'GET',
      _headers: [{'content-type': 'text/css'}],
      _postData: ''
    }
    const result = extract({_request});
    expect(Object.keys(result).join(',')).toBe('url,method,headers,body')
  })
})

describe('fetch.js - script_src', function() {
  test('insert <script> inside <html>', function() {
    const result = script_src('<html><body></body>', ['test.js'])
    expect(result).toBe(`<html>\n<script nonce src="/mitm-play/test.js"></script><body></body>`)
  })

  test('insert <script> inside <head>', function() {
    const result = script_src('<html><head></head>', ['test.js'])
    expect(result).toBe(`<html><head>\n<script nonce src="/mitm-play/test.js"></script></head>`)
  })

  test('insert <script> in the begening of `text` string', function() {
    const result = script_src('text', ['test.js'])
    expect(result).toBe(`<script nonce src="/mitm-play/test.js"></script>\ntext`)
  })
})

describe('fetch.js - source', function() {
  test('inject js at the end', function() {
    const result = source('alert(0);', ['test.js'])
    expect(result).toBe(`alert(0);\n(test.js)();`)
  })
})

describe('fetch.js - e_head', function() {
  const fn = () => {alert(0)};
  test('insert js function inside <html>', function() {
    const result = e_head('<html><body></body>', [fn])
    expect(result).toBe(
`<html>
<script>(() => {
    alert(0);
  })()</script>
<body></body>`)
  })

  test('insert js function inside <head>', function() {
    const result = e_head('<html><head></head>', [fn])
    expect(result).toBe(
`<html><head>
<script>(() => {
    alert(0);
  })()</script>
</head>`)
  })

  test('insert js function on top', function() {
    const result = e_head('<body></body>', [fn])
    expect(result).toBe(`
<script>(() => {
    alert(0);
  })()</script>
<body></body>`)
  })

})

const {
  routeMock,
  routeRequestMock,
} = require('../__fixture__/fetch');
const nock = require('nock')

describe('fetch.js - fetch', function() {
  test('call fetch api', function(done) {
    const scope = nock('https://api.github.com').get('/')
    // .delay({head: 1, body: 3})
    .reply(200, {license: {}});

    const handler = resp => {
      done();
      return resp;
    }

    const result = fetch(routeMock, routeRequestMock, handler)
    expect(result).toBe(undefined);
  })

  test('call fetch api with error', function() {
    const scope = nock('http://www.google.com')
    .get('/cat-poems')
    .replyWithError({
      message: 'something awful happened',
      code: 'AWFUL_ERROR'
    })

    const handler = resp => {
      throw 'err';
    }

    const result = fetch(routeMock, routeRequestMock, handler)
    expect(result).toBe(undefined);
  })
})
