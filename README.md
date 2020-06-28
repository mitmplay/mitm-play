# mitm-play
Man in the middle using playwright

![mitm-play](https://raw.githubusercontent.com/mitm-proxy/user-route/master/docs/mitm-proxy.gif)

   * [Installation](#installation)
   * [Features](#features)
   * [Concept](#concept)
   * [Profile: ~/.mitm-play](#profile-mitm-play)
   * [Route Sections](#route-sections)
   * [HTTP_PROXY &amp; NO_PROXY](#http_proxy--no_proxy)
   * [User Route](#user-route)
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
      el: 'e_end', //JS at end of 
      js: [googlJS, hello], //html body
    },
  }, //all js request from gstatic.com 
  js: {'gstatic.com': ''} // will be empty response
}
module.exports = route;
```

```bash
# run the demo:
mitm-play --url='google.com/search?q=covid-19' --route='.' --save --delete
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
| `exclude`   | ----------   | array ..of `[domain]` - browser will handle it    
| `request`   | __request__  | modify request object - call to remote server
| `noproxy`   | ----------   | array ..of `[domain]` - will serve directly    
| `proxy`     | ----------   | array ..of `[domain]` - will serve using proxy    
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

If the process of checking is not match, then it will fallback to `default` namespace to check, and the operation is the same as mention in first paragraph. 

Usually html page load with several assets (image, js & css) that not belong to the same domain, and to match those type of assets, it use browser headers attributes: `origin` or `referer`, in which will scoping to the same namespace.

<details><summary>Example</summary>
<p>

In below example the route is having a `js` object and the process of checking narrated as: if there is a JS assets come from `gstatic.com`, then the response will get replace with an empty string.

Namespaces: `default`, `google.com` on nodejs global scope:  
```js
global.mitm.route = {
  'default': {
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
  title:   '',
  screenshot: {}, //user interaction rules & observe DOM-Element
  skip:    [], //start routing rules
  exclude: [],
  request: {},
  noproxy: [], 
  proxy:   [], // request with proxy
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

<details><summary><b>URL & Title</b></summary>
<p>

Url will be use as part of `non dashes CLI first params`. The logic is try to match partion of text in **`url`** and if it match, continue to open in the browser.

For `Title`, it just provide basic information about this route.
```js
routes = {
  title: 'Amazon - amazon',
  url:  'https://www.amazon.com/b?node=229189',
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
<details><summary><b>Exclude</b></summary>
<p>

Exclude match **`url`** rule in which having same *Origin/Referer* to the route namespace, `mitm-play` will not process further.
```js
exclude: ['wp-admin'],
```
</p>
</details>
<details><summary><b>Request</b></summary>
<p>

Manipulate Request with `request` function
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
<details><summary><b>Mock</b></summary>
<p>

Mocking the **response**.

Basic rule: replace **response body** with **the matcher** value 
```js
mock: {'2mdn.net': ''},
```

`response` rule: manipulate **response** with return value of `response` *function*
```js
mock: {
  'mitm-play/twitter.js': {
    response({status, headers, body}) {
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```

`js` rule: **the mock body** will be a concatenation of JS code
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
Please do not combine  `response` with `js`, `js` will add/replace content-type to  *'application/javascript'*.
</p>
</details>
<details><summary><b>Cache</b></summary>
<p>

Save the first request to your local disk so next request will serve from there.
```js
cache: {
  'amazon.com': {
    contentType: ['javascript', 'image'],
    hidden: true, // optional - no consolo.log
    nolog: true, // optional - disable logging
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
    contentType: ['json']
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

Basic rule: replace **response body** with **the matcher** value 
```js
html: {'twitter.net': ''},
```

`response` rule: manipulate **response** with return value of `response` *function*
```js
html: {
  'twitter.com/home': {
    response({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```
`js` rule: insert js script element into specific area in html document
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

Basic rule: replace **response body** with **the matcher** value 
```js
json: {'twitter.net': '{}'},
```

`response` rule: manipulate **response** with return value of `response` *function*
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

Basic rule: replace **response body** with **the matcher** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const style = 'body: {color: red}';
...
css: {'twitter.net': style}, //or `=>${style}`
```

`response` rule: manipulate **response** with return value of `response` *function*
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

Basic rule: replace **response body** with **the matcher** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const code = 'alert(0);'
...
js: {'twitter.net': code}, //or `=>${code}`
```

`response` rule: manipulate **response** with return value of `response` *function*
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

Manipulate Response with `response` function
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

# HTTP_PROXY & NO_PROXY
mitm-play support env variable **HTTP_PROXY** and **NO_PROXY** if your system required proxy to access internet.

# User Route
[User-route](https://github.com/mitm-proxy/user-route) are available on this repo: https://github.com/mitm-proxy/user-route and it should be taken as an experiment to test `mitm-play` functionality. 

If you think you have a nice routing want to share, you can create a PR to the [user-route](https://github.com/mitm-proxy/user-route) or add a `link` to your repo.  

# Early Stage
Expect to have some `rule changed` as feature/fix code are incrementally committed.

.

Goodluck!,
>*-wharsojo*.
