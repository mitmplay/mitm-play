const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const inject = require('./inject');
const {xtype} = require('./content-type');

const {matched,searchFN} = _match;
const {source} = inject;

const mock = () => {
  return {
    status: 200,
    headers: {
      'content-type': 'text/plain',
    },
    body: ''
  }
};

function mockResponse({reqs, route}, _3d) {
  const search = searchFN('mock', reqs);
  const match = _3d ? search('_global_') : matched(search, reqs);
  const {logs} = global.mitm.routes._global_.config;
  if (match) {
    const {response, file, js} = match.route;
    if (logs.mock) {
      if (!match.url.match('/mitm-play/websocket')) {
        console.log(c.cyanBright(match.log));
      }
    }
    let resp = mock();
    if (typeof(match.route)==='string') {
      resp.body = match.route;
    } else {          
      if (response || file || js) {
        if (response) {
          const resp2 = response(resp);
          resp2 && (resp = {...resp, ...resp2});
        } else if (file) {
          const ext = file.match(/\.(\w+)$/);
          if (ext) {
            const fpath = (match.workspace || '') + file;
            resp.body = `${fs.readFileSync(fpath)}`;
            resp.headers['content-type'] = xtype[ext[1]];
          } else {
            console.log(c.redBright('>> ERROR: Need a proper file extension'));
          }
        } else if (js) {
          resp.body = source(resp.body, js);
          resp.headers['content-type'] = 'application/javascript';
        }
      } else {
        resp.body = 'Hello mock! - mitm-play';
      }
    }
    route.fulfill(resp);
    return true;
  }
}

module.exports = mockResponse;
//https://github.com/microsoft/playwright/blob/master/docs/api.md#routefulfillresponse