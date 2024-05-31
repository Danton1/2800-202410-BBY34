// imports 
const express = require("express");
const nodemailer = require('nodemailer');
const router = express.Router();
const MongoStore = require('connect-mongo');

// USES
router.use(express.urlencoded({ extended: true }));
router.use(express.static(__dirname + "/public"));

// Sends user email to doctor
router.post('/sendEmail', async (req, res) => {
    // gets email from html
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

        // formats string to html
        var str = req.body.tempContent;
        str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');

        // Nodemailer email configuration
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
                res.render("errorPage", { error: "Email failed to send, please try again!" });
                return;
            } else {
                res.render("emailSuccess");
                return;
            }
        });
    }
});

module.exports = router;