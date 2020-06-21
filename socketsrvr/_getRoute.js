module.exports = () =>{ 
  let data = {};
  for (let k in global.mitm.routes) {
    const title = k;
    const r = global.mitm.routes[k];
    const content = global.mitm.fn.stringify(r);
    data[k] = {
      title,
      content,
    }
  }
  return data;
};
