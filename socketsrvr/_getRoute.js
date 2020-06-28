module.exports = () =>{ 
  let data = {};
  for (let domain in global.mitm.routes) {
    const title = domain;
    const {path} = global.mitm.routes[domain];
    const content = global.mitm.source[domain];
    data[domain] = {
      path,
      title,
      content,
    }  
  }
  return data;
};
