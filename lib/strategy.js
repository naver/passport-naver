/**
 * Module dependencies.
 */
var util = require('util'),
	xml2js = require('xml2js'),
	parseString = xml2js.parseString,
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
		// @note Naver API will response with status code 200 even API request was rejected.
		// Thus, below line will not executed until Naver API changes.
		if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

		// parse the user profile XML to JSON object
		parseString(body, { explicitArray: false }, function(err, parsed) {
			// something went wrong during parse XML Object.
			// e.g. Malformed XML string
			if (err) {
				return done(new InternalOAuthError('Failed to parse API response', err));
			}

			// XML String was parsed successfully, but there are no informative data.
			// e.g. API Server was respond with empty response
			if (!(parsed && parsed.data && parsed.data.result)) {
				return done(new InternalOAuthError('Empty API Response'));
			}

			// Naver API Server was respond with unsuccessful result code.
			if (parsed.data.result.resultcode !== '00') {
				return done(new NaverAPIError(parsed.data.result.message,
					parsed.data.result.resultcode));
			}

			var json = parsed.data.response;

			// compose the profile object
			var profile = Profile.parse(json);
			profile.provider = 'naver';
			profile._raw = body;
			profile._json = json;

			done(null, profile);
		});
	});
};

/**
* Expose `Strategy`.
*/
module.exports = Strategy;
