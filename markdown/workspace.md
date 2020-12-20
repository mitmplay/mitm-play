# Workpsace

`workspace` property in which in same level as rule works similar as `path`, it was to remove the need to add `path` to  **mock** / **cache** rules

## Original 
```js
'cache:_test~03': {
  '/css/(_.+).css': {
    contentType: ['css'],
    path: '_assets_',
    file: ':1',
  }
},
```

## After adding `workspace` and remove the `path`
```js
workspace: '~/_assets_',
'cache:_test~03': {
  '/css/(_.+).css': {
    contentType: ['css'],
    file: ':1',
  }
},
```
or want to keep 'em all
```js
workspace: '/_cache_',
'cache:_test~03': {
  '/css/(_.+).css': {
    contentType: ['css'],
    path: '_assets_',
    file: ':1',
  }
},
```
