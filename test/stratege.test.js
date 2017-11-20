const expect = require('chai').expect
const assert = require('chai').assert
const NaverStrategy = require('../lib/strategy');

describe('Strategy', () => {
  var strategy = new NaverStrategy({
    clientID: 'ABC123',
    clientSecret: 'secret'
  },
  () => {});
  
  it('should be named naver', () => {
    expect(strategy.name).to.equal('naver');
  });

  it('should be typeOf string', () => {
    assert.typeOf(strategy.name, 'string')
  });  
})