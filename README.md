# Passport-Naver

[Passport](http://passportjs.org/) strategies for authenticating with [Naver](http://www.naver.com/)
using OAuth 2.0.

This module lets you authenticate using Naver in your Node.js applications.
By plugging into Passport, Naver authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-naver

## Usage of OAuth 2.0

#### Configure Strategy

The Naver OAuth 2.0 authentication strategy authenticates users using a Naver
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a client ID, client secret, and callback URL.

    var NaverStrategy = require('passport-naver').Strategy;

    passport.use(new NaverStrategy({
            clientID: config.naver.clientID,
            clientSecret: config.naver.clientSecret,
            callbackURL: config.naver.callbackURL
		},
        function(accessToken, refreshToken, profile, done) {
            User.findOne({
                'naver.id': profile.id
            }, function(err, user) {
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.displayName,
                        provider: 'naver',
                        naver: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));


#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'naver'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    // Setting the naver oauth routes
    app.route('/auth/naver')
        .get(passport.authenticate('naver', {
            failureRedirect: '#!/auth/login'
        }), users.signin);

    // creates an account if no account of the new user
    app.route('/auth/naver/callback')
        .get(passport.authenticate('naver', {
            failureRedirect: '#!/auth/login'
        }), users.createAccount, users.authCallback);


#### Re-authentication

Re-authentication is the act of asking a user to re-enter their Naver password whenever they sign in your service. This is useful to prevent man-in-the-middle hijacking while the user session of Naver is alive.

Here is an example that triggers re-authentication using an authType:

    passport.use(new NaverStrategy({
            clientID: config.naver.clientID,
            clientSecret: config.naver.clientSecret,
            callbackURL: config.naver.callbackURL,
            svcType: 0,
            authType: 'reauthenticate'  // enable re-authentication
        },


## App Registration for the Secret Generation

You need to register your application from Naver Developer Center.
<[Naver Developer Center](https://developer.naver.com/openapi/register/login.nhn)>

You can get client id & secret for your application after the approval process of Naver Corp.

After the client id & secret are issued, assign them to the following variables.
  
            clientID: config.naver.clientID,
            clientSecret: config.naver.clientSecret,
            callbackURL: config.naver.callbackURL,


## Examples

You can execute the following application from the 'examples' directory.
	
	$ npm install 
	$ node app.js

	var express = require('express')
		, passport = require('passport')
		, session = require('express-session')
		, NaverStrategy = require('../lib/index.js').Strategy;
		
	var client_id = '************ your app client id ************';
	var client_secret = '************ your app client secret ************';
	var callback_url = '************ your app callback url ************';
	
	passport.serializeUser(function(user, done) {
		done(null, user);
	});
	
	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});
	
	passport.use(new NaverStrategy({
	    clientID: client_id,
	    clientSecret: client_secret,
	    callbackURL: callback_url,
        svcType: 0  // optional. see http://gamedev.naver.com/index.php/%EC%98%A8%EB%9D%BC%EC%9D%B8%EA%B2%8C%EC%9E%84:OAuth_2.0_API
	}, function(accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			//console.log("profile=");
			//console.log(profile);
			// data to be saved in DB
			user = {
				name: profile.displayName,
				email: profile.emails[0].value,
				username: profile.displayName,
				provider: 'naver',
				naver: profile._json
			};
			//console.log("user=");
			//console.log(user);
			return done(null, profile);
		});
	}));
	
	var app = express();
	
	app.use(session({secret: 'keyboard cat'}));
	app.use(passport.initialize());
	app.use(passport.session());
	
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views/');
	
	app.get('/', function(req, res){
		res.render('index', { user: req.user });
	});
	
	app.get('/account', ensureAuthenticated, function(req, res) {
		console.log(req.user);
		res.render('account', { user: req.user });
	});
	
	app.get('/login', function(req, res){
		res.render('login', { user: req.user });
	});
	
	// Setting the naver oauth routes
	app.get('/auth/naver', 
		passport.authenticate('naver', null), function(req, res) {
	    	console.log('/auth/naver failed, stopped');
	    });
	
	// creates an account if no account of the new user
	app.get('/auth/naver/callback', 
		passport.authenticate('naver', {
	        failureRedirect: '#!/auth/login'
	    }), function(req, res) {
	    	res.redirect('/'); 
	    });
	
	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});
	
	app.listen(3000);
	
	function ensureAuthenticated(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.redirect('/login');
	}


## Thanks to 

  - [Jared Hanson](http://github.com/jaredhanson)
  - Chanhee Kim(chanhee.kim@navercorp.com)

## Author

  - [Young-il Cho](http://github.com/terzeron)
  - [Seunglak Choi](http://github.com/seunglak)
  
## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Naver Corp.
