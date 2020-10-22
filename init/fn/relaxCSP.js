function relaxCSP ({ headers }) {
  const csp = headers['content-security-policy']
  csp && (csp[0] = csp[0].replace(/'(strict)[^ ]+/g, ''))
  csp && (csp[0] = csp[0].replace(/default-src [^;]+;/, ''))
  return { headers }
}

module.exports = relaxCSP
