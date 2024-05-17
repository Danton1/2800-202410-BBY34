require("./utils.js");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");

const expireTime = 24 * 60 * 60 * 1000; //expires after 24 hr  (hours * minutes * seconds * millis)


/*Imported routes js files*/
const signUpRoute = require('./scripts/signUpPage');
app.use('/signUp', signUpRoute);
const forgotRoute = require('./scripts/forgotPage');
app.use('/forgot', forgotRoute);
const settingsRoute = require('./scripts/settings');
app.use('/settings', settingsRoute);
/*Imported routes js files end*/

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var {database} = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');
const tokenCollection = database.db(mongodb_database).collection('forgotToken');

app.set('view engine', 'ejs');

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

// USES

app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname + "/public"));

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

// FUNCTIONS

function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req,res,next) {
    if (isValidSession(req)) {
        next();
    }
    else {
        res.redirect('/login');
    }
}

function isAdmin(req) {
    if (req.session.user_type == 'admin') {
        return true;
    }
    return false;
}

function adminAuthorization(req, res, next) {
	console.log(req.session.user_type);
	if (!isAdmin(req)) {
        res.status(403);
        res.render("403");
        return;
    }
    else {
        next();
    }
}

// GETS

app.get('/', (req,res) => {
    if(isValidSession(req)){
        res.render('index', {username: req.session.firstName});
        return;
    }
    res.redirect('/login');
});

// Get for login
app.get('/login', (req, res) => {
    res.render("loginPage");
});

// Get for profile
app.get('/profile', (req,res) => {
    if(isValidSession(req)){
        res.render('profilePage', {user: req.session});
        return;
    }
    res.redirect('/login');
});
app.get('/profile/personalInfo', (req,res) => {
    if(isValidSession(req)){
        res.render('personalInfoPage', {user: req.session});
        return;
    }
    res.redirect('/login');
});
app.get('/profile/contactInfo', (req,res) => {
    if(isValidSession(req)){
        res.render('contactInfoPage', {user: req.session});
        return;
    }
    res.redirect('/login');
});
app.get('/profile/medHistory', (req,res) => {
    if(isValidSession(req)){
        res.render('medicalHistoryPage', {user: req.session});
        return;
    }
    res.redirect('/login');
});

// Get for Settings
app.get('/settings', (req,res) => {
    res.render('settingsPage');
});
app.get('/settings/signOut', (req, res) => {
    req.session.destroy();
    console.log("You are now logged out.");
    res.redirect("/login");
});

// Get for chatbot
app.get('/chatbot', (req, res) => {
    res.render("chatbotPage");
});

// Get for 404
app.get("*", (req,res) => {
	res.status(404);
	res.render("404Page");
})

// POSTS

app.post('/editPass', async(req,res) => {
    res.redirect('/getPassEdit');
});

app.post('/submitLogin', async (req,res) => {
    var email = req.body.loginPageEmailInput;
    var password = req.body.loginPagePasswordInput;

	const schema = Joi.object({
        email: Joi.string().max(20).required(),
        password: Joi.string().max(20).required()
	});

	const validationResult = schema.validate({email, password});
	if (validationResult.error != null) {
        res.render("errorPage", {error: validationResult.error});
        return;
	}

	const result = await userCollection.find({email: email}).project({email: 1, password: 1, _id: 1}).toArray();

    // Getting the userName info from the email
	let getUser = userCollection.findOne({email: email}).then((user) => {
        if (!user) {
            //if user does not exist, the authentication failed
			res.render("errorPage", {prompt: "Invalid email account"});
            return;
        }
        //assign the user to getUser variable
        getUser = user;
    })

	if (result.length == 0) {
        res.render("errorPage", {error: "No user with that email found"});
        return;
	} else if (result.length != 1) {
        res.render("errorPage", {error: "More than one user found."});
        return;
    } else {
        if (await bcrypt.compare(password, result[0].password)) {
            req.session.authenticated = true;
            req.session.cookie.maxAge = expireTime;
            req.session.email = result[0].email;
            req.session.firstName = getUser.firstName;
            req.session.lastName = getUser.lastName;
            req.session.birthDate = getUser.birthDate;
            req.session.country = getUser.country;
            req.session.city = getUser.city;

            res.redirect('/');
            return;
        }
        else {
            res.render("errorPage", {error: "Invalid password."});
            return;
        }
    }	
});

// LISTENS

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 