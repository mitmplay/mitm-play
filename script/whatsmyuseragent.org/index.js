const {routes, fn: {resp}} = global.mitm;

routes.js['whatsmyuseragent.org'] = {resp};

console.log(stringify(routeSet(routes)));