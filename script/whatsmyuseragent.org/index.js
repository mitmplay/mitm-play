const {
  resp,
  routeSet,
} = global.mitm.fn;

routes = {
  js: {
    'whatsmyuseragent.org': {resp},
    'googleapis.com': {resp},
  }
}

const ns = routeSet(routes, 'whatsmyuseragent.org', true)
