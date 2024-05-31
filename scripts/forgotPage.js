const express = require("express");
const nodemailer = require('nodemailer');
const router = express.Router();

const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const Joi = require("joi");

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
// const node_session_secret = process.env.NODE_SESSION_SECRET;

var { database } = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection('users');
const tokenCollection = database.db(mongodb_database).collection('forgotToken');

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

// USES
router.use(express.urlencoded({ extended: false }));
router.use(express.static(__dirname + "/public"));

router.get('/', (req, res) => {
    res.render("forgotPage");
});

router.post('/submitForgot', async (req, res) => {
    //Checks email validity
    var forgotEmail = req.body.forgotEmail;
    const schema = Joi.object({
        forgotEmail: Joi.string().email().max(20).required(),
    });
    const validationResult = schema.validate({ forgotEmail });

    //email not valid
    if (validationResult.error != null) {
        res.render("errorPage", { error: validationResult.error });
        return;
    }
    //find email in users collection
    const result = await userCollection.find({ email: forgotEmail }).project({ email: 1, _id: 1 }).toArray();

    //if not found
    if (result.length == 0) {
        res.render("errorPage", { error: "No user with that email found" });
        return;
    } else { //if found
        //generates token
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        var length = 32;
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            token += charset[randomIndex];
        }
        //encode token
        const encodedToken = await bcrypt.hash(token, saltRounds);
        //token expires after 30 mins
        const expiryTime = new Date(Date.now() + (30 * 60 * 1000));
        await tokenCollection.insertOne({ email: forgotEmail, token: encodedToken, expiry: expiryTime });

        //send email
        //WE MUST MAKE AN EMAIL TO SEND PASSWORD RESET EMAILS FROM
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.TEST_EMAIL,
                pass: process.env.TEST_PASSWORD
            }
        });
        //generate url
        const resetPasswordBaseUrl = 'https://two800-202410-bby34-sjiu.onrender.com/forgot/resetPassword';
        const resetPasswordLink = `${resetPasswordBaseUrl}?email=${encodeURIComponent(forgotEmail)}&token=${encodeURIComponent(encodedToken)}`;

        // Define email options
        let mailOptions = {
            from: 'your-email@gmail.com',
            to: forgotEmail,
            subject: 'Password Reset',
            text: 'Password reset link is below and will be active for 30 mins.\n' + resetPasswordLink
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.render("errorPage", {error: "Email failed to send, please try again!"});
                return;
            } else {
                res.render("emailSuccess"); 
                return;
            }
        });

    }
});

router.get('/resetPassword', (req, res) => {
    res.render("resetPage", {email: req.query.email, token: req.query.token});
});


router.post('/resetPassword', async (req, res) => {
    var email = req.body.temp1;
    var token = req.body.temp2;
    var password = req.body.password;
    var passwordConfirm = req.body.passwordConfirm;

    if (password.localeCompare(passwordConfirm) != 0) {
        res.render("errorPage", { error: "passwords don't match" });
        return;
    }

    const schema = Joi.object({
        password: Joi.string().max(20).required(),
    });
    const validationResult = schema.validate({ password });

    if (validationResult.error != null) {
        res.render("errorPage", { error: validationResult.error });
        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);

    const tokenResult = await tokenCollection.find({ email: email, token: token }).project({ email: 1, token: 1, expiry: 1, _id: 1 }).toArray();

    if (tokenResult.length == 0) {
        res.render("errorPage", { error: "token not found" });
        return;
    } else {

        if (new Date(Date.now()) <= tokenResult[0].expiry) {

            await userCollection.updateOne({ email: email }, { $set: { password: hashedPassword } });
            await tokenCollection.updateOne({ token: token }, { $set: { expiry: new Date(Date.now()) } });
            res.redirect('/login');
            return;

        } else {
            res.render("errorPage", { error: "Token expired" });
        }
    }
})

module.exports = router;
