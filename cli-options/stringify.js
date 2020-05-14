function isObjLiteral(_obj) {
  var _test  = _obj;
  return (  typeof _obj !== 'object' || _obj === null ?
    false :  
    (
      (function () {
        while (!false) {
          if (  Object.getPrototypeOf( _test = Object.getPrototypeOf(_test)  ) === null) {
            break;
          }      
        }
        return Object.getPrototypeOf(_obj) === _test;
      })()
    )
  );
}

function stringify(obj, i=0) {
  let tab = ' '.repeat(i);
  let out = '';
  for (let p in obj) {
    let ins = '';
    out += i==2 ? `${tab}'${p}': ` : `${tab}${p}: `;
    const nod = obj[p];
    if (Array.isArray(nod)) {
      ins = `[\n${stringify(nod, i+2)}${tab}]\n`;
    } else if (isObjLiteral(nod)) {
      ins = `{\n${stringify(nod, i+2)}${tab}}\n`;
    } else if (typeof(nod==='function')) {
      ins = (nod+'').replace(/\n/g,`\n${tab}`)+`\n`;
    } else {
      ins = nod+ '\n';
    }
    out += ins;
  }
  return out;
}

module.exports = stringify