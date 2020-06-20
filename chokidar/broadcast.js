module.exports = function(msgId, typ) {
  return global._debounce(function() {
    let data = {};
    global.mitm.files[typ].forEach(element => {
      const [path, title] = element.split('@');
      data[element] = {
        title,
        path,
      }
    })    
    data = `${msgId}${JSON.stringify({typ, data})}`
    global.broadcast({data});
  }, 1000);    
}