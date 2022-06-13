function getColor(el) {
  const {color, backgroundColor} = getComputedStyle(el)
  return [color, backgroundColor]
}

function _rgb(rgb) {
  const [r,g,b] = rgb.match(/\d+/g).map(x=>+x)
  return [r,g,b]
}

function _check(color) {
  if (color <= 0.03928) {
    return (color / 12.92)
  } else {
    return (Math.pow(((color + 0.055)/1.055), 2.4))
  }
}

const _hex = x => x.toString(16).padStart(2, '0')

function rgbToHex(rgb) {
  return '#' + _rgb(rgb).map(_hex).join('')
}

function luminance(rgb) {
  let [r,g,b] = _rgb(rgb)
  r = 0.2126  * _check(r/255)
  g = 0.7152  * _check(g/255)
  b = 0.0722  * _check(b/255)
  return r + g + b
}

function contrast(rgbF, rgbB) {
  const luminanceF = luminance(rgbF)
  const luminanceB = luminance(rgbB)

  let lght
  let dark
  if (luminanceF >= luminanceB) {
    lght = luminanceF
    dark = luminanceB
  } else {
    lght = luminanceB
    dark = luminanceF
  }
  const _ratio = (
    (lght + 0.05) / 
    (dark + 0.05)
  ).toFixed(2)
  
  const f = rgbToHex(rgbF)
  const b = rgbToHex(rgbB)
  console.log([
    `f:${rgbF}`.padEnd(23, ' ')+`-> ${f}`,
    `b:${rgbB}`.padEnd(23, ' ')+`-> ${b} => contrast ratio:${_ratio}`
  ].join('\n'))

  return _ratio
}

module.exports = {
  getColor,
  contrast,
  rgbToHex,
  luminance,
}
