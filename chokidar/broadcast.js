module.exports = function(typ) {
  return global._debounce(function() {
    const serial = JSON.stringify({
      data:true,
      typ, 
    });
    global.broadcast({data: `_files${serial}`});
  }, 1000, typ);
}
