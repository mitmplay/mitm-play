# mitm-play
Man in the middle using playwright

![mitm-play](https://raw.githubusercontent.com/mitm-proxy/user-route/master/docs/mitm-proxy.gif)

   * [Installation](#installation)
   * [Features](#features)
   * [Concept](#concept)
   * [Profile: ~/.mitm-play](#profile-mitm-play)
   * [Route Sections](#route-sections)
      * [URL &amp; Title](#url--title)
      * [Screenshot](#screenshot)
      * [Exclude <em>(experimental)</em>](#exclude-experimental)
      * [Skip](#skip)
      * [Mock](#mock)
      * [Headers](#headers)
      * [Proxy](#proxy)
      * [Cache](#cache)
      * [Log](#log)
      * [Html](#html)
      * [Json](#json)
      * [Css](#css)
      * [Js](#js)
   * [HTTP_PROXY &amp; NO_PROXY](#http_proxy--no_proxy)
   * [User Route](#user-route)
   * [Early Stage](#early-stage)

# Installation
```bash
npm install -g mitm-play
```

```js
// create new folder/file: google.com/index.js and add this content:
const googlJS = function() {
  document.querySelectorAll('g-section-with-header').forEach(n=>n.remove())
  document.querySelectorAll('.obcontainer').forEach(n=>n.remove())
  document.querySelectorAll('.g-blk').forEach(n=>n.remove())
};

const domain =  __dirname.split(/\\|\//).pop();
const {hello} = global.mitm.fn;

const routes = {
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
global.mitm.fn.routeSet(routes, domain, true)
```
```bash
# run the demo:
mitm-play --url='google.com/search?q=covid-19' --route='.' --save --delete
mitm-play -u='google.com/search?q=covid-19' --dsr='.'

# next run should be simple as:
mitm-play
```

# Features

| Feature  | payload      | note                                       
|----------|--------------|----------------------------------------
| `skip`   | ----------   | array ..of `[url]` - browser will handle it    
| `mock`   | __response__ | object of `{url}` - no call to remote server  
| `headers`| __request__  | object of `{header}` - call to remote server
| `cache`  | __response__ | object of `{url}` - next call read from cache 
| `log`    | __response__ | object of `{url}` - call to remote server & logs    
| Update   | __response__ | object of `{url}`+`(ContentType)` - call remote server
| =>>      | * `html`     | - response handler (replace / update + JS)
| =>>      | * `json`     | - response handler (replace / update)
| =>>      | * `css`      | - response handler (replace / update)
| =>>      | * `js`       | - response handler (replace / update)


# Concept
Mitm intercept is hierarchical checking routes. First check is try to `match` domain on the url, `if match` then next action is to `match` url regex expression on each **type/content-type** listed on the route and `if match` again, then it will execute the handler route event registered in the route.

If the process of checking is not match, then it will fallback to `default` namespace to check, and the operation is the same as mention in first paragraph. 

Usually html page load with several assets (image, js & css) that not belong to the same domain, and to match those type of assets, it use browser headers attributes: `origin` or `referer`, in which will scoping to the same namespace.

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
# Profile: ~/.mitm-play
By default all save file are on the `~/.mitm-play` profile folder.

# Route Sections
on each route you can add section supported:
```js
routes = {
  url:     '',
  title:   '',
  screenshot: {}, //user interaction rules & observe DOM-Element
  skip:    [], //start routing rules
  exclude: [],
  mock:    {},
  headers: {},
  cache:   {},
  log:     {},
  html:    {},
  json:    {},
  css:     {},
  js:      {}, //end routing rules
}
```
the execution order as documented start with `skip`, end with `js`, no need to implement all of routing rules. 

## URL & Title
Url will be use as part of the cli first params with non dashes and try to match partion of text in **`url`** and continue to open the browser with that **`url`**.
For the `Title`, it just provide basic information about this route.
```js
routes = {
  title: 'Amazon - amazon',
  url:  'https://www.amazon.com/b?node=229189',
};
// mitm-play ama -dpsr='.' -> search: 'ama' in url and go to the website
```
## Screenshot
Capture/Screeshot when user *click* specific DOM-Element *match* with `selector` or state-change, like DOM-Element getting *insert* or *remove* and match **selector** inside `observer` key.

Below example show three selector in `observer`:
*  *'.field.error'* -> **filename**: field-error -> **state**: `insert` or `remove`
*  *'.input.focus'* -> **filename**: input -> **state**: `insert` or `remove`
*  *'.panel.error'* -> **filename**: panel-error -> **state**: `insert`

Caveat: `observer` is an *experimental feature*, take it as a grain salt, expectation of selector should be like toggling and it need a unique match to the DOM-Element, *please do test on chrome-devtools before reporting a bug*.

Caveat 2: this `Screenshot` rule(s), required successful injection of websocket client to html document, if it not success (error can be seen on chrome dev-tools),might be *content-security-policy* restriction. 

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

## Exclude *(experimental)*
Exclude match **`url`** rule in which having same *Origin/Referer* to the route namespace, and *`skip` don't have any restriction, plain and simple match and forget*.
```js
exclude: ['wp-admin'],
```

## Skip
Skipping back **`url`** to the browser if partion of **`url`** match text in array of `skip` section, `mitm-play` will not process further.
```js
skip: ['wp-admin'],
```

## Mock
Mocking the **response**.

Basic rule: replace **response body** with **the matcher** value 
```js
mock: {'2mdn.net': ''},
```

`resp` rule: manipulate **response** with return value of `resp` *function*
```js
mock: {
  'mitm-play/twitter.js': {
    resp({status, headers, body}) {
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
Please do not combine  `resp` with `js`, `js` will add/replace content-type to  *'application/javascript'*.

## Headers
Manipulate Request headers
```js
headers: {
  'disqus.com/embed/comments/': {
    'referrer-policy': 'no-referrer-when-downgrade'
  }
},
```
## Proxy
Certain domain will request thru proxy
```js
// HTTP_PROXY env need to be set, cli: --proxy 
proxy: [
  'google-analytics.com',
],
```

## Cache
Save the first request to your local disk so next request will serve from there.
```js
cache: {
  'amazon.com': {
    contentType: ['javascript', 'image']
  }
},
```
`cache` support `resp` function, it means the result can be manipulate first before send to the browser.
```js
cache: {
  'amazon.com': {
    contentType: ['json'], //required! 
    resp({status, headers, body}) {
      return {body} //can be {} or combination of {status, headers, body}
    },    
  }
},
```

## Log
Save the response to your local disk. by default contentType `json` will log complete request / response, for different type default log should be response payload. 

Special usacase like google-analytic will send contentType of `gif` with [GET] request, and response payload is not needed, there is an option `log` to force log with json complete request / response.  
```js
log: {
  'amazon.com': {
    contentType: ['json']
  },
  'google-analytics.com/collect': {
    contentType: ['gif'],
    log: '<remove>',
  }
},
```
`log` support `resp` function, it means the result can be manipulate first before send to the browser.
```js
log: {
  'amazon.com': {
    contentType: ['json'], //required! 
    resp({status, headers, body}) {
      return {body} //can be {} or combination of {status, headers, body}
    },    
  }
},
```

## Html
Manipulate the response.

Basic rule: replace **response body** with **the matcher** value 
```js
html: {'twitter.net': ''},
```

`resp` rule: manipulate **response** with return value of `resp` *function*
```js
html: {
  'twitter.com/home': {
    resp({status, headers, body}) {
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

## Json
Manipulate the response.

Basic rule: replace **response body** with **the matcher** value 
```js
json: {'twitter.net': '{}'},
```

`resp` rule: manipulate **response** with return value of `resp` *function*
```js
json: {
  'twitter.com/home': {
    resp({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```

## Css
Manipulate the response.

Basic rule: replace **response body** with **the matcher** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const style = 'body: {color: red}';
...
css: {'twitter.net': style}, //or `=>${style}`
```

`resp` rule: manipulate **response** with return value of `resp` *function*
```js
css: {
  'twitter.com/home': {
    resp({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```

## Js
Manipulate the response.

Basic rule: replace **response body** with **the matcher** value -or- add to the end of response body by adding FAT arrow syntax `=>${style}`
```js
const code = 'alert(0);'
...
js: {'twitter.net': code}, //or `=>${code}`
```

`resp` rule: manipulate **response** with return value of `resp` *function*
```js
js: {
  'twitter.com/home': {
    resp({status, headers, body}) {
      ....
      return {body} //can be {} or combination of {status, headers, body}
    },
  },
},
```

# HTTP_PROXY & NO_PROXY
mitm-play support env variable **HTTP_PROXY** and **NO_PROXY** if your system required proxy to access internet.

# User Route
[User-route](https://github.com/mitm-proxy/user-route) are available on this repo: https://github.com/mitm-proxy/user-route and it should be taken as an experiment to test `mitm-play` functionality. 

If you think you have a nice routing want to share, you can create a PR to the [user-route](https://github.com/mitm-proxy/user-route) or add a `link` to your repo.  

# Early Stage
Expect to have some changes in code as feature/fix incrementally committed.

.

Goodluck,
>*-wharsojo*.
