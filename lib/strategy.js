/**
 * Module dependencies.
 */
var util = require('util'),
	_ = require('underscore'),
	Profile = require('./profile'),
	OAuth2Strategy = require('passport-oauth').OAuth2Strategy, 
	InternalOAuthError = require('passport-oauth').InternalOAuthError,
	NaverAPIError = require('./errors/naverapierror');
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

	this._profileURL = options.profileURL || 'https://openapi.naver.com/v1/nid/me';
	this._oauth2.setAccessTokenName('access_token');
};
 
/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Return extra parameters to be included in the authorization request.
 */
Strategy.prototype.authorizationParams = function (options) {
	// Do not modify `options` object.
	// It will hurts original options object which in `passport.authenticate(..., options)`
	var params = _.extend({}, options);
	params['response_type'] = 'code';


	// @see https://github.com/naver/passport-naver/commit/2d88b7aeb14ce04db81a145b2933baabba80612b
	// @see http://gamedev.naver.com/index.php/%EC%98%A8%EB%9D%BC%EC%9D%B8%EA%B2%8C%EC%9E%84:OAuth_2.0_API
	if (this.__options.svcType !== undefined) params['svctype'] = this.__options.svcType;
	// @see https://github.com/naver/passport-naver#re-authentication
	if (this.__options.authType !== undefined) params['auth_type'] = this.__options.authType;

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
		// @note Naver API will response with status code 200 even API request was rejected.
		// Thus, below line will not executed until Naver API changes.
		if (err) { return done(new InternalOAuthError('Failed to fetch user profile', err)); }


		// parse the user profile API Response to JSON object
		var parsed = null;
		try{
			parsed = JSON.parse(body);
			//console.log(parsed);
		} catch (err) {
			return done(new InternalOAuthError('Failed to parse API response', err));
		}
		var resultcode = parsed.resultcode;
		var resultmessage = parsed.message;
		var resultbody = parsed.response;

		// API Response was parsed successfully, but there are no informative data.
		// e.g. API Server was respond with empty response
		if( !(resultcode && resultmessage) ){
			return done(new InternalOAuthError('Empty API Response'));
		}

		// Naver API Server was respond with unsuccessful result code.
		// See detail response code to https://developers.naver.com/docs/login/profile
		if( resultcode != "00" ){ 
			return done(new NaverAPIError(resultmessage, resultcode));
		}
		

		var profile = { provider: 'naver' };
		profile.id = resultbody.id;
		profile.displayName = resultbody.nickname;
		profile.emails = [{ value: resultbody.email }];
		profile._json = {
			email: resultbody.email,
			nickname: resultbody.nickname,
			profile_image: resultbody.profile_image,
			age: resultbody.age,
			birthday: resultbody.birthday,
			id: resultbody.id	// User Unique ID (not naver id)
		};
	
		done(null, profile);

	});
};

/**
* Expose `Strategy`.
*/
module.exports = Strategy;
