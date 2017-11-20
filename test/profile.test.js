const expect = require('chai').expect
const fs = require('fs'),
      parse = require('../lib/profile').parse;

describe('example profile', () => {
  var profile;
  before((done) => {
    fs.readFile('test/data/profileTestExample.json', 'utf8', (err, data) => {
      if (err) { return done(err); }
      profile = parse(data);
      done();
    });
  });
  
  it('should parse profile', () => {
    expect(profile.id).to.equal(1);
    expect(profile.displayName).to.equal('네이버 사용자');
    expect(profile.emails).to.have.length(1);
    expect(profile.emails[0].value).to.equal('passport_test@naver.com');
  });
});
