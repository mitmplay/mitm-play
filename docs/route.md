# Routing explain

## Cache route
The routing cache stores recently used routing payload entries in local computer files.

Minimum requirement is to add regex *`route url`* ('example1.com/with/path') with empty object *`{}`* .

Add *`contentType`* ('example2.com') to filter into specific content type.

Cache file and folder structure is based on url and sometime url (minus `querystring`) is not uniq, additional key *`querystring`* is introduced, internally: Calculate a hash (aka message digest) of `querystring` and add it to filename. 

**be aware of cache busting url** as it will create useless cache, don't use  *`querystring`*, use only the regex *`route url`*.
```js
cache: {
  'example1.com/with/path': {},
  'example2.com': {
    contentType: ['javascript','svg'],
    querystring: true
  }
},
```

use cases are by exanple:
* remove advertising contents

## Remove Advertising Contents
the way advertising are implemented usually with an iframe and mitm-play have a builtin logs to see all the iframe (mitm-play websocket-logs). first we need to `allow http: websocket communication` by remove `https` key on CSP 
```js
// folder: zdnet.com
const domain =  __dirname.split(/\\|\//).pop();

routes = {
  html: {
    // relax CSP rules
    'zdnet.com': {response: global.mitm.fn.unstrictCSP}
  }, 
}

global.mitm.fn.routeSet(routes, domain, true)
```
run `mitm-play`:
```js
mitm-play --url='www.zdnet.com/topic/developer/' --save
mitm-play --su='www.zdnet.com/topic/developer/'
```
Need to Identify the created `iframe` and try to empty the JS request and check request which having `error request` then skip it.
<pre>
>> wsclients: [
  'www.zdnet.com:window',
  'www.lightboxcdn.com:iframe',
  'securepubads.g.doubleclick.net:iframe',
  'www.everestjs.net:iframe',
  'www.google.com:iframe'
]</pre>

```js
const routes = {
  skip: [
    // skip error `request back` to browser to handle it
    'ad.doubleclick.net/ddm/ad/',
  ],
  js: {
    // remove advertising
    'lightboxcdn.com': '',
    'doubleclick.net': '',
    'everestjs.net': '',
    'google.com': '',
    'demdex.net': '',
    'ml314.com': '',
  },
}
```
some partner content embeded on page that can be remove by inject additional css
```js
const css = `
[data-component="taboola"],
.taboola-right-rail,
.related-topics {
  display: none !important;
}`;

const routes = {
  ...,
  css: {
    // remove partner content
    'zdnet4.cbsistatic.com': `=>${css}`
  },
}
```
### End Result
```js
const domain =  __dirname.split(/\\|\//).pop();

const css = `
.col-8.module.featuredStories,
[data-component="medusaAsync"],
[data-component="taboola"],
.shortcode.video.large,
.dynamic-showcase-top,
.article.item.promo,
.taboola-right-rail,
.featured-carousel,
.related-topics,
.item.promo,
.QSIPopOver {
  display: none !important;
}
.module.mostPopular {
  margin-top: 0 !important;
}`;

routes = {
  title: 'Developer - zdnet',
  url: 'https://www.zdnet.com/topic/developer/',
  html: {
    // relax CSP rules
    'zdnet.com': {response: global.mitm.fn.unstrictCSP}
  },  
  skip: [
    // skip error `request back` to browser to handle it
    'ad.doubleclick.net/ddm/ad/'
  ],
  js: {
    // remove advertising
    'lightboxcdn.com': '',
    'doubleclick.net': '',
    'everestjs.net': '',
    'demdex.net': '',
    'google.com': '',
  },
  css: {
    // remove partner content
    'zdnet4.cbsistatic.com': `=>${css}`
  },
}
global.mitm.fn.routeSet(routes, domain, true)
```
