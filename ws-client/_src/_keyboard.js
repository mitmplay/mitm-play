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

module.exports = evn => {
  const {code} = evn
  let match
  let char = ''
  match = code.match(/Key(.)/)
  if (match) {
    if (evn.shiftKey) {
      char = match.pop()
    } else {
      char = match.pop().toLowerCase()
    }
  } else {
    match = code.match(/(Digit|Numpad)(.)/)
    if (match) {
      char = match.pop()
      if (evn.shiftKey) {
        char = kcode3[char]
      }
    } else {
      if (evn.shiftKey) {
        char = kcode2[code]
      } else {
        char = kcode1[code]
      }
    }
  }
  return char
}
