const {
  routeSet,
} = global.mitm.fn;

const domain =  __dirname.split(/\\|\//).pop();

const css = `
[data-css='c-advertisement'] {
  display: none !important;
}`

routes = {
  // exclude: ['google'],
  // cache: {
  //   '.*': {}
  // },
  // log: {
  //   '.js$': {} 
  // },
  html: {
    'facebook.com': '',
  },
  js: {
    'imrworldwide.com': '',
    'doubleclick.net': '',
    'facebook.com': '',
    'outbrain.com': '',
    'addthis.com': '',
    'twitter.com': '',
    'cxense.com': '',
    'demdex.net': '',
  },
  css: {
    'styles.css': `=>${css}`
  },  
}

const ns = routeSet(routes, domain, true)
