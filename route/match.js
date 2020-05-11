const js = function() {
  document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
  document.querySelectorAll('.obcontainer').forEach(n=>n.remove())
  document.querySelectorAll('.g-blk').forEach(n=>n.remove())
}

mitm.route = {
  cache: {
    '.js$': { ext: '' }
  },
  patch: {
    'www.google.com/search': {
      el: 'e_end', //e_head, e_end
      js,
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
