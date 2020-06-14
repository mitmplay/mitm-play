const addReplaceBody = require('../add-replace-body');

const {
  test, 
  expect,
  describe, 
} = global;

describe('add-replace-body.js - function', () => {
  test('return replace or added content', () => {
    const resp1 = addReplaceBody('Original',  {route: ':Replaced'} );
    const resp2 = addReplaceBody('Original',  {route: '=>:Added'} );

    expect(resp1).toBe(':Replaced');
    expect(resp2).toBe('Original:Added');
  })
})