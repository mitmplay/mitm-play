# Workpsace

`workspace` property in which in same level as rule works similar as `path`, it was to remove the need to add `path` to  **mock** / **cache** rules

## Original 
internally parent `path` is `home` folder
```js
'cache:_test~03': {
  '/css/(_.+).css': {
    contentType: ['css'],
    path: '_assets_',
    file: ':1',
  }
},
```

## After adding `workspace`
Same result with above by removing `path` and add `workspace` property
```js
workspace: '~/_assets_',
'cache:_test~03': {
  '/css/(_.+).css': {
    contentType: ['css'],
    file: ':1',
  }
},
```
or the default path change from `home` folder to `root` folder
```js
workspace: '/',
'cache:_test~03': {
  '/css/(_.+).css': {
    contentType: ['css'],
    path: '_assets_',
    file: ':1',
  }
},
```
