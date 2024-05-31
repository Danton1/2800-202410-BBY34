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

var { database } = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection('users');

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

// USES
router.use(express.urlencoded({ extended: true }));
router.use(express.static(__dirname + "/public"));

router.post('/sendEmail', async (req, res) => {
    var userEmail = req.body.useremail;


    //email not valid
    if (userEmail == null) {
        res.render("errorPage", { error: "No email detected" });
        return;
    }
    //find email in users collection
    const result = await userCollection.find({ email: userEmail }).project({ email: 1, firstName: 1, lastName: 1, _id: 1 }).toArray();

    //if not found
    if (result.length == 0) {
        res.render("errorPage", { error: "No user with that email found" });
        return;
    } else { //if found

        //send email
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.TEST_EMAIL,
                pass: process.env.TEST_PASSWORD
            }
        });

        var str = req.body.tempContent;
        str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');

        // console.log(str);
        let mailOptions = {
            from: userEmail,
            to: userEmail,
            subject: 'Appointment Request',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            </head>
            <body>
                <p> ${str} </p>
            </body>
            </html>`
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



module.exports = router;
