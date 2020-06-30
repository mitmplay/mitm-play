const c = require('ansi-colors');

module.exports = (_package) => {
  console.log(c.greenBright(
  `
  Usage: mitm-play <profl> [options]
  
  Options:
    -h --help     \t show this help
    -u --url      \t go to specific url
    -s --save     \t save as default <profl>
    -r --route    \t userscript folder routes
    -d --delete   \t delete/clear cache & logs
    -p --pristine \t pristine browser, default option
    -i --insecure \t accept insecure cert in nodejs env 
    -n --nosocket \t no websocket injection to html page
    -o --ommitlog \t removed unnecessary console log
    -v --verbose  \t show more detail of console log
    -k --cookie   \t reset cookies expire date
    -g --group    \t create cache group/rec
    -c --chromium \t run chromium browser
    -f --firefox  \t run firefox browser
    -w --webkit   \t run webkit browser
    -x --proxy    \t a proxy request
    -z --lazy     \t delay ~400ms click action
    --incognito   \t set chromium incognito
    --proxypac    \t set chromium proxypac
    --plugins     \t add chrome plugins
    --debug       \t show ws messages

  v${_package.version}
`));
process.exit();
}
