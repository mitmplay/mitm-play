const {
  resp,
  routeSet,
} = global.mitm.fn;

routes = {
  exclude: ['google'],
  cache: {
    '.*': {}
  },
  log: {
    '.js$': {} 
  },
  js: {
    'whatsmyuseragent.org': {resp},
    'googleapis.com': {resp},
  }
}

const ns = routeSet(routes, 'whatsmyuseragent.org', true)
 