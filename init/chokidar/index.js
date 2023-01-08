const {c} = global.mitm.lib

console.log(c.red('[init/chokidar/*.js]'))
require('./profile')() // file watcher for profile // feat: profile
require('./macros')() // file watcher for macros
require('./route')() // file watcher for routes
require('./logs')() // file watcher for logs
require('./md')() // file watcher for md
// require('./chokidar/cache')(); // file watcher for cache
