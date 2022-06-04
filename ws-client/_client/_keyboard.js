const kcode1 = {
  Backquote   : '`',
  BracketLeft : '[',
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
  Backquote   : '~',
  BracketLeft : '{',
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

const kshow = {
  ...kcode1,
  Enter: 'Enter',
  CapsLock: 'Caps',
  Backspace: 'BS',
  Escape: 'Esc',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Digit0: '0',
  Tab: 'Tab',
  KeyA: 'a',
  KeyB: 'b',
  KeyC: 'c',
  KeyD: 'd',
  KeyE: 'e',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyI: 'i',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  KeyM: 'm',
  KeyN: 'n',
  KeyO: 'o',
  KeyP: 'p',
  KeyQ: 'q',
  KeyR: 'r',
  KeyS: 's',
  KeyT: 't',
  KeyU: 'u',
  KeyV: 'v',
  KeyW: 'w',
  KeyX: 'x',
  KeyY: 'y',
  KeyZ: 'z',
  F1:  'F1',
  F2:  'F2',
  F3:  'F3',
  F4:  'F4',
  F5:  'F5',
  F6:  'F6',
  F7:  'F7',
  F8:  'F8',
  F9:  'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  End: 'End',
  Home: 'Home',
  ArrowUp:    '↑',
  ArrowDown:  '↓',
  ArrowLeft:  '←',
  ArrowRight: '→',
  Delete:   'Del',
  PageUp:   'PgUp',
  PageDown: 'PgDn',
}

function codeToChar(evn, opt={codeOnly:false}) {
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

function codeToShow(codes) {
  return codes.split(':').map(x=>{
    return `${kshow[x]}`
  }).join('✧')
}

window.mitm.fn.codeToChar = codeToChar
window.mitm.fn.codeToShow = codeToShow
module.exports = {
  codeToChar,
  kcode1,
  kcode2,
  kcode3,
  kshow
}