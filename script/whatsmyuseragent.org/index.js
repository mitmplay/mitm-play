const {resp} = global.mitm.fn;

routes = {
  js: {
    'whatsmyuseragent.org': {resp},
  }
}

console.log(stringify(routeSet(routes)));
