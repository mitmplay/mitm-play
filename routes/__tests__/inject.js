/* global alert */
/* eslint-disable camelcase */
global.mitm = {}

const {
  test,
  expect,
  describe
} = global

const {
  script_src,
  source,
  head,
  body
} = require('../inject')

describe('fetch.js - script_src', () => {
  test('insert <script> inside <html>', () => {
    const result = script_src('<html><body></body>', ['/mitm-play/test.js'])
    expect(result).toBe('<html>\n<script nonce src="/mitm-play/test.js"></script><body></body>')
  })

  test('insert <script> inside <head>', () => {
    const result = script_src('<html><head></head>', ['/mitm-play/test.js'])
    expect(result).toBe('<html><head>\n<script nonce src="/mitm-play/test.js"></script></head>')
  })

  test('insert <script> in the begening of `text` string', () => {
    const result = script_src('text', ['/mitm-play/test.js'])
    expect(result).toBe('<script nonce src="/mitm-play/test.js"></script>\ntext')
  })
})

describe('fetch.js - source', () => {
  test('inject js at the end', () => {
    const result = source('alert(0);', ['test.js'])
    expect(result).toBe('alert(0);\n(test.js)();')
  })
})

describe('fetch.js - head', () => {
  const fn = () => { alert(0) }
  test('insert js function inside <html>', () => {
    const result = head('<html><body></body>', [fn])
    expect(result).toBe(
`<html>
<script>(() => {
    alert(0);
  })();</script>
<body></body>`)
  })

  test('insert js function inside <head>', () => {
    const result = head('<html><head></head>', [fn])
    expect(result).toBe(
`<html><head>
<script>(() => {
    alert(0);
  })();</script>
</head>`)
  })

  test('insert js function on top', () => {
    const result = head('<body></body>', [fn])
    expect(result).toBe(`
<script>(() => {
    alert(0);
  })();</script>
<body></body>`)
  })
})

describe('fetch.js - body', () => {
  const fn = () => { alert(0) }
  test('insert js code at end of </body>', () => {
    const result = body('<html><body>Hi</body>', [fn])
    expect(result).toBe(
`<html><body>Hi
<script>(() => {
    alert(0);
  })();</script>
</body>`)
  })

  test('insert js code at end of </html>', () => {
    const result = body('<html>Hi</html>', [fn])
    expect(result).toBe(
`<html>Hi
<script>(() => {
    alert(0);
  })();</script>
</html>`)
  })

  test('insert js code at end of file', () => {
    const result = body('Hi there', [fn])
    expect(result).toBe(
`Hi there
<script>(() => {
    alert(0);
  })();</script>\n`)
  })
})
