const kcode1 = {
  Backquote: '`',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Comma    : ',',
  Period   : '.',
  Quote    : "'",
  Semicolon: ';',
  Slash    : '/',
  Space    : ' ',
  Minus    : '-',
  Equal    : '=',
}

const kcode2 = {
  Backquote: '~',
  BracketLeft: '{',
  BracketRight: '}',
  Backslash: '|',
  Comma    : '<',
  Period   : '>',
  Quote    : '"',
  Semicolon: ':',
  Slash    : '?',
  Space    : ' ',
  Minus    : '_',
  Equal    : '+',
}

const kcode3 = {
  1: '!',
  2: '@',
  3: '#',
  4: '$',
  5: '%',
  6: '^',
  7: '&',
  8: '*',
  9: '(',
  10: ')'
}

module.exports = (evn, opt={codeOnly:false}) => {
  const {code, shiftKey} = evn
  const {codeOnly} = opt
  let match
  let char = ''
  match = code.match(/Key(.)/)
  if (match) {
    char = match.pop()
    if (!codeOnly && !shiftKey) {
      char = char.toLowerCase()
    }
  } else {
    match = code.match(/(Digit|Numpad)(.)/)
    if (match) {
      char = match.pop()
      if (!codeOnly && shiftKey) {
        char = kcode3[char]
      }
    } else {
      if (!codeOnly && shiftKey) {
        char = kcode2[code]
      } else {
        char = kcode1[code]
      }
    }
  }
  return char
}
