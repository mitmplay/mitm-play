function isObjLiteral (_obj) {
  /* eslint-disable no-constant-condition */
  var _test = _obj
  return (typeof _obj !== 'object' || _obj === null
    ? false
    : (
        (function () {
          while (true) {
            _test = Object.getPrototypeOf(_test)
            if (Object.getPrototypeOf(_test) === null) {
              break
            }
          }
          return Object.getPrototypeOf(_obj) === _test
        })()
      )
  )
}

function stringify (obj, i = 0, lf = '\n') {
  /* eslint-disable no-constant-condition */
  const tab = ' '.repeat(i)
  let out = ''
  for (const p in obj) {
    let ins = ''
    out += i === 2 ? `${tab}'${p}': ` : `${tab}${p}: `
    const nod = obj[p]
    if (Array.isArray(nod)) {
      const length = nod.length
      if (length === 0) {
        ins = `[],${lf}`
      } else if (length > 1 || typeof (nod[0]) === 'function') {
        ins = `[\n${stringify(nod, i + 2)}${tab}],\n`
      } else {
        ins = `[ ${stringify(nod, 0, '')} ],${lf}`
      }
    } else if (isObjLiteral(nod)) {
      if (Object.keys(nod).length) {
        ins = `{\n${stringify(nod, i + 2)}${tab}},\n`
      } else {
        ins = `{},${lf}`
      }
    } else if (typeof (nod) === 'function') {
      ins = (nod + '').replace(/\n/g, `\n${tab}`) + ',\n'
    } else if (typeof (nod) === 'string') {
      ins = `'${nod.replace(/\n/g, `\n${tab}  `)}',${lf}`
    } else {
      ins = `${nod}${lf}`
    }
    out += ins
  }
  return out
}

module.exports = o => {
  return stringify(o)
    .replace(/( \d+: | '\d+': )/g, ' ')
    .replace(/, \],/g, ' ],')
}
