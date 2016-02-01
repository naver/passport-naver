/**
 * Parse Profile of User
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */

var Profile = module.exports = exports = {};
Profile.parse = function parseProfile (obj) {
    if (typeof obj === 'string') {
        obj = JSON.parse(obj);
    }

    var profile = {};

    profile.id = obj['enc_id'];
    // @note Caution! This is *NOT* Realname!
    profile.displayName = obj['nickname'];
    profile.emails = [{ value: obj.email }];

    return profile
};