// create file: ~/user-route/_global_/index.js & add this content:
const route = {
  tags: [],
  'flag:no-logs': {
    'referer-reqs': false,
    'no-namespace': false,
    'ws-connect': true,
    'ws-message': true,
    'page-load': true,
  }
}
module.exports = route;