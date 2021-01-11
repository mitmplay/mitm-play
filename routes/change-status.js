function changeStatus(match, resp) {
  const status = match.key.match(/#(\d+)/) // feat: tags in url
  if (status && status[1]) {
    resp.status = +(status[1].slice(0,3).padEnd(3, '0'))
  } 
}
module.exports = changeStatus