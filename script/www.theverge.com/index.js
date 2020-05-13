const {route, fn: {resp}} = global.mitm;

route.js['www.theverge.com'] = {resp};

console.log(JSON.stringify(route, null, 2));