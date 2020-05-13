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

const routes = {
  // cache: {
  //   // 'application/x-ww': { ext: '.json' }
  // },
  // logs: {
  //   // 'application/json': { ext: '.json' },
  // },
  skip: {
    '.(jpeg|jpg|png|svg|ico|mp4)': {},
  },
  mock: {
    '/mock': {
      resp() {
        return {body: 'Hi there!'}
      }
    },
  },
  html: {
    // 'twimg.com': {resp},
    // 'twitter.com': {resp},
    'www.google.com/search': {
      // resp,
      el: 'e_end', //or e_head
      js: [googlJS, helloMitm], //JS is injected at the end of html body
    },
  },
  // json: {
  //   'twimg.com': {resp},
  //   'api.twitter.com': {resp}
  // },
  // css:  {'twimg.com': {resp}},
  js:   {'.js$': {resp}},
  fn: {},
};

module.exports = () => {
  global.mitm.fn.resp = resp;
  global.mitm.routes = routes;
  //https://twitter.com/search?q=covid&src=typed_query  
};
