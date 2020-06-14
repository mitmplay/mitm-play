const {
  hashCode,
  filename,
  fileWithHash,
} = require('../file-util');

const {
  test, 
  expect,
  describe, 
} = global;

describe('file-util.js - hashCode - function', () => {
  test('return hash code of text', () => {
    const result = hashCode('Widi Harsojo');
    expect(result).toBe('1960247921');
  })
  test('return empty hash code of empty text', () => {
    const result = hashCode('');
    expect(result).toBe('');
  })
})

describe('file-util.js - fileWithHash - function', () => {
  test('return file with hash code', () => {
    const result = fileWithHash('Widi Harsojo;with-this-special-url-options');
    expect(result).toBe('Widi Harsojo-781355081');
  })
  test('return same text if no spliter identify', () => {
    const result = fileWithHash('Widi Harsojo');
    expect(result).toBe('Widi Harsojo');
  })
})

describe('file-util.js - filename - function', () => {
  test('return file with hash code', () => {
    const match = {
      pathname: '/one/two/three;Nicker-man;Lostworld',
      route: {
        querystring: true,
      }
    }
    const result = filename(match);
    expect(result).toBe('/one/two/hash--571922149');
  })
  test('return same text if no spliter identify', () => {
    const match = {
      pathname: '/one/two/three;Nicker-man;Lostworld',
      route: {
        querystring: true,
      }
    }
    const result = filename(match);
    expect(result).toBe('/one/two/hash--571922149');
  })
})
