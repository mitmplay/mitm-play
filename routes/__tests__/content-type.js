const {ctype} = require('../content-type');

const {
  test, 
  expect,
  describe, 
} = global;

describe('name-space.js - function', () => {
  test('return namespace exist or not', () => {
    const match = {
      route: {contentType: ['json']},
      contentType: {json: /json/},
    }
    const resp1 = {headers: {'content-type': 'application/json'}};
    const resp2 = {headers: {}};

    expect(ctype(match, resp1)).toBe('json');
    expect(ctype(match, resp2)).toBe(undefined);
  })
})
