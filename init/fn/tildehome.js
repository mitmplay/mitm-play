let _home;
const {platform, env: {HOME, HOMEPATH}} = process;
if (platform==='win32') {
  _home = HOMEPATH.replace(/\\/g, '/');
  if (!_home.match(/^[^:]:/)) {
    _home = `${process.cwd().match(/^[^:]/)[0].toUpperCase()}:${_home}`;
  }
} else {
  _home = HOME;
}

function tilde(path) {
  return path.replace(_home, '~');
}

function home(path) {
  return path.replace('~', _home);
}

module.exports = {
  tilde,
  home
};
