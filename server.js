// const expr = require('./express')();
const cliOptions = require('./cli-options');
const playwright = require('./playwright');
const socketsrvr = require('./socketsrvr');

cliOptions();
playwright();
socketsrvr();

// expr.listen(port, function() {
//   console.log(`app listening at http://localhost:${port}`)
// })
