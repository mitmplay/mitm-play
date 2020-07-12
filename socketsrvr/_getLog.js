module.exports = () =>{ 
  const {files:{_log, log}} = global.mitm;
  let data = {};
  log.forEach(element => {
    const [path, title] = element.split('@');
    data[element] = {
      ..._log[element],
      title,
      path,
    }
  })
  return data;
};
