const express = require("express");
const router = express.Router();

const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const Joi = require("joi");
const expireTime = 24 * 60 * 60 * 1000; //expires after 24 hr  (hours * minutes * seconds * millis)

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

var { database } = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection('users');

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

// USES

router.use(express.urlencoded({ extended: false }));
router.use(express.static(__dirname + "/public"));

router.use(session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store 
    saveUninitialized: false,
    resave: true
}));

router.get('/', (req, res) => {
    res.render("signUpPage");
});


router.post('/submitSignUp', async (req, res) => {
    console.log(req.body.firstName);
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var birthDate = req.body.birthDate;
    var country = req.body.country;
    var city = req.body.city;
    var email = req.body.email;
    var password = req.body.password;
    var passwordConfirm = req.body.passwordConfirm;

    if (password.localeCompare(passwordConfirm) != 0) {
        res.render("errorPage", { error: "Passwords do not match." });
        return;
    }

    const schema = Joi.object({
        firstName: Joi.string().max(20).required(),
        lastName: Joi.string().max(20).required(),
        birthDate: Joi.date().required(),
        country: Joi.string().max(20).required(),
        city: Joi.string().max(20).required(),
        email: Joi.string().email().max(20).required(),
        password: Joi.string().max(20).required()
    });
    const validationResult = schema.validate({ firstName, lastName, birthDate, country, city, email, password });
    if (validationResult.error != null) {
        // console.log(validationResult.error.details[0]);
        var err = validationResult.error.details[0];
        if (err.type.localeCompare('string.empty') == 0) {
            res.render("errorPage", { error: `${err.path[0]} is empty.` });
            return;
        }
    }

    var encodedPassword = await bcrypt.hash(password, saltRounds);

    await userCollection.insertOne(
        { 
            firstName: firstName, 
            lastName: lastName, 
            birthDate: birthDate, 
            country: country, 
            city: city, 
            email: email, 
            secondaryEmail: null, 
            phoneNumber: null, 
            emergencyEmail: null,
            emergencyPhoneNumber: null, 
            password: encodedPassword, 
            medications: [], illnesses: [], allergies: [],  
            profile_pic: null
        }
    );

    req.session.authenticated = true;
    req.session.firstName = firstName;
    req.session.lastName = lastName;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;

    res.redirect('/');
});


module.exports = router;