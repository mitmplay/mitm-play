const {c} = global.mitm.lib

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
    -b --basic    \t login to http authentication
    -c --clear    \t clear/delete cache & log(s)
    -d --devtools \t show chrome devtools on start
    -e --device   \t resize to mobile screen device
    -f --fullog   \t show detail logs on each rule*
    -i --insecure \t accept insecure cert in nodejs env
    -j --jformat  \t JSON save as human readable format
    -n --nosocket \t no websocket injection to html page*
    -o --offline  \t console log withount new-line
    -k --cookie   \t reset cookies expire date*
    -l --light    \t unset devtools dark mode
    -g --group    \t create cache group/rec
    -p --csp      \t relax CSP, unblock websocket*
    -t --incognito\t set chromium incognito
    -w --worker   \t enable service worker
    -x --proxy    \t a proxy request
    -z --lazyclick\t delay ~700ms click action*

    -D --debug    \t show Playwright debugger
    -G --nogpu    \t set chromium without GPU
    -H --nohost   \t set logs without host name*
    -L --showsql  \t show sqlite generated commands
    -R --redirect \t set redirection: true/false/manual
    -Q --nosql    \t disabling persist data using sqlite
    -S --session  \t sqlite session from requst header
    -U --nourl    \t set logs without URL*
    -V --verbose  \t show more detail of console log
    -X --proxypac \t set chromium proxypac

    -C --chromium \t run chromium browser
    -F --firefox  \t run firefox browser
    -W --webkit   \t run webkit browser

  * _global_.config.args

  v${_package.version}
`))
}
