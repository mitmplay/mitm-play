const assert = require('assert');
const {
  extract,
  source,
  e_head,
  script_src,
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
