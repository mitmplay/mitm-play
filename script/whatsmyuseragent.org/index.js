const {routes, fn: {resp}} = global.mitm;

routes.js['whatsmyuseragent.org'] = {resp};

console.log(JSON.stringify(routes, null, 2));