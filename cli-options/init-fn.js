const fs = require('fs-extra');
const fg = require('fast-glob');
const c = require('ansi-colors');
const chokidar = require('chokidar');
const stringify = require('./stringify');
const {
  exec: _exec, 
  execFile: _execFile,
} = require('child_process');

function tldomain(fullpath) {
  let fp;
  if (fullpath.match(/^chrome/)) {
    return fullpath;
  }
  try {
    fp = fullpath.match(/^\w+:\/\/([\w.]+)/);
    if (fp) {
      fp = fp[1].
      split('.').reverse().
      slice(0,3).reverse().
      join('.');    
    } else {
      fp = '**tld-error**';  
      console.log(c.redBright(`>> Error tldomain ${fullpath}`));
    }
  } catch (error) {
    fp = '**tld-error**';
    console.log(c.redBright(`>> Error tldomain ${fullpath}`));
    console.log(error);
  }
  return fp.replace('www.', '');
}

function unstrictCSP({headers}) {
  let csp = headers['content-security-policy'];
  csp && (csp[0] = csp[0].replace(/'(strict)[^ ]+/g, ''));
  csp && (csp[0] = csp[0].replace(/default-src [^;]+;/, ''));
  return {headers}
}

function routeSet(routes, namespace, print=false) {
  mitm.routes[namespace] = routes;
  if (namespace==='default') {
    mitm.routes.default.mock = {
      ...mitm.routes.default.mock,
      ...global.mitm.__mock
    }
  }
  const msg = `>> ${namespace}\n${stringify(mitm.routes[namespace])}`;
  print && console.log(msg);
  return routes;
};

const load = function(path) {
  console.log('>> userroute', path);
  const rpath = require.resolve(path);
  if (require.cache[rpath]) {
    delete require.cache[rpath];
  }
  return require(path);
}

const loadJS = function(path, log) {
  const {clear} = global.mitm.fn;
  console.log(log);
  load(path);
  clear();
}

function clear() {
  const {clear:c} = global.mitm.argv;
  (c===true || c==='cache') && fs.remove(`${mitm.home}/cache`);
  (c===true || c==='log') && fs.remove(`${mitm.home}/log`);
}

function home(path) {
  const {platform, env: {HOME, HOMEPATH}} = process;
  const home = (platform === 'win32' ? HOMEPATH.replace(/\\/g, '/') : HOME);
  return path.replace('~', home);
}

function _stdout({error, stdout, stderr, fn}) {
  stdout && console.log(`stdout: ${stdout}`);
  stderr && console.error(`stderr: ${stderr}`);
  error && console.error(`exec error: ${error}`);
  fn && fn();
}

function exec() {
  const args = [].slice.call(arguments);
  let fn;
  if (typeof(args[args.length-1])==='function') {
    fn = args.pop();
  }  
  args.push((error, stdout, stderr) => {
    _stdout({error, stdout, stderr, fn})
  });
  _exec.apply(this, args);
}

function execFile() {
  const args = [].slice.call(arguments);
  let fn;
  if (typeof(args[args.length-1])==='function') {
    fn = args.pop();
  }
  args.push((error, stdout, stderr) => {
    _stdout({error, stdout, stderr, fn})
  }); 
  _execFile.apply(this, args);
}

let debunk;
let urlList = [];
function html5vid({url}, fn) {
  if (url.match(/.ts$/)) {
    urlList.push(url.replace(/https:\//, `${mitm.home}/cache`));
    debunk && clearTimeout(debunk);
    debunk = setTimeout(function() {
      clearTimeout(debunk);
      const files = urlList;
      urlList = [];
      const arr = files[0].match(/(\d+)\/(pu\/vid|vid)/);
      if (fs.existsSync(`${arr[1]}.mp4`)) {
        return;
      }
      if (arr && arr[1]) {
        const tsList = [];
        for (let file of files) {
          if (file.match(arr[1])) {
            tsList.push(`file '${file}'`);
          }
        }
        fs.writeFileSync(`${arr[1]}.txt`, tsList.join('\n'));
        execFile('ffmpeg', `-f concat -safe 0 -i ${arr[1]}.txt -c copy ${arr[1]}.ts`.split(' '), () => {
          execFile('ffmpeg', `-i ${arr[1]}.ts -acodec copy -vcodec copy ${arr[1]}.mp4`.split(' '), () => {
            fs.remove(`${arr[1]}.txt`);
            fs.remove(`${arr[1]}.ts`);
            fn && fn();
          });
        });
        //console.log(arr);
      }
    }, 1500)
  }
}

const hello = function() {
  console.log('Hello from mimt-play');
};

const mock = function() {
  return {body: 'Hi there!'}
};

const resp = () => {};

module.exports = () => {
  global.mitm.fn = {
    unstrictCSP,
    stringify,
    chokidar,
    tldomain,
    routeSet,
    execFile,
    html5vid,
    loadJS,
    clear,
    hello,
    home,
    mock,
    resp,
    exec,
    fg,
    fs,
    c,
  }
}
