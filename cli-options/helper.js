const c = require('ansi-colors');

module.exports = (_package) => {
  console.log(c.greenBright(
  `
  Usage: mitm-play <profl> [options]
  
  Options:
    -h --help     \t show this help
    -u --url      \t go to specific url
    -g --group    \t create cache group/rec
    -d --delete   \t clear/delete logs or cache
    -i --insecure \t set nodejs env to accept insecure cert
    -p --pristine \t pristine browser, not recommended to use
    -n --nosocket \t no websocket injection to html page
    -z --lazylog  \t debounce save after millsec invoked
    -b --browser  \t browser: chromium/firefox/webkit
    -l --logurl   \t test route to log url & headers
    -r --route    \t set userscript folder of routes
    -s --save     \t save as default <profl>
    --proxypac    \t set chromium proxypac 
    --chromium    \t browser = chromium
    --firefox     \t browser = firefox
    --webkit      \t browser = webkit
    --proxy       \t a proxy request

  v${_package.version}
`));
process.exit();
}
