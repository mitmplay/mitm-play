const {platform, env: {HOME, HOMEPATH}} = process;
const _home = (platform === 'win32' ? HOMEPATH.replace(/\\/g, '/') : HOME);

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
