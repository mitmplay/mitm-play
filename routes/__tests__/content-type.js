const contentType = require('../content-type');

const {
  test, 
  expect,
  describe, 
} = global;

describe('name-space.js - function', () => {
  test('return namespace exist or not', () => {
    const regex = /json/
    const match = {
      route: {contentType: ['json']},
      contentType: [regex],
    }
    const resp1 = {headers: {'content-type': 'application/json'}};
    const resp2 = {headers: {}};

    expect(contentType(match, resp1)).toBe('json');
    expect(contentType(match, resp2)).toBe(false);
  })
})