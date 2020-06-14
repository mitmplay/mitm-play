global.mitm = {};

const {
  test, 
  expect,
  describe, 
} = global;

const {
  script_src,
  source,
  e_head,
  e_end,
} = require('../inject');

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
