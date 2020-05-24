const domain =  __dirname.split(/\\|\//).pop();

routes = {
  title: 'My User Agent - whatsmyuseragent',
  url: 'http://whatsmyuseragent.org/',
  exclude: ['google'],
  cache: {'.js$': {}},
}
global.mitm.fn.routeSet(routes, domain, true)
