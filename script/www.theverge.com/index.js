const {resp} = global.mitm.fn;

routes = {
  js: {
    'www.theverge.com': {resp},
  }
}

console.log(stringify(routeSet(routes)));
