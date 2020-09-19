const fs = require('fs-extra');
const c = require('ansi-colors');
const _match = require('./match');
const inject = require('./inject');
const {xtype} = require('./content-type');

const {matched,searchFN} = _match;
const {source} = inject;

const mock = ({url}) => {
  return {
    url,
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
  const {fn: {skipByTag, home}, argv, routes, router} = global.mitm;

  if (match && !skipByTag(match, 'mock')) {
    const {response, file, js} = match.route;
    if (router._global_.config.logs.mock) {
      if (!match.url.match('/mitm-play/websocket')) {
        console.log(c.cyanBright(match.log));
      }
    }
    let resp = mock(reqs);
    if (typeof(match.route)==='string') {
      resp.body = match.route;
    } else {          
      if (response || file || js) {
        if (response) {
          const resp2 = response(resp, match);
          resp2 && (resp = {...resp, ...resp2});
        } else if (file) {
          const ext = file.match(/\.(\w+)$/);
          if (ext) {
            let fmatch, fpath; 
            if (fmatch = file.match(/^[\t ]*~\/(.+)/)) {
              fpath = home(`~/${fmatch[1]}`);
            } else if (fmatch= file.match(/^[\t ]*\.\.\/(.+)/)) {
              fpath = `${argv.route}/${fmatch[1]}`;
            } else if (fmatch = file.match(/^[\t ]*\.\/(.+)/)) {
              fpath = `${argv.route}/${match.namespace}/${fmatch[1]}`;
            } else {
              const {workspace: ws} = routes._global_;
              const workspace = match.workspace || ws;
              fpath = workspace ? `${workspace}/${file}` : file;  
            }
            resp.body = `${fs.readFileSync(home(fpath))}`;
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
