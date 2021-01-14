function _keyLength (a, b) {
  return b.length - a.length || // sort by length, if equal then
         a.localeCompare(b)     // sort by dictionary order
}

function _sortLength(obj) {
  const sorted = {}
  const arr = Object.keys(obj).sort(_keyLength)
  for (const str of arr) {
    sorted[str] = obj[str]
  }
  return sorted
}

function _sort(obj) {
  const sorted = {}
  const arr = Object.keys(obj).sort()
  for (const str of arr) {
    sorted[str] = obj[str]
  }
  return sorted  
}

module.exports = {
  _keyLength,
  _sortLength,
  _sort
}
