module.exports = () =>{ 
  let data = {};
  for (let k in global.mitm.routes) {
    if (k!=='default') {
      const title = k;
      const {path} = global.mitm.routes[k];
      const content = global.mitm.source[k];
      data[k] = {
        path,
        title,
        content,
      }  
    }
  }
  return data;
};
