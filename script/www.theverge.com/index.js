const {route, fn: {resp}} = global.mitm;

delete route.js['www.theverge.com'];
route.js = {
  'www.theverge.com': {resp},
  ...route.js,
}

console.log(JSON.stringify(route, null, 2));