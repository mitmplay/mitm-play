module.exports = () => {
  let {argv, fn: {clear}} = mitm;

  if (argv.h) {
    argv.help = argv.h;
    delete argv.h;
  }

  if (argv.g) {
    argv.go = argv.g;
    delete argv.g;
  }

  if (argv.r) {
    argv.route = argv.r;
    delete argv.r;
  }

  if (!argv.browser || ['firefox','webkit'].indexOf(argv.browser)===-1) {
    argv.browser = 'chromium';
  }

  if (argv.chromium) {
    delete argv.chromium;
    argv.browser = 'chromium';
  } else if (argv.firefox) {
    delete argv.firefox;
    argv.browser = 'firefox';
  } else if (argv.webkit) {
    delete argv.webkit;
    argv.browser = 'webkit';
  }

  if (argv.b) {
    argv.browser = argv.b;
    delete argv.b;
  }

  if (argv.p) {
    argv.pristine = argv.p;
    delete argv.p;
  }

  if (argv.l) {
    argv.logurl = argv.l;
    delete argv.l;
  }

  if (argv.c) {
    argv.clear = argv.c;
    delete argv.c;
  }

  if (argv.s) {
    argv.save = argv.s;
    delete argv.s;
  }
}
/*
* mitm-play -g='https://androidauthority.com' -r='D:/Projects/userscript' -cps
*/
