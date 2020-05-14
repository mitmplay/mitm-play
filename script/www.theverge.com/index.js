const {routes, fn: {resp}} = global.mitm;

delete routes.js['www.theverge.com'];
routes.js = {
  'www.theverge.com': {resp},
  ...routes.js,
}

console.log(stringify(routeSet(routes)));