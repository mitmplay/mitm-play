# mitm-play
Man in the middle using playwright

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

routes = {
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
mitm-play --go='google.com/search?q=covid-19' --route='.' --save

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

Illustration route namespaces: `default`, `google.com` on nodejs global scope:  
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
# User Route
[User-route](https://github.com/mitm-proxy/user-route) are available on this repo: https://github.com/mitm-proxy/user-route and it should be taken as an experiment to test `mitm-play` functionality. 

If you think you have a nice routing want to share, you can create a PR to the [user-route](https://github.com/mitm-proxy/user-route) or add a `link` to your repo.  

# Early Stage
Expect to have some changes in code as feature/fix incrementally committed.

.

Goodluck,
>*-wharsojo*.
