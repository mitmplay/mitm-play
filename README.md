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
}
global.mitm.fn.routeSet(routes, domain, true)
```

```bash
# run the demo:
mitm-play --go='https://www.google.com/search?q=covid-19' --clear --save

# next run should be simple as:
mitm-play
```

# Features
* `skip` __request__ back to browser   
* `mock` __response__ based on url & send
* `cache` __response__ based on Content-Type
* `log` any __response__ based on Content-Type
* Update __response__ based on url and Content-Type
  * `html` - can add js on &lt;head&gt; or end of &lt;body&gt;
  * `json`
  * `css`
  * `js`

The distribution include sample MITM route to google search & mock 

# Concept
Mitm interception use namespaces routing, for start it use `default` namespace for all request that don't have **referer** header. 

Next request in which should having `referer`, it will use the hostname on the `referer` header and use it to `matched` with one of `namespace` from the list and use that namespace for routing.

If matching namespace was not found, it will fallback to `default` namespace. 

Sample routes:
```js
// const googlJS = function() {..}
mitm.route = {
  'default':    {html: {...}},
  'google.com': {html: {...}},
}
```

