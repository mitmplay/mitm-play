const fs = require('fs-extra');

module.exports = () => ({
  generateBundle({ file }, _, isWrite) {
    if (isWrite) {
      setTimeout(() => {
        let body = fs.readFileSync(file)+'';
        body = body.replace('module.exports = src;', 'src();');
  
        fs.writeFile(file, body, err => {
          err && console.log('>> Error write bundle', err);
        })      
      }, 10);
    }
  }
})