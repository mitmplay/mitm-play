const {route, fn: {resp}} = global.mitm;

route.js['whatsmyuseragent.org'] = {resp};

console.log(JSON.stringify(route, null, 2));