const {
  resp, 
  routeSet,
} = global.mitm.fn;

const routes = {
  html: {
    'twimg.com': {resp},
    'twitter.com': {resp},
  },
  js:   {
    'twitter.com': {resp},
  },
  json: {
    'twimg.com': {resp},
    'api.twitter.com': {resp}
  },
  css:  {'twimg.com': {resp}},
}

const r = routeSet(routes);
console.log(JSON.stringify(r, null, 2));
