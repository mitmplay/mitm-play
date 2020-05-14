// need code like this to 
// preseve indentation
const {
  headerCSP,
  twitterJS,
} = {
headerCSP: function({headers}) {
  delete headers['content-security-policy'];
  // let b = headers['content-security-policy'][0];
  // b = b.replace(/'unsafe-inline'/g, '').replace(/'self'/g, '')
  // headers['content-security-policy'] = b;
  return {headers};
},
twitterJS: function() {
  document.addEventListener('DOMContentLoaded', (event) => {
    setTimeout(() => {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
        registration.unregister()
      }});
      console.log('unregister service worker')
    }, 1000)
  })
}
};

const {
  resp, 
  routeSet,
  stringify,
} = global.mitm.fn;

const routes = {
  html: {
    'twimg.com': {resp},
    'twitter.com': {
      resp: headerCSP,
      el: 'e_head',
      js: [twitterJS],
      src:['unregister.js'],
    },
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

console.log(stringify(routeSet(routes)));
