const twitterJS = function() {
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

const {
  resp, 
  routeSet,
} = global.mitm.fn;

const routes = {
  html: {
    'twimg.com': {resp},
    'twitter.com': {
      resp({headers}) {
        delete headers['content-security-policy'];
        // let b = headers['content-security-policy'][0];
        // b = b.replace(/'unsafe-inline'/g, '').replace(/'self'/g, '')
        // headers['content-security-policy'] = b;
        return {headers};
      },
      el: 'e_head',
      js: [twitterJS],
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

const r = routeSet(routes);
console.log(JSON.stringify(r, null, 2));
