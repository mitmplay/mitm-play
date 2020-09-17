module.exports = () =>{ 
  const {
    __tag1,
    __tag2,
    __tag3,
    __tag4,
  } = global.mitm; 
  let data = {_tags_: {
    __tag1,
    __tag2,
    __tag3,
    __tag4,
  }};
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
