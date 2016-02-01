/**
 * Module dependencies.
 */
var util = require('util'), 
	OAuth2Strategy = require('passport-oauth').OAuth2Strategy, 
	InternalOAuthError = require('passport-oauth').InternalOAuthError;
 
/**
 * `Strategy` constructor
 */
function Strategy(options, verify) {
	options = options || {};

	options.authorizationURL = options.authorizationURL || 'https://nid.naver.com/oauth2.0/authorize?response_type=code';
	if (options.svcType !== undefined) options.authorizationURL += '&svctype=' + options.svcType;
	if (options.authType !== undefined) options.authorizationURL += '&auth_type=' + options.authType;
	options.tokenURL = options.tokenURL || 'https://nid.naver.com/oauth2.0/token';
 
	OAuth2Strategy.call(this, options, verify);
	this.name = 'naver';
 
	this._oauth2.setAccessTokenName('access_token');
};
 
/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(Strategy, OAuth2Strategy);
 
/**
 * Retrieve user profile from Naver.
 */
Strategy.prototype.userProfile = function(accessToken, done) {
	// Need to use 'Authorization' header to save the access token information
	// If this header is not specified, the access token is passed in GET method.
	this._oauth2.useAuthorizationHeaderforGET(true);
 
	// User profile API
	this._oauth2.get('https://openapi.naver.com/v1/nid/me', accessToken, function (err, body, res) {
		if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

		try {
			var json = JSON.parse(body);;
			console.log(json);
			var resultcode = json.resultcode;
			var resultmessage = json.resultmessage;
			if( resultcode != "00" ){ //in case of "success". see detail response code to https://developers.naver.com/docs/login/profile
				return done(new InternalOAuthError('failed to fetch user profile. result:' + resultcode + "("+resultmessage+")"));
			}

			// Set Profile data. See detail profile data to https://developers.naver.com/docs/login/profile
			var profile = { provider: 'naver' };
			profile.id = json.response.id;
			profile.displayName = json.response.nickname;
			profile.emails = [{ value: json.response.email }];
			profile._json = {
				email: json.response.email,
				nickname: json.response.nickname,
				profile_image: json.response.profile_image,
				age: json.response.age,
				birthday: json.response.birthday,
				id: json.response.id	// User Unique ID (not naver id)
			};

			done(null, profile);

		} catch(e) {
			done(e);
		}
	});
};

/**
* Expose `Strategy`.
*/
module.exports = Strategy;
