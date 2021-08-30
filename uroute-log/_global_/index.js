const route = {
  cache: {'/': {contentType: ['script', 'css']}},
  log:   {'/': {contentType: ['json']}},
  flag: {
    'referer-reqs': true,
    'no-namespace': true,
    'ws-broadcast': true,
    'ws-connect': true,
    'ws-message': true,
    'frame-load': true,
    'page-load': true
  }
}
module.exports = route;
