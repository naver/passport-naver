const expect = require('chai').expect
const strategy = require('..');

describe('passport-naver', function() {
    
  it('should export Strategy constructor directly from package', () => {
    expect(strategy).to.be.a('function');
    expect(strategy).to.equal(strategy.Strategy);
  });
  
  it('should export Strategy constructor', () => {
    expect(strategy.Strategy).to.be.a('function');
  });
  
});
