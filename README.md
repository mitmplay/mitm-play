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
      el: 'e_end', // JS at end of 
      js: [googlJS, hello], // html body
    },
  },
  js: {
    'gstatic.com': ''
  }
}
global.mitm.fn.routeSet(routes, domain, true)
```

```bash
# run the demo:
mitm-play --go='google.com/search?q=covid-19' --route=. --save

# next run should be simple as:
mitm-play
```

# Features
* `skip` __request__ back to browser - browser will handle it   
* `log` __response__ based on `url` - call to remote server
* `mock` __response__ based on `url` - no call to remote server
* `cache` __response__ based on `url` - subsequence call read from cache
* Update __response__ based on `url` and `content-type` - call remote server
  * `html` - resp - add js on &lt;head&gt; or end of &lt;body&gt;
  * `json` - resp - response modification
  * `css` - resp - response modification
  * `js` - res - response modification


# Concept
Mitm intercept is hierarchical, first it try to match domain on the url, if match then next action is to url regex expression on each content-type listed on the route and if it match again, then will execute an action that register in the route.

If the first action is not match, then it will fallback to use `default` namespace to check next action, and the operation is the same as mention in first paragraph. 

Usually html page load with several assets (image, js & css) that not belong to the same domain, and to match those assets, it use mechanism in the browser call `origin` or `referer` in which will scoping to the same namespace.

In `google.com` route, it have `js` content type; the action narrate as: if there is a JS assets come from `gstatic.com`, then content will get replace with an empty string.

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
