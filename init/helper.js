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
    -k --cookie   \t reset cookies expire date
    -g --group    \t create cache group/rec
    -t --incognito\t set chromium incognito
    -x --proxy    \t a proxy request
    -z --lazy     \t delay ~400ms click action

    -D --debug    \t show ws messages
    -O --ommitlog \t removed unnecessary console log
    -P --plugins  \t add chrome plugins
    -R --rediret  \t set redirection: true/false/manual
    -V --verbose  \t show more detail of console log
    -X --proxypac \t set chromium proxypac

    -C --chromium \t run chromium browser
    -F --firefox  \t run firefox browser
    -W --webkit   \t run webkit browser

  v${_package.version}
`));
process.exit();
}
