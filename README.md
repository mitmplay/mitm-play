# mitm-play
### Man in the middle using playwright

<details><summary><b>mitm-play in action</b></summary>
<p>

![mitm-play](https://raw.githubusercontent.com/mitm-proxy/user-route/master/docs/mitm-proxy.gif)
</p>
</details>

   * [Installation](#installation)
   * [Features](#features)
   * [Concept](#concept)
   * [Profile: ~/.mitm-play](#profile-mitm-play)
   * [Route Sections](#route-sections)
   * [\_global\_ Route](#_global_-route)
   * [HTTP_PROXY](#http_proxy)
   * [CLI Options](#cli-options)
   * [Macros](#macros)
   * [Macro Keys](#macro-keys)
   * [User Route](#user-route)
   * [Use Cases](#use-cases)
   * [Early Stage](#early-stage)

# Installation
```bash
npm install -g mitm-play
```
<details><summary>Example</summary>
<p>

```js
// create new folder/file: google.com/index.js and add this content:
const googlJS = function() {
  document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
  document.querySelectorAll('.obcontainer').forEach(n=>n.remove())
  document.querySelectorAll('.g-blk').forEach(n=>n.remove())
};

const {hello} = global.mitm.fn;

const route = {
  title: 'Search - google',
  url: 'https://google.com/search?q=github+playwright',
  html: {
    'www.google.com/search': {
      el: 'e_end', 
      js: [googlJS, hello], //JS will be placed at end of html body
    },
  }, //all js from gstatic.com will be replace with an empty response
  js: {'gstatic.com': ''} 
}
module.exports = route;
```

```bash
# run the demo:
mitm-play --url='google.com/search?q=covid-19' --delete --save --route='.'
mitm-play -u='google.com/search?q=covid-19' --dsr='.'

# next run should be simple as:
mitm-play
```
</p>
</details>

# Features

| Feature     | payload      | note
|-------------|--------------|----------------------------------------
| `screenshot`| ----------   | DOM specific rules for taking screenshot
| `skip`      | ----------   | array ..of `[domain]` - browser will handle it
| `proxy`     | ----------   | array ..of `[domain]` - will serve using proxy
| `noproxy`   | ----------   | array ..of `[domain]` - will serve directly
| `request`   | __request__  | modify request object - call to remote server
| `mock`      | __response__ | modify response object - no call to remote server
| `cache`     | __response__ | save first remote call to local - next, read from cache
| `log`       | __response__ | save reqs/resp call to local - call to remote server
|             | __response__ | modify response based on contentType - call remote server
| =>>         | * `html`     | - response handler (replace / update + JS)
| =>>         | * `json`     | - response handler (replace / update)
| =>>         | * `css`      | - response handler (replace / update)
| =>>         | * `js`       | - response handler (replace / update)
| `response`  | __response__ | modify response object - call to remote server

# Concept
Mitm intercept is hierarchical checking routes. First check is try to `match` domain on the url, `if match` then next action is to `match` url regex expression on each **type/content-type** listed on the route and `if match` again, then it will execute the handler route event registered in the route.

If the process of checking is not match, then it will fallback to `_global_` namespace to check, and the operation is the same as mention in first paragraph. 

Usually html page load with several assets (image, js & css) that not belong to the same domain, and to match those type of assets, it use browser headers attributes: `origin` or `referer`, in which will scoping to the same namespace.

<details><summary>Example</summary>
<p>

In below example the route is having a `js` object and the process of checking narrated as: 

>  when user access url that having `google.com` and having subsequent request from `gstatic.com`, if there is a JS assets, then the response will get replace with an empty string.

Namespaces: `_global_`, `google.com` on nodejs global scope:
```js
global.mitm.route = {
  '_global_': {
    mock: {...}
  },
  'google.com': {
    html: {
      'www.google.com/search': {
        el: 'e_end', // JS at end of 
        js: [googlJS, hello], // html body
      },
    },
    js: {
      'gstatic.com': ''
    }
  },
}
```
</p>
</details>

# Profile: ~/.mitm-play
By default all save file are on the `~/.mitm-play` profile folder.

# Route Sections
on each route you can add section supported:

<details><summary>Skeleton</summary>
<p>

```js
routes = {
  url:     '',
  urls:    {},
  title:   '',
  workspace: '',
  screenshot: {}, //user interaction rules & observe DOM-Element
  skip:    [], //start routing rules
  proxy:   [], //request with proxy
  noproxy: [], 
  nosocket:[],
  request: {},
  mock:    {}, 
  cache:   {},
  log:     {},
  html:    {},
  json:    {},
  css:     {},
  js:      {},
  response:{}, //end routing rules
}
```
</p>
</details>
<p>
the execution order as documented start with `skip`, end with `js`, no need to implement all of routing rules. 
</p>

<details><summary><b>Title, url, urls, workspace & jsLib</b></summary>
<p>

`Title`: provide basic information about this route.

`Url`: when user enter cli with first param as `non dashes`, it will try to find it in **`url`**, if match it will open the browser with that **`url`**.

`Urls`: additional search for object key inside urls, this open up to much more option to open more than one tabs.

`workspace`: will be use as the base folder for `file` option in `Mock`.

`lib`: add js library to all html on the namespace, options can be ['**jquery.js**', '**faker.js**', '**chance.js**']

```js
routes = {
  title: 'Amazon - amazon',
  url:  'https://www.amazon.com/b?node=229189',
  urls: {
    ama1: 'https://www.amazon.com/b?node=229100',
    ama2: 'https://www.amazon.com/b?node=229111',
  },
  workspace: '~/Projects',
  jsLib: ['chance.js'],
};
// mitm-play ama -dpsr='.' -> search: 'ama' in url and go to the website
```
</p>
</details>
<details><summary><b>Screenshot</b></summary>
<p>

Capture/Screeshot when user *click* specific DOM-Element *match* with `selector` or state-change, like DOM-Element getting *insert* or *remove* and match **selector** inside `observer` key.

Below example show three selector in `observer`:
*  *'.field.error'* -> **filename**: field-error -> **state**: `insert` or `remove`
*  *'.input.focus'* -> **filename**: input -> **state**: `insert` or `remove`
*  *'.panel.error'* -> **filename**: panel-error -> **state**: `insert`

Caveat: `observer` is an *experimental feature*, take it as a grain salt, expectation of selector should be like toggling and it need a unique match to the DOM-Element, *please do test on chrome-devtools before reporting a bug*.

Caveat 2: this `Screenshot` rule(s), required successful injection of websocket client to html document, if it not success (error can be seen on chrome dev-tools),might be *content-security-policy* restriction. 

Caveat 3: process screenshot sometime take times and for SPA, transition between page usually instantly and it lead to capturing next page, even if the trigger come from button in previouse page, there is a CLI option: -z/--lazy to delay click action for about ~400ms 
```js
screenshot: {
  selector: '[type=button],[type=submit],button,a', //click event
  observer: {
    /***
     * selector must be uniq, represent not in the dom 
     * state change couse element tobe insert or remove,
     * or can be just class change 
    */
    '.field.error': 'field-error:insert,remove',
    '.input.focus': 'input:insert,remove',
    '.panel.error': 'panel-error:insert',
  },
  at: 'sshot', //'^sshot' part of log filename
},
```
`at` is a partion of filename and having a simple rule attach on it. Guess what is it?.
</p>
</details>
<details><summary><b>Skip</b></summary>
<p>

Skipping back **`url`** to the browser if partion of **`url`** match text in array of `skip` section, `mitm-play` will not process further.
```js
skip: ['wp-admin'],
```
</p>
</details>
<details><summary><b>Proxy</b></summary>
<p>

Certain domain will go thru proxy
```js
// HTTP_PROXY env need to be set, cli: --proxy ..
proxy: [
  'google-analytics.com',
],
```
</p>
</details>
<details><summary><b>Noproxy</b></summary>
<p>

if proxy config was set to all request/response, `noproxy` will exclude it from proxy. Example below will set domain nytimes.com with direct access and the rest will go thru proxy. 
```js
// HTTP_PROXY env need to be set, cli: --proxy .. --noproxy ..
noproxy: ['nytimes.com'],
proxy:   ['.+'],
```
</p>
</details>
<details><summary><b>Nosocket</b></summary>
<p>

No `WebSocket` Injection to **`html`**, `mitm-play` will process further.
```js
nosocket: ['sso'],
```
</p>
</details>
<details><summary><b>Request</b></summary>
<p>

Manipulate **request** with `request` function
```js
request: {
  'disqus.com/embed/comments/': {
    request({url, method, headers, body, browserName}) {
      return {}
    }
  }
},
```
</p>
</details>
<details><summary><b>Mock</b></summary>
<p>

Mocking the **response**.

Basic rule:

Replace **response body** with **the matcher** value 
```js
mock: {'2mdn.net': ''},
```

Manipulate **response** with `response` *function*
```js
mock: {
  'mitm-play/twitter.js': {
    response({status, headers, body}) {
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```
Replace **response body** from `file`, if `workspace` exists, it will be use as base path (ie: `${workspace}/${file}`)
```js
mock: {
  'mitm-play/twitter.js': {
    file: 'relative/to/workspace/file.html', // --OR--
    // file: '../relative/to/route/folder/file.html',
    // file: './relative/to/route/folder/file.html',
    // file: '~/relative/to/home/folder/file.html',
  },
},
```
Concatenation of JS code `js` at the end of **the mock body**
```js
const unregisterJS = () => {
  ...
  console.log('unregister service worker')
};

mock: {
  'mitm-play/twitter.js': {
    js: [unregisterJS],
  },
},
```
If both options are defined: `response`, `js`, `js` will be ignored.
</p>
</details>
<details><summary><b>Cache</b></summary>
<p>

Save the first request to your local disk so next request will serve from there.
```js
cache: {
  'amazon.com': {
    contentType: ['javascript', 'image'], //required!
    querystring: true, // hash of unique file-cache
    session: true, // optional - set session id
    hidden: true, // optional - no consolo.log
    nolog: true, // optional - disable logging
    at: 'mycache', // 'mycache' part of cache filename
  }
},
```
`cache` support `response` function, it means the result can be manipulate first before send to the browser.
```js
cache: {
  'amazon.com': {
    contentType: ['json'], //required! 
    response({status, headers, body}) {
      return {body} //can be {} or combination of {status, headers, body}
    },    
  }
},
```
</p>
</details>
<details><summary><b>Log</b></summary>
<p>

Save the response to your local disk. by default contentType `json` will log complete request / response, for different type default log should be response payload. 

Special usacase like google-analytic will send contentType of `gif` with [GET] request, and response payload is not needed, there is an option `log` to force log with json complete request / response.  
```js
log: {
  'amazon.com': {
    contentType: ['json'],
    at: 'myjson', // 'myjson' part of log filename
  },
  'google-analytics.com/collect': {
    contentType: ['gif'],
    log: true, //'<remove>'
  }
},
```
`log` support `response` function, it means the result can be manipulate first before send to the browser.
```js
log: {
  'amazon.com': {
    contentType: ['json'], //required! 
    response({status, headers, body}) {
      return {body} //can be {} or combination of {status, headers, body}
    },    
  }
},
```
</p>
</details>
<details><summary><b>Html</b></summary>
<p>

Manipulate the response.

Basic rule: 

Replace **response body** with **the matcher** value 
```js
html: {'twitter.net': ''},
```

Manipulate **response** with `response` *function*
```js
html: {
  'twitter.com/home': {
    response({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
    hidden: true, // optional - no consolo.log
  },
},
```
Insert `js` script element into specific area in html document
```js
html: {
  'www.google.com/search': {
    el: 'e_end', // JS at end of 
    js: [googlJS, hello], // html body
  },
},
```
</p>
</details>
<details><summary><b>Json</b></summary>
<p>

Manipulate the response.

Basic rule: 

Replace **response body** with **the matcher** value 
```js
json: {'twitter.net': '{}'},
```

Manipulate **response** with `response` *function*
```js
json: {
  'twitter.com/home': {
    response({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```
</p>
</details>
<details><summary><b>Css</b></summary>
<p>

Manipulate the response.

Basic rule: 

Replace **response body** with **the matcher** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const style = 'body: {color: red}';
...
css: {'twitter.net': style}, //or `=>${style}`
```

Manipulate **response** with `response` *function*
```js
css: {
  'twitter.com/home': {
    response({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```
</p>
</details>
<details><summary><b>Js</b></summary>
<p>

Manipulate the response.

Basic rule: 

Replace **response body** with **the matcher** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const code = 'alert(0);'
...
js: {'twitter.net': code}, //or `=>${code}`
```

Manipulate **response** with ~~`response`~~ *function*
```js
js: {
  'twitter.com/home': {
    response({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```
</p>
</details>
<details><summary><b>Response</b></summary>
<p>

Manipulate **response** with `response` function
```js
response: {
  '.+': {
    request({status, headers, body}) {
      headers['new-header'] = 'with some value';
      return {headers};
    }
  }
},
```
</p>
</details>

# \_global\_ Route
A special route to handle global scope (without namespace) and serving as a common config. 

The default `config.logs` setting can be override as needed.
<details><summary><b>Common route rules</b></summary>
<p>

```js
_global_ = {
  jsLib:   [],
  skip:    [], //start routing rules
  proxy:   [], //request with proxy
  noproxy: [], 
  nosocket:[],
  request: {},
  mock:    {}, 
  cache:   {},
  log:     {},
  html:    {},
  json:    {},
  css:     {},
  js:      {},
  response:{}, //end routing rules
  config:  {}, //see Default config below
}
```
</p>
</details>
<details><summary><b>Default config</b></summary>
<p>

```js
// toggle to show/hide from console.log()
_global_.config = {
  logs: {
    'no-namespace':  true,
    'not-handle':    true,
    'ws-receive':    true,
    'ws-broadcast':  true,
    silent: false, //true: hide all
    skip:   false,
    nosocket:true,
    request: true,
    mock:    true,
    cache:   true,
    log:     true,
    html:    true,
    json:    true,
    css:     true,
    js:      true,
    response:true,
  }
}
```
</p>
</details>

# HTTP_PROXY
mitm-play support env variable **HTTP_PROXY** and **NO_PROXY** if your system required proxy to access internet. Please check on `CLI Options > -x --proxy` section for detail explanation. 

# CLI Options
when entering CLI commands, `mitm-play`  support two kind of arguments: 

<details><summary><b>Expand...</b></summary>
<p>

* `args`: is a **word** without `-` 
  * **1st** for searching url/urls
  * **2nd** for loading profile
* `options`: can be -`<char>` or --`<word>`
```bash
# syntax
$ mitm-play [args] [-options]

# create 'secure' profile w/ -s option
$ mitm-play yahoo --lazy --incognito -s='secure'

# retrive 'secure' profile, search yahoo & add -k option 
$ mitm-play yahoo secure -k

```

</p>
</details>

<details><summary><b>-h --help</b></summary>
<p>
To show all the options Command Line Interface (CLI). this option can be arbitrary position on cli, the result should be always display this messages:

```
$ mitm-play -h  <OR>
$ mitm-play --help

  Usage: mitm-play <profl> [options]

  Options:
    -h --help            show this help
    -u --url             go to specific url
    -s --save            save as default <profl>
    -r --route           userscript folder routes
    -d --delete          delete/clear cache & logs
    -p --pristine        pristine browser, default option
    -i --insecure        accept insecure cert in nodejs env
    -n --nosocket        no websocket injection to html page
    -k --cookie          reset cookies expire date
    -g --group           create cache group/rec
    -t --incognito       set chromium incognito
    -x --proxy           a proxy request
    -z --lazy            delay ~400ms click action

    -D --debug           show ws messages
    -O --ommitlog        removed unnecessary console log
    -P --plugins         add chrome plugins
    -R --rediret         set redirection: true/false/manual
    -V --verbose         show more detail of console log
    -X --proxypac        set chromium proxypac

    -C --chromium        run chromium browser
    -F --firefox         run firefox browser
    -W --webkit          run webkit browser

  v0.7.xx
```
</p>
</details>
<details><summary><b>-u --url</b></summary>
<p>

Open Browser to specific `URL`

```
$ mitm-play -u='https://google.com'  <OR>
$ mitm-play --url='https://google.com'
```
</p>
</details>
<details><summary><b>-s --save</b></summary>
<p>

Save CLI options with `default`  or named so later time you don't need to type long CLI options

```
$ mitm-play -s  <OR>
$ mitm-play --save
  <OR>
$ mitm-play -s='google'  <OR>
$ mitm-play --save='google'
```
</p>
</details>
<details><summary><b>-r --route</b></summary>
<p>

Specify which folder contains routes config

```
$ mitm-play -r='../userroutes'  <OR>
$ mitm-play --route='../userroutes'
```
</p>
</details>
<details><summary><b>-c --relaxcsp</b></summary>
<p>

Update CSP header on Html Page injected with websocket.js to unblock Websocket communication

```
$ mitm-play -c  <OR>
$ mitm-play --relaxcsp
```
</p>
</details>
<details><summary><b>-d --delete</b></summary>
<p>

Delete logs or cache, can be all or specific one

```
$ mitm-play -d  <OR>
$ mitm-play --delete
  <OR>
$ mitm-play -d='log'  <OR>
$ mitm-play --delete='log'
  <OR>
$ mitm-play -d='cache'  <OR>
$ mitm-play --delete='cache'
```
</p>
</details>
<details><summary><b>-p --pristine [default]</b></summary>
<p>

Launch browser with non Incognito, this is the default configuration, the opposite is to use --incognito. 

```
$ mitm-play -p  <OR>
$ mitm-play --pristine
```
</p>
</details>
<details><summary><b>-i --insecure</b></summary>
<p>

Set NodeJS to operate within insecure / no https checking 

```
$ mitm-play -i  <OR>
$ mitm-play --insecure
```
</p>
</details>
<details><summary><b>-n --nosocket</b></summary>
<p>

No Injection of websocket to the browser

```
$ mitm-play -n  <OR>
$ mitm-play --nosocket
```
</p>
</details>
<details><summary><b>-k --cookie</b></summary>
<p>

Set proper cache retriver with an update expiry of the cookies

```
$ mitm-play -k  <OR>
$ mitm-play --cookie
```
</p>
</details>
<details><summary><b>-g --group</b></summary>
<p>

Add group name to file cache/logs, if necessary when large capturing is done and difficult to check the files. 

There is an option `at` on the rules of `cache`/`log` for additional filename grouping path.

```
$ mitm-play -g='mygroup'  <OR>
$ mitm-play --group='mygroup'
```
</p>
</details>
<details><summary><b>-t --incognito</b></summary>
<p>

By Default program will run in normal/--pristine browser, adding this option will result in Incognito mode.

```
$ mitm-play -t  <OR>
$ mitm-play --incognito
```
</p>
</details>
<details><summary><b>-x --proxy</b></summary>
<p>

will force some traffict that having proxy section defined, it will use proxy.

this option serving two kind of needs:
1. if the option put just plain --proxy, certain traffict that was handle by mitm-play will get thru proxy, certain traffict that was handle by browser will not effected. and the configuration will come from the enviroment variable.
2. if the option come with string configuration, all traffict will get thru proxy. and the configuration come from --proxy (ie: --proxy='http://username:pass@my.proxy.com')  

```
$ mitm-play -x  <OR>
$ mitm-play --proxy
```
</p>
</details>
<details><summary><b>-z --lazy</b></summary>
<p>

Delay click action ~400ms, to provide enough time for screenshot to be taken

```
$ mitm-play -z  <OR>
$ mitm-play --lazy
```
</p>
</details><br/>
<details><summary><b>-D --debug</b></summary>
<p>

More information will be shown in console.log (ex: websocket)

```
$ mitm-play -D  <OR>
$ mitm-play --debug
```
</p>
</details>
<details><summary><b>-O --ommitlog</b></summary>
<p>

hide some console.log

```
$ mitm-play -O  <OR>
$ mitm-play --ommitlog
```
</p>
</details>
<details><summary><b>-P --plugins</b></summary>
<p>

Specific only on chromium / chrome browser

```
$ mitm-play -P  <OR>
$ mitm-play --plugins
```
</p>
</details>
<details><summary><b>-R --redirect</b></summary>
<p>

Change mechanism of redirection

```
$ mitm-play -R  <OR>
$ mitm-play --redirect
```
</p>
</details>
<details><summary><b>-V --verbose</b></summary>
<p>

Add additional info in console.log

```
$ mitm-play -V  <OR>
$ mitm-play --verbose
```
</p>
</details>
<details><summary><b>-X --proxypac</b></summary>
<p>

When network on your having a proxypac settings, might be usefull to use the same. This option only in Chromium

```
$ mitm-play -X  <OR>
$ mitm-play --proxypac
```
</p>
</details><br/>
<details><summary><b>-C --chromium</b></summary>
<p>

Launch Chromium browser

```
$ mitm-play -C  <OR>
$ mitm-play --chromium
```
</p>
</details>
<details><summary><b>-F --firefox</b></summary>
<p>

Launch Firefox browser

```
$ mitm-play -F  <OR>
$ mitm-play --firefox
```
</p>
</details>
<details><summary><b>-W --webkit</b></summary>
<p>

Launch Webkit browser

```
$ mitm-play -W  <OR>
$ mitm-play --webkit
```
</p>
</details>

# Macros
When creating rule for specific website site (ie: **autologin to gmail**), inside folder you can add `macros.js` to contains what automation need to be run 

<details><summary><b>Example</b></summary>
<p>

```bash
# folder
./accounts.google.com/index.js
./accounts.google.com/macros.js
```
```js
// macros.js
window.mitm.macros = {
  '^/signin/v2/identifier?'() {
    console.log('login to google account...!');
    window.mitm.autofill = [
      '#identifierId => myemailname',
      '#identifierId -> press ~> Enter',
    ];
    //document.querySelector('.btn-autofill').click() // executed when loaded
  },
  '^/signin/v2/challenge/pwd?'() {
    window.mitm.autofill = [
      'input[type="password"] => password',
      'input[type="password"] -> press ~> Enter',
    ];
    //document.querySelector('.btn-autofill').click() // executed when loaded
  },
}
```
```js
// will be send to playwright to execute when user click button "Autofill"
window.mitm.autofill = [...]

// it will run on interval 500ms
window.mitm.autointerval = () => {...};

// additinal buttons to be visible on the page top-right
// buttons can be toggle show / hide by clicking [Ctrl] + [SHIFT]
window.mitm.autobuttons = {
  'one|blue'() {console.log('one')},
  'two|green'() {console.log('two')}
}

// A macro keys can be set as a hotkey!
window.mitm.macrokeys = {...}
```
</details>
</p>

# Macro Keys
A hot keys that can be press on specific page and it will do similar thing with _a macro from mechanical keyboard_, except its generated from injected mitm-play `macros.js`, 

As you can compare with autofill `macros` above, the commands don't include selector, means it will run from current input focused.

Example below show a defined macro keys: `KeyP` & To activate, it need to press combination buttons of `Ctrl` **+** `Alt` **+** `KeyP`. 

list of `key.code` : https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

<details><summary><b>Example</b></summary>
<p>

```js
// macros.js
window.mitm.macros = {
  '^/signin/v2/identifier?'() {
    window.mitm.fn.hotKeys({
      'KeyP'() {
        // chance is a javascript faker defined in jsLib
        const name = chance.email().split('@')[0];
        return [
          `=> ${name}@mailinator.com`,
          '-> press ~> Enter',
        ]  
      }
    });
  }
}    
```
</details>
</p>

# User Route
[User-route](https://github.com/mitm-proxy/user-route) are available on this repo: https://github.com/mitm-proxy/user-route and it should be taken as an experiment to test `mitm-play` functionality. 

If you think you have a nice routing want to share, you can create a PR to the [user-route](https://github.com/mitm-proxy/user-route) or add a `link` to your repo.  

# Use Cases
<details><summary><b>Reduce Internet usage</b></summary>
<p>

There are several strategy to reduce internet usage, user commonly use different tools to achieve, either install new browser (ie: Brave) or install Add Blocker (ie: uBlock). Using mitm-play, developer can controll which need to be pass, blocked or cached. 

__Cache any reguest with content type: font, image, javascript, css__, if url contains cached busting, it may miss the cached, you can experiment by turning off `querystring` to `false`.
```js
cache: {
  '.+': {
    contentType: ['font','image','javascript','css'],
    querystring: true,
    nolog: true,
  }
},
```

__Block/Mock unnecessary javascript with an empty result__, be careful to not block UX or content navigation.
```js
mock: {
  'some/url/with/adv.js': {
    response({body}) {
      return {body: '/* content is blocked! */'}
    },
  },
},
```
</p>
</details>
<details><summary><b>Simplify Developer workflow</b></summary>
<p>

as developer sometime we need to get access to lots website in which some of the page need to be automated fill in and submit to the next page. 

With `Macros` it can be done!
</p>
</details>

# Early Stage
Expect to have some `rule changed` as feature/fix code are incrementally committed.

.

Goodluck!,
>*-wh*.

# Known Limitation
Open Issue -  request interception for service workers - https://github.com/microsoft/playwright/issues/1090

Redirect will not be intercept - https://github.com/microsoft/playwright/pull/2617
<details><summary><b>Turn on intercept redirection on Chromium</b></summary>
<p>

tested on "playwright": "1.3.0", two places on playwright `code need to be commented`:

```js
// playwright/lib/chromium/crNetworkManager.js - ln:197
if (redirectedFrom) {
  allowInterception = true; // ln:197
  // We do not support intercepting redirects.
  // if (requestPausedEvent)
  //     this._client._sendMayFail('Fetch.continueRequest', { requestId: requestPausedEvent.requestId });
}

// playwright/lib/network.js - ln:75
helper_1.assert(!url.startsWith('data:'), 'Data urls should not fire requests');
// helper_1.assert(!(routeDelegate && redirectedFrom), 'Should not be able to intercept redirects'); // ln:197
this._routeDelegate = routeDelegate;
```
</p>
</details>