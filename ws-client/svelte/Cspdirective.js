const cspArr = [
  'default-src',
  'style-src',
  'frame-src',
  'script-src',
  'worker-src',
  'child-src',
  'connect-src',
  'form-action',
  'img-src',
  'font-src',
  'media-src',
  'frame-ancestors',
  'manifest-src',
  'object-src',
  'report-uri',
  'report-to',
]
const cspInfo = {
  'default-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/default-src',
    note: 'is a fallback directive for the other fetch directives.'
  },
  'style-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
    note: 'controls from where styles get applied to a document. This includes <link> elements, @import rules, and requests originating from a Link HTTP response header field: <b>style-src-elem</b>, <b>style-src-attr</b>'
  },
  'frame-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-src',
    note: 'specifies valid sources for nested browsing contexts loading using elements such as &gt;frame&lt; and &gt;iframe&lt;.'
  },
  'script-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src',
    note: 'specifies the locations from which a script can be executed from. It is a fallback directive for other script-like directives: <b>script-src-elem</b>, <b>script-src-attr</b>'
  },
  'worker-src': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src',
    note: 'specifies valid sources for Worker, SharedWorker, or ServiceWorker scripts.'
  },
  'child-src': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/child-src',
    note: 'allows the developer to control nested browsing contexts and worker execution contexts.'
  },
  'connect-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src',
    note: 'provides control over fetch requests, XHR, eventsource, beacon and websockets connections.'
  },
  'form-action': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/form-action',
    note: 'restricts the URLs which the forms can submit to.'
  },
  'img-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/img-src',
    note: 'specifies the URLs that images can be loaded from.'
  },
  'font-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/font-src',
    note: 'specifies which URLs to load fonts from.'
  },
  'media-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/media-src',
    note: 'specifies the URLs from which video, audio and text track resources can be loaded from.'
  },
  'frame-ancestors': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors',
    note: 'restricts the URLs that can embed the requested resource inside of &gt;frame&lt;, &gt;iframe&lt;, &gt;object&lt;, &gt;embed&lt;, or &gt;applet&lt; elements.'
  },
  'manifest-src': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/manifest-src',
    note: 'specifies the URLs that application manifests may be loaded from.'
  },
  'object-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/object-src',
    note: 'specifies the URLs from which plugins can be loaded from.'
  },
  'report-uri': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri',
    note: 'directive is deprecated by report-to, which is a URI that the reports are sent to.',
    deprecated: true
  },
  'report-to': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-to',
    note: 'which is a groupname defined in the header in a json formatted header value.'
  },
}

module.exports = {
  cspArr,
  cspInfo
}