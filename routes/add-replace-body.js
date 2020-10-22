function addReplaceBody (body, match) {
  const token = match.route.match(/^[ \n]*=>/)
  if (token) {
    body += match.route.replace(token[0], '')
  } else {
    body = match.route
  }
  return body
}

module.exports = addReplaceBody
