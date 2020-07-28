const hello = function() {
  console.log('Hello from mimt-play');
};

const mock = function() {
  return {body: 'Hi there!'}
};

const resp = () => {};

module.exports = {
  hello,
  mock,
  resp,
}
