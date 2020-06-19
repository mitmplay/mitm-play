module.exports = function(msgId, typ) {
  return global._debounce(function() {
    let data = global.mitm.files[typ];
    data = `${msgId}${JSON.stringify({typ, data})}`
    global.broadcast({data});
  }, 1000);    
}