const googlJS = function() {
  // remove unecessary html elements from google search result
  document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
  document.querySelectorAll('.obcontainer').forEach(n=>n.remove())
  document.querySelectorAll('.g-blk').forEach(n=>n.remove())
};

const helloMitm = function() {
  console.log('Hello from mimt-play');
}

const resp = function(){
  return {};
};

function routeSet(routes2) {
  const {routes} = global.mitm;

  for (let typ in routes2) {
    if (routes[typ]) {
      for (let key in routes2[typ]) {
        if (routes[typ][key]) {
          delete routes[typ][key];
        }
      }
      routes[typ] = {
        ...routes[typ],
        ...routes2[typ],
      }
    } else {
      routes[typ] = routes2;
    }
  }
  return routes;
}

const routes = {
  // cache: {
  //   // 'application/x-ww': { ext: '.json' }
  // },
  // logs: {
  //   // 'application/json': { ext: '.json' },
  // },
  skip: {
    '.(jpeg|jpg|png|svg|gif|ico|mp4)': {},
  },
  mock: {
    '/mock': {
      resp() {
        return {body: 'Hi there!'}
      }
    },
  },
  html: {
    'www.google.com/search': {
      // resp,
      el: 'e_end', //or e_head
      js: [googlJS, helloMitm], //JS is injected at the end of html body
    },
  },
  js:   {'.js$': {resp}},
  fn: {},
};

module.exports = () => {
  global.mitm.routes = routes;
  global.mitm.fn.resp = resp;
  global.mitm.fn.routeSet = routeSet;
  //https://twitter.com/search?q=covid&src=typed_query  
};
