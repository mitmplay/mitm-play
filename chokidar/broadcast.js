module.exports = function(typ) {
  return function() {
    const serial = JSON.stringify({
      data:true,
      typ, 
    });
    if (global.mitm.argv.debug) {
      console.log(`(*broadcast ${typ}*)`)
    }
    global.broadcast({data: `_files${serial}`});
  }
}
