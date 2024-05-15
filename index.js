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


const expireTime = 60 * 60 * 1000; //expires after 1 hr  (minutes * seconds * millis)

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

app.get('/getProfile', (req,res) => {
    res.render('profilePage', {name:req.session.name});
});

app.get('/getPassEdit', (req,res) => {
    res.render("passEdit");
});

app.get('/login', (req, res) => {
    res.render("loginPage");
});

app.get('/signUp', (req, res) => {
    res.render("signUpPage");
});

app.get("*", (req,res) => {
	res.status(404);
	res.render("404Page");
})

// POSTS

app.post('/editPass', async(req,res) => {
    res.redirect('/getPassEdit');
});

app.post('/submitLogin', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

	const schema = Joi.object(
		{
			email: Joi.string().max(20).required(),
			password: Joi.string().max(20).required()
		});

	const validationResult = schema.validate({email, password});
	if (validationResult.error != null) {
        res.render("errorPage", {error: validationResult.error});
        return;
	}

	const result = await userCollection.find({email: email}).project({email: 1, password: 1, _id: 1}).toArray();

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

            res.redirect('/members');
            return;
        }
        else {
            res.render("errorPage", {error: "Invalid password."});
            return;
        }
    }	
});

app.post('/submitSignUp', async (req,res) => {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var birthDate = req.body.birthDate;
    var country = req.body.country;
    var city = req.body.city;
    var email = req.body.email;
    var password = req.body.password;
    var passwordConfirm = req.body.passwordConfirm;

    if(password.localeCompare(passwordConfirm)!=0){
        res.render("errorPage", {error:"Passwords do not match."});
        return;
    }

	const schema = Joi.object(
		{
            firstName: Joi.string().max(20).required(),
            lastName: Joi.string().max(20).required(),
            birthDate: Joi.date().required(),
            country: Joi.string().max(20).required(),
            city: Joi.string().max(20).required(),
			email: Joi.string().email().max(20).required(),
			password: Joi.string().max(20).required()
		});
        const validationResult = schema.validate({ firstName, lastName, birthDate, country, city, email, password});
        if (validationResult.error != null) {
            // console.log(validationResult.error.details[0]);
            var err = validationResult.error.details[0];
            if(err.type.localeCompare('string.empty') == 0){
                res.render("errorPage", { error: `${err.path[0]} is empty.` });
                return;
            }
        }
    
        var encodedPassword = await bcrypt.hash(password, saltRounds);
    
        await userCollection.insertOne({ firstName: firstName, lastName: lastName, birthDate: birthDate, country: country, city: city, email: email, password: encodedPassword});
    
        req.session.authenticated = true;
        // req.session.username = firstName;
        req.session.email = email;
        req.session.cookie.maxAge = expireTime;
    
        res.redirect('/');
});

// LISTENS

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 