const routeMock = {
  fulfill() {
  }
};

const handlerMock = (resp) => {
  return resp;
}

const routeRequestMock = {
  url: "https://androidauthority.com/",
  method: "GET",
  body: null,
  headers: {
    "sec-ch-ua": "\"Chromium\";v=\"85\", \"\\\\Not;A\\\"Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4149.0 Safari/537.36",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    cookie: "__cfduid=d9423b67018dd3bbbe585b1b03a2a0b921589764240; _scp=1589764246076.378747700; _ga=GA1.2.225076163.1589764247; __gads=ID=0e01896ba2078896:T=1589764246:S=ALNI_MbvZKYtMoSwjbBpB5Umn8flRChsZw; __qca=P0-610312227-1589765162379"
  },
}

const responseFetchMock = {
  status: 301,
  body: '',
  headers: {
    raw: function() {
      return {
        "date": ["Thu, 21 May 2020 22:28:10 GMT"],
        "content-type": ["text/html; charset=UTF-8"],
        "transfer-encoding": ["chunked"],
        "connection": ["keep-alive"],
        "expires": ["Thu, 19 Nov 1981 08:52:00 GMT"],
        "pragma": ["no-cache"],
        "x-redirect-by": ["WordPress"],
        "location": ["https://www.androidauthority.com/"],
        "x-powered-by": ["WP Engine"],
        "x-cacheable": ["non200"],
        "cache-control": ["max-age=600, must-revalidate"],
        "x-cache": ["HIT: 2"],
        "x-cache-group": ["normal"],
        "cf-cache-status": ["DYNAMIC"],
        "expect-ct": ["max-age=604800, report-uri=\"https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct\""],
        "server": ["cloudflare"],
        "cf-ray": ["5971ba9a385901c4-SIN"],
        "cf-request-id": ["02daf2f45e000001c44aa84200000001"],
        "x-fetch-attempts": ["1"]
      }
    }
  }
}

module.exports = {
  routeMock,
  handlerMock,
  routeRequestMock,
  responseFetchMock,
}
