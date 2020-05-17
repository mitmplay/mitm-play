const {
  resp,
  routeSet,
} = global.mitm.fn;

routes = {
  //exclude: ['googleapis.com'],
  cache: {
    '.js$': {}
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
 