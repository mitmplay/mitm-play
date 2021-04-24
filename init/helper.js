const c = require('ansi-colors')

module.exports = (_package) => {
  console.log(c.greenBright(
  `
  Usage: mitm-play [args] [options]
  
  args:
    1st for searching url/urls
    2nd for loading profile

  options:
    -h --help     \t show this help
    -u --url      \t go to specific url
    -s --save     \t save as default <profl>
    -r --route    \t userscript folder routes
    -a --activity \t rec/replay cache activity*
    -c --clear    \t clear/delete cache & log(s)
    -d --device   \t resize to mobile screen device
    -f --fullog   \t show detail logs on each rule* 
    -p --pristine \t pristine browser, default option
    -i --insecure \t accept insecure cert in nodejs env 
    -n --nosocket \t no websocket injection to html page*
    -k --cookie   \t reset cookies expire date*
    -l --lazylog  \t delay ~500ms print console.log
    -g --group    \t create cache group/rec
    -t --incognito\t set chromium incognito
    -x --proxy    \t a proxy request
    -z --lazyclick\t delay ~700ms click action*

    -C --csp      \t relax CSP, unblock websocket*
    -D --debug    \t show ws messages
    -G --nogpu    \t set chromium without GPU
    -H --nohost   \t set logs without host name*
    -R --redirect \t set redirection: true/false/manual
    -U --nourl    \t set logs without URL*
    -V --verbose  \t show more detail of console log
    -X --proxypac \t set chromium proxypac

    -C --chromium \t run chromium browser
    -F --firefox  \t run firefox browser
    -W --webkit   \t run webkit browser

  * _global_.config.args

  v${_package.version}
`))
  process.exit()
}
