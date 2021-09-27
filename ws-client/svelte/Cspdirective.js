const cspArr = [
  'default-src',
  'child-src',
  'connect-src',
  'font-src',
  'img-src',
  'manifest-src',
  'media-src',
  'prefetch-src',
  'object-src',
  'script-src',
  'script-src-elem',
  'script-src-attr',
  'style-src',
  'style-src-elem',
  'style-src-attr',
  'base-uri',
  'plugin-types',
  'sandbox',
  'navigate-to',
  'form-action',
  'frame-ancestors',
  'frame-src',
  'worker-src',
  'report-uri',
  'report-to',
]
const cspFetch = [
  'default-src',
  'child-src',
  'connect-src',
  'font-src',
  'img-src',
  'manifest-src',
  'media-src',
  'prefetch-src',
  'object-src',
  'script-src',
  'style-src',
]
const cspEAttr = [
  'script-src-elem',
  'script-src-attr',
  'style-src-elem',
  'style-src-attr',
]
const cspInfo = {
  'default-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/default-src',
    note: 'is a fallback directive for the other fetch directives: <b>child-src</b>, <b>connect-src</b>, <b>font-src</b>, <b>img-src</b>, <b>manifest-src</b>, <b>media-src</b>, <b>prefetch-src</b>, <b>object-src</b>, <b>script-src(script-src-elem, script-src-attr)</b>, <b>style-src(style-src-elem, style-src-attr)</b>.'
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
  'font-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/font-src',
    note: 'specifies which URLs to load fonts from.'
  },
  'img-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/img-src',
    note: 'specifies the URLs that images can be loaded from.'
  },
  'manifest-src': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/manifest-src',
    note: 'specifies the URLs that application manifests may be loaded from.'
  },
  'media-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/media-src',
    note: 'specifies the URLs from which video, audio and text track resources can be loaded from.'
  },
  'prefetch-src': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/prefetch-src',
    note: 'specifies the URLs from which resources can be prefetched from.'
  },
  'object-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/object-src',
    note: 'specifies the URLs from which plugins can be loaded from.'
  },
  'script-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src',
    note: 'specifies the locations from which a script can be executed from. It is a fallback directive for other script-like directives: <b>script-src-elem</b>, <b>script-src-attr</b>'
  },
  'script-src-elem': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src-elem',
    note: 'specifies valid sources for JavaScript &lt;script&gt; elements, but not inline script event handlers like onclick.'
  },
  'script-src-attr': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src-attr',
    note: 'specifies valid sources for JavaScript inline event handlers. This includes only inline script event handlers like onclick, but not URLs loaded directly into &lt;script&gt; elements.'
  },
  'style-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
    note: 'controls from where styles get applied to a document. This includes <link> elements, @import rules, and requests originating from a Link HTTP response header field: <b>style-src-elem</b>, <b>style-src-attr</b>'
  },
  'style-src-elem': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
    note: 'specifies valid sources for stylesheets &lt;style&gt; elements and &lt;link&gt; elements with rel="stylesheet".'
  },
  'style-src-attr': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
    note: 'specifies valid sources for inline styles applied to individual DOM elements.'
  },
  'base-uri': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/base-uri',
    note: 'specifies the possible URLs that the &lt;base&gt; element can use.'
  },
  'plugin-types': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/plugin-types',
    note: 'limits the types of resources that can be loaded into the document (e.g. application/pdf). 3 rules apply to the affected elements, &lt;embed&gt; and &lt;object&gt;',
    deprecated: true
  },
  'sandbox': {
    level: '1.1/2',
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox',
    note: 'specifies the possible URLs that the &lt;base&gt; element can use.'
  },
  'navigate-to': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/navigate-to',
    note: 'restricts the URLs which a document can navigate to by any mean (not yet supported by modern browsers in Jan 2021).'
  },
  'form-action': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/form-action',
    note: 'restricts the URLs which the forms can submit to.'
  },
  'frame-ancestors': {
    level: 2,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors',
    note: 'restricts the URLs that can embed the requested resource inside of &lt;frame&gt;, &lt;iframe&gt;, &lt;object&gt;, &lt;embed&gt;, or &lt;applet&gt; elements.'
  },
  'frame-src': {
    level: 1,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-src',
    note: 'specifies valid sources for nested browsing contexts loading using elements such as &lt;frame&gt; and &lt;iframe&gt;.'
  },
  'worker-src': {
    level: 3,
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src',
    note: 'specifies valid sources for Worker, SharedWorker, or ServiceWorker scripts.'
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
const policy = {
  'none'  : 'Won\'t allow loading of any resources.',
  'blob:' : 'Raw data that isn\'t necessarily in a JavaScript-native format.',
  'data:' : 'Only allow resources from the data scheme (ie: Base64 encoded images).',
  "'self'": 'Only allow resources from the current origin.',
  "'unsafe-inline'": '',
}

module.exports = {
  cspArr,
  cspInfo,
  cspFetch,
  cspEAttr,
  policy,
}