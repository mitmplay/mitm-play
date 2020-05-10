mitm.route = {
  cache: {
    '.js$': { ext: '' }
  },
  patch: {
    'www.google.com/search': {
      js: function() {
        setTimeout(() => {
          document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
          document.querySelectorAll('.g-blk').forEach(n=>n.remove())            
        }, 1000);
      }
    }
  }
};

module.exports = (url, typ) => {
  const nod = mitm.route[typ];
  for (let key in nod) {
    const arr = url.match(key);
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
