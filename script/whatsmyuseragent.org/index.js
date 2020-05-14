const {
  resp,
  routeSet,
  stringify,
} = global.mitm.fn;

routes = {
  js: {
    'whatsmyuseragent.org': {resp},
  }
}

console.log(stringify(routeSet(routes)));
