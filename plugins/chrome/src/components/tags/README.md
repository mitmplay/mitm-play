```js
JSON.stringify(mitm.__tag1,null,2)
{
  "R22": true,
  "cache-common": false,
  "global": true,
  "hidden": false,
  "item~1": false,
  "item~2": false,
  "remove-ads~1": true,
  "remove-ads~2": false
}
```

```js
JSON.stringify(mitm.__tag2,null,2)
{
  "cert~.secure.checkout.visa.com": {
    "cache:cache-common": false
  },
  "keybr.com": {
    "skip:hidden": false,
    "mock:R22": true,
    "mock:remove-ads~2": false,
    "item~1": false,
    "item~2": false,
    "css:remove-ads~1": true
  },
  "_global_": {
    "mock:global": true
  }
}
```

```js
JSON.stringify(mitm.__tag3,null,2)
{
  "cert~.secure.checkout.visa.com": {},
  "keybr.com": {
    "/assets/(\\w+.js)": {
      "cache": {
        "item~1": false
      },
      ":cache": "[javascript]<path,file>"
    },
    "/telemetry": {
      "log": {
        "item~2": true
      },
      ":log": "[text]"
    }
  },
  "_global_": {}
}
```