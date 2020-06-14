global.mitm = {};

const {
  test, 
  expect,
  describe, 
} = global;

const {
  script_src,
  extract,
  source,
  e_head,
  e_end,
  fetch,
} = require('../fetch');

describe('fetch.js - extract', () => {
  test('return object keys without \'_\'', () => {
    const _request = {
      _url: 'http://google.com',
      _methods: 'GET',
      _headers: [{'content-type': 'text/css'}],
      _postData: ''
    }
    const route = {_request};
    const result = extract({route, browserName: 'chromium'});
    expect(Object.keys(result).join(',')).toBe('url,method,headers,body,browserName')
  })
})

describe('fetch.js - script_src', () => {
  test('insert <script> inside <html>', () => {
    const result = script_src('<html><body></body>', ['test.js'])
    expect(result).toBe('<html>\n<script nonce src="/mitm-play/test.js"></script><body></body>')
  })

  test('insert <script> inside <head>', () => {
    const result = script_src('<html><head></head>', ['test.js'])
    expect(result).toBe('<html><head>\n<script nonce src="/mitm-play/test.js"></script></head>')
  })

  test('insert <script> in the begening of `text` string', () => {
    const result = script_src('text', ['test.js'])
    expect(result).toBe('<script nonce src="/mitm-play/test.js"></script>\ntext')
  })
})

describe('fetch.js - source', () => {
  test('inject js at the end', () => {
    const result = source('alert(0);', ['test.js'])
    expect(result).toBe('alert(0);\n(test.js)();')
  })
})

describe('fetch.js - e_head', () => {
  const fn = () => {alert(0)};
  test('insert js function inside <html>', () => {
    const result = e_head('<html><body></body>', [fn])
    expect(result).toBe(
`<html>
<script>(() => {
    alert(0);
  })();</script>
<body></body>`)
  })

  test('insert js function inside <head>', () => {
    const result = e_head('<html><head></head>', [fn])
    expect(result).toBe(
`<html><head>
<script>(() => {
    alert(0);
  })();</script>
</head>`)
  })

  test('insert js function on top', () => {
    const result = e_head('<body></body>', [fn])
    expect(result).toBe(`
<script>(() => {
    alert(0);
  })();</script>
<body></body>`)
  })
})

describe('fetch.js - e_end', () => {
  const fn = () => {alert(0)};
  test('insert js code at end of </body>', () => {
    const result = e_end('<html><body>Hi</body>', [fn])
    expect(result).toBe(
`<html><body>Hi
<script>(() => {
    alert(0);
  })();</script>
</body>`)
  })

  test('insert js code at end of </html>', () => {
    const result = e_end('<html>Hi</html>', [fn])
    expect(result).toBe(
`<html>Hi
<script>(() => {
    alert(0);
  })();</script>
</html>`)
  })

  test('insert js code at end of file', () => {
    const result = e_end('Hi there', [fn])
    expect(result).toBe(
`Hi there
<script>(() => {
    alert(0);
  })();</script>\n`)
  })

})

const {
  routeMock,
  requestMock,
} = require('../__fixture__/fetch');
const nock = require('nock')

describe('fetch.js - fetch', () => {
  test('call fetch api w/ HTTP_PROXY', done => {
    const url = 'https://api.github.com/one';
    nock('https://api.github.com').get('/one').reply(
      200,
      {license: {}},
      {'set-cookie': ['one', 'two']});

    const handler = resp => {
      done();
      return resp;
    }

    const options = {
      ...requestMock,
      proxy: true,
      url,
    }

    process.env.HTTP_PROXY = 'http://proxy.com/lah/';
    const result = fetch(routeMock, options, handler)
    expect(result).toBe(undefined);
  })

  test('call fetch api w/ http_proxy', done => {
    const url = 'https://api.github.com/one';
    nock('https://api.github.com').get('/one').reply(
      200,
      {license: {}},
      {'set-cookie': ['one', 'two']});

    const handler = resp => {
      done();
      return resp;
    }

    const options = {
      ...requestMock,
      proxy: true,
      url,
    }

    delete process.env.HTTP_PROXY;
    process.env.http_proxy = 'http://proxy.com/lah/';
    const result = fetch(routeMock, options, handler)
    expect(result).toBe(undefined);
  })


  test('call fetch api with error', () => {
    const url = 'http://www.google.com/two';
    nock('http://www.google.com').get('/two').replyWithError({
      message: 'something awful happened',
      code: 'AWFUL_ERROR'
    })

    const handler = () => {
      throw 'err';
    }

    const options = {
      ...requestMock,
      proxy: 'http://proxy.com/lah/',
      url,
    }
    const result = fetch(routeMock, options, handler)
    expect(result).toBe(undefined);
  })
})
