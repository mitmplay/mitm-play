const {
  exec: _exec, 
  execFile: _execFile,
} = require('child_process');

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

module.exports = {
  execFile,
  exec,
};