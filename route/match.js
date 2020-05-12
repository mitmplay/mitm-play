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

mitm.route = {
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
  // js:   {'twimg.com': {resp}},
};
//https://twitter.com/search?q=covid&src=typed_query

module.exports = (typ, {url, headers}) => {
  const nod = mitm.route[typ];
  let arr;
  let log;

  for (let key in nod) {
    if (typ==='logs' || typ==='cache') {
      log = `>> ${typ} (${headers['content-type']}).match(${key})`;
      arr = (headers['content-type']+'').match(key);
    } else {    
      log = `>> ${typ} (${url.split('?')[0]}).match(${key})`;
      arr = url.match(key);
    }
    if (arr && nod[key]) {
      return {
        rt: nod[key],
        arr,
        url,
        nod,
        key,
        log,
      }
    }
  }
}
