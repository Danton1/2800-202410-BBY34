const express = require("express");
const nodemailer = require('nodemailer');
const router = express.Router();

router.get('/', (req, res) => {
    res.render("forgotPage");
});

router.post('/submitForgot', async (req, res) => {
    //Checks email validity
    var forgotEmail = req.body.forgotEmail;
    const schema = Joi.object({
        email: Joi.string().max(20).required(),
    });
    const validationResult = schema.validate({ email });

    //email not valid
    if (validationResult.error != null) {
        res.render("errorPage", { error: validationResult.error });
        return;
    }
    //find email in users collection
    const result = await userCollection.find({ email: email }).project({ email: 1, _id: 1 }).toArray();

    //if not found
    if (result.length == 0) {
        res.render("errorPage", { error: "No user with that email found" });
        return;
    } else { //if found
        //generates token
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            token += charset[randomIndex];
        }
        //encode token
        const encodedToken = await bcrypt.hash(token, saltRounds);
        //token expires after 30 mins
        const expiryTime = new Date(Date.now() + (30 * 60 * 1000));
        await tokenCollection.insertOne({ email: forgotEmail, token: encodedToken, expiry, expiryTime });
        
        //send email
        //WE MUST MAKE AN EMAIL TO SEND PASSWORD RESET EMAILS FROM
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com',
                pass: 'your-email-password'
            }
        });
        //generate url
        const resetPasswordBaseUrl = 'https://example.com/reset-password';
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
                console.log('Error occurred:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

    }
});

module.exports = router;