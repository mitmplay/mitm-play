# Man in the middle
### Using Playwright to intercept traffic in between and do lots of stuff for Developer to exercise

<details><summary><b>mitm-play in action</b></summary>

[![mitm-play](https://raw.githubusercontent.com/mitm-proxy/user-route/docs/docs/keybr.com-ytube.png)](https://www.youtube.com/watch?v=sXTsy_XxILg)

</details>

   * [Installation](#installation)
   * [Features](#features)
   * [Concept](#concept)
   * [Object & function](#object--function)
   * [Route Sections/rules](#route-sectionrules)
   * [\_global\_ Route](#_global_-route)
   * [~/.mitm-play](#mitm-play)
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
Execute mitm-play command with demo route route included:
```bash
mitm-play -rG
```
<details><summary>Example</summary>

```js
// create file: ~/user-route/keybr.com/index.js & add this content:
const css = `
.Body-header,.Body-aside {
  display: none !important;
}`;
 
const route = {
  url: 'https://keybr.com',
  tags: [],
  'mock:no-ads': {
    'doubleclick.net': '',
    'a.pub.network': '',
    'google.+.com': '',
  },
  css: {
    'GET:no-ads/assets/[a-z0-9]+': `=>${css}`
  },
}
module.exports = route;
```

```js
// create file: ~/user-route/_global_/index.js & add this content:
const route = {
  tags: [],
  'config:no-logs': {
    logs: {
      'referer-reqs': false,
      'no-namespace': false,
    }
  }
}
module.exports = route;
```

```bash
# 1st run will be to save all cli option to 'default'
mitm-play keyb --delete --save  # --OR--
mitm-play keyb -ds

# next run should be simple as:
mitm-play
```
Routing definition having `remove-ads` tag, it will be shown on chrome dev-tools "mitm-play" "tags" as an option to enabled / disabled rules. You can see the togling process on [this video.](https://www.youtube.com/watch?v=sXTsy_XxILg)

</details>

# Features

| Feature     | payload      | note
|-------------|--------------|----------------------------------------
| `screenshot`| ----------   | DOM specific rules for taking screenshot
| `skip`      | ----------   | array ..of `[domain]` - browser will handle it
| `proxy`     | ----------   | array ..of `[domain]` - will serve using proxy
| `noproxy`   | ----------   | array ..of `[domain]` - will serve directly
| `request`   | __request__  | modify reqs object - call to remote server
| `mock`      | __response__ | mock resp object - no call to remote server
| `cache`     | __response__ | 1st call save to local - next call, read from cache
| `log`       | __response__ | save/log reqs/resp to local - call to remote server
|             | __response__ | modify resp based on contentType - call remote server
| =>>         | * `html`     | - response handler (replace / update + JS + ws)
| =>>         | * `json`     | - response handler (replace / update)
| =>>         | * `css`      | - response handler (replace / update)
| =>>         | * `js`       | - response handler (replace / update)
| `response`  | __response__ | modify resp object - call to remote server

# Concept
Mitm intercept is **hierarchical checking routes**.

First check is to **match** domain on the url with **route-folder** as a domain `namespace`.

Next check is to **match** full-url with **regex-routing** of each section/rule. the **regex-routing** having two type:
* **An Array** [ `skip, proxy, nonproxy, nosocket` ] 
* **Object Key**: 
  1. General [ `request, mock, cache, log, response` ] 
  2. Specific to content-type [ `html, json, css, js` ] 

`if match`, then based on the section/rules meaning, the next process can be carry over, detail explanations will be on the title of: "**Route Section/rules**".
<details><summary><b>Structure Object of Routes:</b></summary>

```js
{
  'abc.com': { // route-folder mapped to object as namespace
    request: { // section/rules: skip, proxy,... request,... 
      '/assets/main.js': { // regex-routing
        request: reqs => { // handler 
          const { body } = reqs
          return { body }
        }
      }
    }
  }
}
```
</details><br/>

If the process of checking is not match, then it will fallback to **\_global\_** `namespace` for checking, and the operation is the same as mention in _above paragraph_: `'Next check...'`. 

Usually html page load with several assets (image, js & css) that not belong to the same domain, and to match those type of assets, it use browser headers attributes: `origin` or `referer`, in which will scoping to the `same namespace`.

## Object & function
Detail structure of `Object` and `Function` shared accros **Section** 
#### _Objects_

<details><summary><b>match</b></summary>

```js
/**
 * match: {
 *   route      : {}, 
 *   contentType: {}, 
 *   workspace  : '',/undefined,
 *   namespace  : '', 
 *   pathname   : '', 
 *   hidden     : true,/false 
 *   search     : '',
 *   host       : '',
 *   arr        : [],
 *   url        : '',
 *   key        : '',
 *   log        : '',
 *   typ        : ''
 * }
*/
```
</details>

<details><summary><b>request</b></summary>

```js
/**
 * reqs/request: {
 *   url        : '',
 *   method     : 'GET',/PUT/POST/DELETE 
 *   headers    : {}, 
 *   body       : '',/null,
 *   browserName: 'chromium',/webkit/firefox
 * }
*/
```
</details>

<details><summary><b>response</b></summary>

```js
/**
 * resp/response: {
 *   url    : '',
 *   status : 200,/302/400/500/etc.. 
 *   headers: {},
 *   body   : '',
 * }
*/
```
</details>

#### _Functions_
<details><summary><b>file(reqs, match)</b></summary>

```js
/**
 * arguments:
 * - <reqs: object>
 * - <match: object>
 * 
 * return: <filename: string>/false
 * 
 * for Mock: False value indicate skip mocking
*/
file(reqs, match) {
  ...
  return 'common.js';
},
```
</details>

<details><summary><b>request(reqs, match)</b></summary>

```js
/**
 * arguments:
 * - <reqs: object>
 * - <match: object>
 * 
 * return: <reqs: object>
*/
request(reqs, match) {
  const {headers} = reqs;
  headers['new-header'] = 'with some value';

  return {headers};
},
```
</details>

<details><summary><b>response(resp, reqs, match)</b></summary>

```js
/**
 * arguments:
 * - <resp: object>
 * - <reqs: object>
 * - <match: object>
 * 
 * return: <resp: object>
*/
response(reqs, reqs, match) {
  const {headers} = reqs;
  headers['new-header'] = 'with some value';

  return {headers};
},
```
</details>

# Route Section/rules
on each route you can add section supported:

<details><summary>Skeleton</summary>

```js
route = {
  url:     '',
  urls:    {},
  title:   '',
  jsLib:   [],
  workspace: '',
  screenshot: {}, //user interaction rules & DOM-element observer
  proxy:   [], //request with proxy
  noproxy: [], 
  nosocket:[],
  skip:    [], //start routing rules
  request: {},
  mock:    {}, 
  cache:   {},
  response:{},
  html:    {},
  json:    {},
  css:     {},
  js:      {},
  log:     {}, //end routing rules
}
```
</details>
<p>
the execution order as documented start with `skip`, end with `response`, no need to implement all of routing rules. 
</p>

<details><summary><b>Title, url, urls, workspace & jsLib</b></summary>

`Title`: provide basic information about this route.

`Url`: when user enter cli with `1st args`, it will try to find in **`url`**, then open the browser with that **`location`**.

`Urls`: additional search `urls` key, the `1st args` can be split by [`,`], if find more than one, it will  open multi tabs.

`workspace`: will be use as the base folder for `file` option in `Mock` and `Cache`.

`lib`: inject js library into html which having websocket, it can be [`jquery.js`, `faker.js`, `chance.js`, `log-patch.js`]

```js
route = {
  title: 'Amazon - amazon',
  url:  'https://www.amazon.com/b?node=229189',
  urls: {
    ama1: 'https://www.amazon.com/b?node=229100',
    ama2: 'https://www.amazon.com/b?node=229111',
  },
  workspace: '~/Projects',
  jsLib: ['chance.js'],
};
// cli: mitm-play ama -dpsr='.' 
// search: 'ama' and it will open two browser tabs
```
</details>
<details><summary><b>Screenshot</b></summary>

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
</details>
<details><summary><b>Proxy</b></summary>

Certain domain will go thru proxy, `proxy` & `noproxy` will make sanse if command line contains -x/--proxy
```js
// HTTP_PROXY env need to be set, cli: --proxy ..
proxy: [
  'google-analytics.com',
],
```
</details>
<details><summary><b>Noproxy</b></summary>

if proxy config was set to all request/response, `noproxy` will exclude it from proxy. Example below will set domain nytimes.com with direct access and the rest will go thru proxy. 
```js
// HTTP_PROXY env need to be set, cli: --proxy .. --noproxy ..
noproxy: ['nytimes.com'],
proxy:   ['.+'],
```
</details>
<details><summary><b>Nosocket</b></summary>

No `WebSocket` Injection to **`html`**, `mitm-play` will process further.
```js
nosocket: ['sso'],
```
</details>
<details><summary><b>Skip</b></summary>

Skipping back **`url`** to the browser if partion of **`url`** match text in array of `skip` section, `mitm-play` will not process further.
```js
skip: ['wp-admin'],
```
</details>
<details><summary><b>Request</b></summary>

Manipulate **request** with `request` function
```js
request: {
  'GET:/disqus.com/embed/comments/': {
    request(reqs, match) {
      {headers} = reqs;
      return {headers};
    },
    session: true, // optional - set session id
  }
},
```
</details>
<details><summary><b>Mock</b></summary>

Mock the **response**.

Basic rule:

Replace **response body** with **the matcher** value 
```js
mock: {'2mdn.net': ''},
```

Manipulate **response** with `response` *function*
```js
mock: {
  'mitm-play/twitter.js': {
    response(resp, reqs, match) {
      return {body} //can be {} or combination of {status, headers, body}
    },
    log: true, // optional - enable logging
  },
},
```
Below is the logic of `file` getting translate combine with `path` or `workspace`, if `workspace` exists, and `file` value not start with dot(`.`), it will use `workspace` (ie: `${workspace}/${file}`) and the `path` will be ignore.
```js
mock: {
  'mitm-play/twitter.js': {
    file: 'relative/to/workspace/file.html', // --OR--
    // file: '../relative/to/route/folder/file.html',
    // file: './relative/to/route/folder/file.html',
    // file: '~/relative/to/home/folder/file.html',
    // file: (reqs, match) => 'filename'
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
</details>
<details><summary><b>Cache</b></summary>

Save the first request to your local disk so next request will serve from there.
```js
cache: {
  'amazon.com': {
    contentType: ['javascript', 'image'], //required!
    querystring: true, // hash of unique file-cache
    hidden: true, // optional - no consolo.log
    path: './api', // optional cache file-path
    file: ':1', // optional cache file-name
    log: true, // optional - enable logging
    at: 'mycache', // 'mycache' part of filename
    tags: 'js-img', // enable/disable route by tags
  }
},
```
logic for `file` is the same as in `mock`, if `workspace` exists and `file` value not start with dot(`.`), it will use `workspace` (ie: `${workspace}/${file}`) and the `path` will be ignore.
```js
cache: {
  'amazon.com': {
    file: 'relative/to/workspace/file.html', // --OR--
    // file: '../relative/to/route/folder/file.html',
    // file: './relative/to/route/folder/file.html',
    // file: '~/relative/to/home/folder/file.html',
    // file: (reqs, match) => 'filename'
  },
},
`cache` support `response` function, it means the result can be manipulate first before send to the browser.
```js
cache: {
  'amazon.com': {
    contentType: ['json'], //required! 
    response(resp, reqs, match) {
      return {body} //can be {} or combination of {status, headers, body}
    },    
  }
},
```
</details>
<details><summary><b>Response</b></summary>

Manipulate **response** with `response` function
```js
response: {
  '.+': {
    response(resp) {
      const {headers} = reqs;
      headers['new-header'] = 'with some value';

      return {headers};
    },
    tags: 'all-response',
  }
},
```
</details>
<details><summary><b>Html</b></summary>

Manipulate the response.

Basic rule: 

Replace **response body** with **some** value 
```js
html: {'twitter.net': ''},
```

Insert `js` script element into specific area in html document:
* el: 'e_head' &nbsp; // default, no need to add `el` key
* el: 'e_end'
```js
html: {
  'https://keybr.com/': {
    // el: 'e_head', // JS at <head> 
    js: [()=>console.log('Injected on Head')],
  },
},
```
Insert `<script src="..."></script>` into `<head>` section
```js
html: {
  'https://keybr.com/': {
    src: ['http://localhost:/myscript.js'],
    ws: true, // inject web socket
  },
},
```
Manipulate **response** with `response` *function*
```js
html: {
  'https://keybr.com/': {
    response(resp, reqs, match) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
    tags: 'response' // enable/disable route by tags
    hidden: true, // optional - no consolo.log
  },
},
```
</details>
<details><summary><b>Json</b></summary>

Manipulate the response.

Basic rule: 

Replace **response body** with **some** value 
```js
json: {'twitter.net': '{}'},
```

Manipulate **response** with `response` *function*
```js
json: {
  'twitter.com/home': {
    response(resp, reqs, match) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
    tags: 'json-manipulate',
  },
},
```
</details>
<details><summary><b>Css</b></summary>

Manipulate the response.

Basic rule: 

Replace **response body** with **some** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const style = 'body: {color: red}';
...
css: {'twitter.net': style}, //or `=>${style}`
```

Manipulate **response** with `response` *function*
```js
css: {
  'twitter.com/home': {
    response(resp, reqs, match) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
    tags: 'css-manipulate',
  },
},
```
</details>
<details><summary><b>Js</b></summary>

Manipulate the response.

Basic rule: 

Replace **response body** with **some** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const code = 'alert(0);'
...
js: {'twitter.net': code}, //or `=>${code}`
```

Manipulate **response** with ~~`response`~~ *function*
```js
js: {
  'twitter.com/home': {
    response(resp, reqs, match) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
    tags: 'js-manipulate',
  },
},
```
</details>
<details><summary><b>Log</b></summary>

Save the response to your local disk. by default contentType `json` will log complete request / response, for different type default log should be response payload. 

Special usacase like google-analytic will send contentType of `gif` with [GET] request, and response payload is not needed, there is an option `log` to force log with json complete request / response.  
```js
log: {
  'amazon.com': {
    contentType: ['json'],
    tags: 'json-bo' // enable/disable route by tags
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
    response(resp, reqs, match) {
      return {body} //can be {} or combination of {status, headers, body}
    },
  }
},
```
</details>

# \_global\_ Route

A special route to handle global scope (without namespace) 

<details><summary><b>Common route rules</b></summary>

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
}
```
</details>
<details><summary><b>Args & flag</b></summary>

Two additional Section only appear in _\_global\__

`args`, `flag` and it can be served as a section-tags

```js
_global_ = {
  args: { // part of cli options
    activity,  // rec/replay cache activity*
    cookie,    // reset cookies expire date*
    fullog,    // show detail logs on each rule*
    lazyclick, // delay ~700ms click action*
    nosocket,  // no websocket injection to html page*
    nohost,    // set logs without host name*
    nourl,     // set logs without URL*
    relaxcsp,  // relax CSP unblock websocket*
  }
}
```
```js
_global_ = {
  flag: { // toggle to show/hide from console.log()
    'referer-reqs': true,
    'no-namespace': true,
    'ws-broadcast': false, // true if --verbose/--debug
    'ws-connect': false,   // true if --verbose/--debug
    'ws-message': false,   // true if --verbose/--debug
    'page-load': false,    // true if --verbose/--debug
    'mitm-mock': false,    // true if --verbose/--debug
    'file-log': false,     // true if --verbose/--debug
    'file-md': false,      // true if --verbose/--debug  
    silent:   false,       // true: hide all
    skip:     false,
    nosocket: true,
    request:  true,
    mock:     true,
    cache:    true,
    log:      true,
    html:     true,
    json:     true,
    css:      true,
    js:       true,
    response: true,
  }
}
```
</details>

# ~/.mitm-play
By default all save file are on the `~/.mitm-play` profile folder.

# HTTP_PROXY
mitm-play support env variable **HTTP_PROXY** and **NO_PROXY** if your system required proxy to access internet. Please check on `CLI Options > -x --proxy` section for detail explanation. 

# CLI Options
when entering CLI commands, `mitm-play`  support two kind of arguments: 

<details><summary><b>mitm-play [args] [-options]</b></summary>

* `args`:
  * **1st** for searching url/urls
  * **2nd** for loading profile
* `options`.
```bash
# syntax
$ mitm-play [args] [-options]

# create 'secure' profile with -s/--save option # OR
$ mitm-play yahoo --lazyclick --incognito -s='secure'
$ mitm-play yahoo -zts='secure'

# search yahoo route and use 'secure' profile & add -k/--cookie option 
$ mitm-play yahoo secure -k

# if no profile, fallback to 'default'
$ mitm-play yahoo --cookie
```
</details>

<details><summary><b>-h --help</b></summary>

To show all the options Command Line Interface (CLI). this option can be arbitrary position on cli, the result should be always display this messages:

```
$ mitm-play -h  <OR>
$ mitm-play --help

  Usage: mitm-play [args] [options]

  args:
    1st for searching url/urls
    2nd for loading profile

  options:
    -h --help            show this help
    -u --url             go to specific url
    -s --save            save as default <profl>
    -r --route           userscript folder routes
    -a --activity        rec/replay cache activity*
    -c --relaxcsp        relax CSP unblock websocket*
    -d --delete          delete/clear cache & logs
    -f --fullog          show detail logs on each rule* 
    -p --pristine        pristine browser, default option
    -i --insecure        accept insecure cert in nodejs env
    -n --nosocket        no websocket injection to html page*
    -k --cookie          reset cookies expire date*
    -l --lazylog         delay ~500ms print console.log
    -g --group           create cache group/rec
    -t --incognito       set chromium incognito
    -x --proxy           a proxy request
    -z --lazyclick       delay ~700ms click action*

    -D --debug           show ws messages
    -G --nogpu           set chromium without GPU
    -H --nohost          set logs without host name*
    -R --redirect        set redirection: true/false/manual
    -U --nourl           set logs without URL*
    -V --verbose         show more detail of console log
    -X --proxypac        set chromium proxypac

    -C --chromium        run chromium browser
    -F --firefox         run firefox browser
    -W --webkit          run webkit browser

  * _global_.config.args
    
  v0.8.xxx
```
</details>
<details><summary><b>-u --url</b></summary>

Open Browser to specific `URL`

```
$ mitm-play -u='https://google.com'  <OR>
$ mitm-play --url='https://google.com'
```
</details>
<details><summary><b>-s --save</b></summary>

Save CLI options with `default`  or named so later time you don't need to type long CLI options

```
$ mitm-play -s  <OR>
$ mitm-play --save
  <OR>
$ mitm-play -s='google'  <OR>
$ mitm-play --save='google'
```
</details>
<details><summary><b>-r --route</b></summary>

Specify which folder contains routes config

```
$ mitm-play -r='../user-route'  <OR>
$ mitm-play --route='../user-route'
```
</details>
<details><summary><b>-c --activity</b></summary>

Flag the caching with sequences, they are three mode of activity:
*  `rec:activity`  to record cache w/ `seq`, all cache always recorded
*  `mix:activity`  to record cache w/ `seq`, non `seq` behave as std cache 
*  `play:activity` to replay cache w/ `seq`, non `seq` behave as std cache

Tag `activity` need to be add to **html - rule** to indicate the point when `sequences` cached will be start.

```
$ mitm-play -a='rec:activity'  <OR>
$ mitm-play --activity='rec:activity'
```

The first step is to record the flow and do the navigation
```
$ mitm-play -a='rec:activity'
```

Next step is to replay the flow 
```
$ mitm-play -a='play:activity'
```

</details>
<details><summary><b>-c --relaxcsp</b></summary>

Update CSP header on Html Page injected with websocket.js to unblock Websocket communication

```
$ mitm-play -c  <OR>
$ mitm-play --relaxcsp
```
</details>
<details><summary><b>-d --delete</b></summary>

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
</details>
<details><summary><b>-p --pristine [default]</b></summary>

Launch browser with non Incognito, this is the default configuration, the opposite is to use --incognito. 

```
$ mitm-play -p  <OR>
$ mitm-play --pristine
```
</details>
<details><summary><b>-i --insecure</b></summary>

Set NodeJS to operate within insecure / no https checking 

```
$ mitm-play -i  <OR>
$ mitm-play --insecure
```
</details>
<details><summary><b>-n --nosocket</b></summary>

No Injection of websocket to the browser

```
$ mitm-play -n  <OR>
$ mitm-play --nosocket
```
</details>
<details><summary><b>-k --cookie</b></summary>

Set proper cache retriver with an update expiry of the cookies

```
$ mitm-play -k  <OR>
$ mitm-play --cookie
```
</details>
<details><summary><b>-l --lazylog</b></summary>

Delay console log ~500ms or you can provide value in milisecond.

```
$ mitm-play -l  <OR>
$ mitm-play --lazylog
  <OR>
$ mitm-play -l=400  <OR>
$ mitm-play --lazylog=400
```
</details>
<details><summary><b>-g --group</b></summary>

Add group name to file cache/logs, if necessary when large capturing is done and difficult to check the files. 

There is an option `at` on the rules of `cache`/`log` for additional filename grouping path.

```
$ mitm-play -g='mygroup'  <OR>
$ mitm-play --group='mygroup'
```
</details>
<details><summary><b>-t --incognito</b></summary>

By Default program will run in normal/--pristine browser, adding this option will result in Incognito mode.

```
$ mitm-play -t  <OR>
$ mitm-play --incognito
```
</details>
<details><summary><b>-x --proxy</b></summary>

Some traffict with domain match to proxy section will use proxy.

this option serving two kind of needs:
1. if --proxy without value, mitm-play traffict will get thru proxy. Proxy configuration will get from ENV variable.
2. if --proxy with string domain, all (mitm-play or browser) traffict will get thru proxy. (ie: `--proxy`='http://username:pass@my.proxy.com')  

```
$ mitm-play -x  <OR>
$ mitm-play --proxy
  <OR>
$ mitm-play -x='http://username:pass@my.proxy.com'  <OR>
$ mitm-play --proxy='http://username:pass@my.proxy.com'
```
</details>
<details><summary><b>-z --lazyclick</b></summary>

Delay click action ~700ms or you can provide value in milisecond, to provide enough time for screenshot to be taken

```
$ mitm-play -z  <OR>
$ mitm-play --lazyclick
  <OR>
$ mitm-play -z=400  <OR>
$ mitm-play --lazyclick=400
```
</details><hr/>
<details><summary><b>-D --debug</b></summary>

More information will be shown in console.log (ex: websocket), including info from `DEBUG=pw:api`

```
$ mitm-play -D  <OR>
$ mitm-play --debug
```
</details>
<details><summary><b>-G --nogppu</b></summary>

Necessary option for [Macbook owner](https://discussions.apple.com/thread/250878229).

Options can be added with value -G=all to disabled all gpu (might hang notebook)

```
$ mitm-play -G  <OR>
$ mitm-play --nogpu
```
</details>
<details><summary><b>-H --nohost</b></summary>

set logs without host name

```
$ mitm-play -H  <OR>
$ mitm-play --nohost
```
</details>
<details><summary><b>-R --redirect</b></summary>

Change mechanism of redirection

```
$ mitm-play -R  <OR>
$ mitm-play --redirect
```
</details>
<details><summary><b>-U --nourl</b></summary>

set logs without URL

```
$ mitm-play -U  <OR>
$ mitm-play --nourl
```
</details>
<details><summary><b>-V --verbose</b></summary>

Add additional info in console.log

```
$ mitm-play -V  <OR>
$ mitm-play --verbose
```
</details>
<details><summary><b>-X --proxypac</b></summary>

When network on your having a proxypac settings, might be usefull to use the same. This option only in Chromium

```
$ mitm-play -X='w3proxy.netscape.com:8080'  <OR>
$ mitm-play --proxypac='w3proxy.netscape.com:8080'
```
</details><hr/>
<details><summary><b>-C --chromium</b></summary>

Launch Chromium browser

```
$ mitm-play -C  <OR>
$ mitm-play --chromium

# can be a path to Chrome installation ie on MAC

$ mitm-play -C="/Applications/Google\ Chrome.app"  <OR> 
$ mitm-play --chromium="/Applications/Google\ Chrome.app"
```
</details>
<details><summary><b>-F --firefox</b></summary>

Launch Firefox browser

```
$ mitm-play -F  <OR>
$ mitm-play --firefox
```
</details>
<details><summary><b>-W --webkit</b></summary>

Launch Webkit browser

```
$ mitm-play -W  <OR>
$ mitm-play --webkit
```
</details>

# Macros
When creating rule for specific website site (ie: **autologin to gmail**), inside folder you can add `macros.js` to contains what automation need to be run 

<details><summary><b>Example</b></summary>

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

# Macro Keys
A hot keys that can be press on specific page and it will do similar thing with _a macro from mechanical keyboard_, except its generated from injected mitm-play `macros.js`, 

As you can compare with autofill `macros` above, the commands don't include selector, means it will run from current input focused.

Example below show a defined macro keys: `KeyP` & To activate, it need to press combination buttons of `Ctrl` **+** `Alt` **+** `KeyP`. 

list of `key.code` : https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

<details><summary><b>Example</b></summary>

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

# User Route
[User-route](https://github.com/mitm-proxy/user-route) are available on this repo: https://github.com/mitm-proxy/user-route and it should be taken as an experiment to test `mitm-play` functionality. 

If you think you have a nice routing want to share, you can create a PR to the [user-route](https://github.com/mitm-proxy/user-route) or add a `link` to your repo.  

# Use Cases
<details><summary><b>Reduce Internet usage</b></summary>

There are several strategy to reduce internet usage, user commonly use different tools to achieve, either install new browser (ie: Brave) or install Add Blocker (ie: uBlock). Using mitm-play, developer can controll which need to be pass, blocked or cached. 

__Cache any reguest with content type: font, image, javascript, css__, if url contains cached busting, it may miss the cached, you can experiment by turning off `querystring` to `false`.
```js
cache: {
  '.+': {
    contentType: ['font','image','javascript','css'],
    querystring: true,
  }
},
```

__Block/Mock unnecessary javascript with an empty result__, be careful to not block UX or content navigation.
```js
mock: {
  'some/url/with/adv.js': {
    response(resp, reqs, match) {
      return {body: '/* content is blocked! */'}
    },
  },
},
```
</details>
<details><summary><b>Simplify Developer workflow</b></summary>

as developer sometime we need to get access to lots website in which some of the page need to be automated fill in and submit to the next page. 
With `Macros` it can be done!
</details>

# Early Stage
Expect to have some `rule changed` as feature/fix code are incrementally committed.

.

Goodluck!,
>*-wh*.

# Known Limitation
Issue or Limitation on Playwright:
* Support route aka request interception for service workers [#1090](https://github.com/microsoft/playwright/issues/1090)
* Route handler to support redirects [#3993](https://github.com/microsoft/playwright/issues/3993) / Disallow intercepting redirects [#2617](https://github.com/microsoft/playwright/pull/2617)