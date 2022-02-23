function relaxCSP ({ headers }) {
  const csp1 = headers['content-security-policy']
  const csp2 = headers['content-security-policy-report-only']

  csp1 && (csp1[0] = csp1[0].replace(/'(strict)[^ ]+/g, ''))
  csp2 && (csp2[0] = csp2[0].replace(/'(strict)[^ ]+/g, ''))

  csp1 && (csp1[0] = csp1[0].replace(/default-src [^;]+;/, ''))
  csp2 && (csp2[0] = csp2[0].replace(/default-src [^;]+;/, ''))

  return { headers }
}

module.exports = relaxCSP
