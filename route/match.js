const googlJS = function() {
  document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
  document.querySelectorAll('.obcontainer').forEach(n=>n.remove())
  document.querySelectorAll('.g-blk').forEach(n=>n.remove())
}

mitm.route = {
  cache: {
    'application/x-ww': { ext: '.json' }
  },
  logs: {
    'application/json': { ext: '.json' },
  },
  mock: {},
  html: {
    'www.google.com/search': {
      resp(resp){
        return {...resp, status: 201};
      },
      el: 'e_end', //or e_head
      js: googlJS,
    }
  },
  json: {
    'api.twitter.com': {   
      resp(resp){
        return {...resp, status: 201};
      },    
    }
  },
  js: {},
};
//https://twitter.com/search?q=covid&src=typed_query
module.exports = (typ, {url, headers}) => {
  const nod = mitm.route[typ];
  let arr;

  for (let key in nod) {
    if (typ==='logs' || typ==='cache') {
      arr = (headers['content-type']+'').match(key);
    } else {    
      arr = url.match(key);
    }
    if (arr && nod[key]) {
      return {
        rt: nod[key],
        arr,
        url,
        nod,
        key,
      }
    }   
  }
}
