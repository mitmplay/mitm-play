// create file: ~/user-route/_global_/index.js & add this content:
const route = {
  tags: [],
  'flag:no-logs': {
    'referer-reqs': false,
    'no-namespace': false,
    'page-load': true,
  }
}
module.exports = route;