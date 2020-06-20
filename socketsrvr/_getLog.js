module.exports = () =>{ 
  let data = {};
  global.mitm.files.log.forEach(element => {
    const [path, title] = element.split('@');
    data[element] = {
      title,
      path,
    }
  })
  return data;
};
