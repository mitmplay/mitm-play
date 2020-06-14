const routeMock = {
  fulfill() {
  }
};

const requestMock = {
  url: 'https://api.github.com',
  method: 'GET',
  body: null,
  headers: {
    'sec-ch-ua': '"Chromium";v="85", "\\\\Not;A\\"Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4149.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    cookie: '__cfduid=d9423b67018dd3bbbe585b1b03a2a0b921589764240; _scp=1589764246076.378747700; _ga=GA1.2.225076163.1589764247; __gads=ID=0e01896ba2078896:T=1589764246:S=ALNI_MbvZKYtMoSwjbBpB5Umn8flRChsZw; __qca=P0-610312227-1589765162379'
  },
}

module.exports = {
  routeMock,
  requestMock,
}
