'use strict';
const express        = require('express');
const multer           = require('multer');
const router         = express.Router();
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const User           = require('../models/user');
var upload           = multer({ dest: 'uploads/' });

router.route('/register')
  .get((req, res, next) => {
    res.render('register',{
    	'title': 'Register'
    });
  })
  .post(upload.single('avatar'),(req, res, next) => {

    console.log(req.body);
    console.log(req.file);

  	// Get Form Values
  	let name = req.body.name;
  	let email = req.body.email;
  	let username = req.body.username;
  	let password = req.body.password;
  	let password2 = req.body.password2;

    // Check for Image Field
  	if(req.file){
  		console.log('Uploading File...');

  		// File Info
  		var profileImageOriginalName 	= req.file.originalname;
  		var profileImageName 			= req.file.name;
  		var profileImageMime 			= req.file.mimetype;
  		var profileImagePath 			= req.file.path;
  		var profileImageExt 			= req.file.extension;
  		var profileImageSize 			= req.file.size;
  	} else {
  		// Set a Default Image
  		var profileImageName = 'noimage.png';
  	}
  	// Form Validation
  	req.checkBody('name','Name field is required').notEmpty();
  	req.checkBody('email','Email field is required').notEmpty();
  	req.checkBody('email','Email not valid').isEmail();
  	req.checkBody('username','Username field is required').notEmpty();
  	req.checkBody('password','Password field is required').notEmpty();
  	req.checkBody('password2','Passwords do not match').equals(req.body.password);

  	// Check for errors
  	var errors = req.validationErrors();

  	if(errors){
  		res.render('register',{
  			errors: errors,
  			name: name,
  			email: email,
  			username: username,
  			password: password,
  			password2: password2
  		});
  	} else {
  		let newUser = new User({
      			name: name,
      			email: email,
      			username: username,
      			password: password,
      			profileimage: profileImageName
      		});

  		// Create User
    	User.createUser(newUser,(err, user) => {
    		if (err) throw err;
    		console.log(user);
    	});

  		// Success Message
  		req.flash('success','You are now registered and may log in');

  		res.location('/');
  		res.redirect('/');
  	}
  });

router.route('/login')
  .get((req, res, next) => {
    res.render('login',{
    	'title': 'Login'
    });
  })
  .post(passport.authenticate('local',{failureRedirect:'/users/login', failureFlash:'Invalid username or password'}),(req, res) =>{
  	console.log('Authentication Successful');
  	req.flash('success', 'You are logged in');
  	res.redirect('/');
  });

router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success','You have logged out');
	res.redirect('/users/login');
});

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
	(username, password, done) => {
		User.getUserByUsername(username, (err, user) => {
			if(err) throw err;
			if(!user){
				console.log('Unknown User');
				return done(null, false,{message: 'Unknown User'});
			}

			User.comparePassword(password, user.password,(err, isMatch) => {
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				} else {
					console.log('Invalid Password');
					return done(null, false, {message:'Invalid Password'});
				}
			});
		});
	}
));

module.exports = router;
