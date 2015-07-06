/**
 * Module dependencies.
 */
var util = require('util'),
	xml2js = require('xml2js'),
	parseString = xml2js.parseString,
	OAuth2Strategy = require('passport-oauth').OAuth2Strategy, 
	InternalOAuthError = require('passport-oauth').InternalOAuthError;
 
/**
 * `Strategy` constructor
 */
function Strategy(options, verify) {
	options = options || {};

	options.authorizationURL = options.authorizationURL || 'https://nid.naver.com/oauth2.0/authorize';
	options.tokenURL = options.tokenURL || 'https://nid.naver.com/oauth2.0/token';

	// @todo Deprecate note: passing of `svcType`, `authType` param via constructor.
	// @see https://github.com/jaredhanson/passport-facebook#re-asking-for-declined-permissions
	this.__options = options;

	OAuth2Strategy.call(this, options, verify);
	this.name = 'naver';

	this._profileURL = options.profileURL || 'https://apis.naver.com/nidlogin/nid/getUserProfile.xml';
	this._oauth2.setAccessTokenName('access_token');
};
 
/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Return extra parameters to be included in the authorization request.
 */
Strategy.prototype.authorizationParams = function (params) {
	var options = this.__options;

	params = params || {};
	params['response_type'] = 'code';

	// @see https://github.com/naver/passport-naver/commit/2d88b7aeb14ce04db81a145b2933baabba80612b
	// @see http://gamedev.naver.com/index.php/%EC%98%A8%EB%9D%BC%EC%9D%B8%EA%B2%8C%EC%9E%84:OAuth_2.0_API
	if (options.svcType !== undefined) params['svctype'] = options.svcType;
	// @see https://github.com/naver/passport-naver#re-authentication
	if (options.authType !== undefined) params['auth_type'] = options.authType;

	return params;
};


/**
 * Retrieve user profile from Naver.
 */
Strategy.prototype.userProfile = function(accessToken, done) {
	// Need to use 'Authorization' header to save the access token information
	// If this header is not specified, the access token is passed in GET method.
	this._oauth2.useAuthorizationHeaderforGET(true);
 
	// User profile API
	this._oauth2.get(this._profileURL, accessToken, function (err, body, res) {
		if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

		try {
			// parse the user profile XML to JSON object
			var parser_options = { explicitArray: false };
			var xml2js = require('xml2js');
			var parser = new xml2js.Parser(body, parser_options);
			//console.log("body=");
			//console.log(body);
			var result = parser.parseString(body, function(err, result) {
				//console.log("result=");
				//console.log(result);
				var json = result.data.response[0];
				//console.log("json=");
				//console.log(json);
	
				// compose the profile object
				var profile = { provider: 'naver' };
				profile.id = json.enc_id[0];
	            profile.displayName = json.nickname[0];
	            profile.emails = [{ value: json.email[0] }];
	            json.id = json.enc_id[0];
	            profile._json = {
	            	email: json.email[0],
	            	nickname: json.nickname[0],
	            	enc_id: json.enc_id[0],
	            	profile_image: json.profile_image[0],
	            	age: json.age[0],
	            	birthday: json.birthday[0],
	            	id: json.enc_id[0] 
	            };
				profile._raw = body;
				//console.log('profile=');
				//console.log(profile);
				done(null, profile);
			});
		} catch(e) {
			done(e);
		}
	});
};

/**
* Expose `Strategy`.
*/
module.exports = Strategy;
