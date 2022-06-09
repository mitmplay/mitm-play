const route = {
  noskip: ['/mitm-play', '/'],
  skip  : ['.+'             ],
  html  : {
    '/' : {
      ws: true
    },
  },
  'args': {debug: false},
  'flag': {
    'referer-reqs': false,
    'no-namespace': false,
    'ws-connect': true,
    'ws-message': true,
    'frame-load': true,
    'page-load': true,
  }
}
module.exports = route;
