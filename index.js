require("./utils.js");
require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const webpush = require("web-push");
// const PushNotifications = require('node-pushnotifications');
const bodyParser = require('body-parser');
const { database } = require('./databaseConnection');
const { MongoClient, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const Joi = require("joi");

const expireTime = 24 * 60 * 60 * 1000; //expires after 24 hr  (hours * minutes * seconds * millis)

/* Open AI */
const { Configuration, OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.GPT_KEY });

/*Imported routes js files*/
const signUpRoute = require('./scripts/signUpPage');
app.use('/signUp', signUpRoute);
const forgotRoute = require('./scripts/forgotPage');
app.use('/forgot', forgotRoute);
const settingsRoute = require('./scripts/settings');
app.use('/settings', settingsRoute);
const emailerRoute = require('./scripts/emailer');
app.use('/emailer', emailerRoute);
/*Imported routes js files end*/

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
// VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;
/* END secret section */

// Push notification setup
webpush.setVapidDetails('mailto:'+vapidEmail, vapidPublicKey, vapidPrivateKey);

const userCollection = database.db(mongodb_database).collection('users');
const tokenCollection = database.db(mongodb_database).collection('forgotToken');


var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.set('view engine', 'ejs');

// Cloudinary and multer for profile picture upload
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

    // USES

// app.use(express.urlencoded({extended: false}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.get('/chat.js', function (req, res) {
    res.sendFile(__dirname + '/scripts/chat.js');
});

app.use(bodyParser.json());

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

function sessionValidation(req, res, next) {
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
        res.render('index', {username: req.session.firstName, profilePic: req.session.profile_pic, openWeatherAPIKey: process.env.OPEN_WEATHER_API_KEY, widgetSettings: req.session.widgetSettings});
        return;
    }
    res.redirect('/login');
});

// Get for login
app.get('/login', (req, res) => {
    res.render("loginPage");
});

// Get for profile
app.get('/profile', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const user = await userCollection.findOne({ email: req.session.email });
            res.render('profilePage', { user });
        } catch (err) {
            console.error("Error fetching user data:", err);
            res.status(500).send("Internal Server Error");
        }
        return;
    }
    res.redirect('/login');
});

// Get for change password from the profile page
app.get('/profile/changePw', (req, res) => {
    res.render("changePassword");
});

// Get for personal Info 
app.get('/profile/personalInfo', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const user = await userCollection.findOne({ email: req.session.email });
            res.render('personalInfoPage', { user });
        } catch (err) {
            console.error("Error fetching user data:", err);
            res.status(500).send("Internal Server Error");
        }
        return;
    }
    res.redirect('/login');
});

// Get for Contact Info
app.get('/profile/contactInfo', async (req,res) => {
    if (isValidSession(req)) {
        try {
            const user = await userCollection.findOne({ email: req.session.email });
            res.render('contactInfoPage', { user });
        } catch (err) {
            console.error("Error fetching user data:", err);
            res.status(500).send("Internal Server Error");
        }
        return;
    }
    res.redirect('/login');
});

// Get for medical History
app.get('/profile/medHistory', async (req,res) => {
    if(isValidSession(req)){
        const user = await userCollection.findOne({ email: req.session.email });
        res.render('medicalHistoryPage', { user });
        return;
    }
    res.redirect('/login');
});
    

// Get for Settings

app.get('/settings/widgets', (req,res) => {
    if(isValidSession(req)){
        res.render('settings/widgetsPage', {widgetSettings: req.session.widgetSettings});
        return;
    }
    res.redirect('/login');
});
app.get('/settings/signOut', (req, res) => {
    req.session.destroy();
    console.log("You are now logged out.");
    res.redirect("/login");
});

// Get for chatbot
let myThread;
let assistantID;
let counter = 0;
app.get('/chatbot', async (req, res) => {
    if(isValidSession(req)){
        assistantID = process.env.KATE_KEY;
        counter = 0;
        myThread = await openai.beta.threads.create();
        const user = await userCollection.findOne({ email: req.session.email });
        res.render("chatbotPage", {user: user});
        return;
    }
    res.redirect('/login');
});

// Get for 404
app.get("*", (req,res) => {
	res.status(404);
	res.render("404Page");
});

    // POSTS

app.post('/chatbot', async (req, res) => {
    let input;
    console.log(counter);
    
    
    if(counter == 0){
        const user = await userCollection.findOne({ email: req.session.email });
        const date = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
        req.session.medications = user.medications;
        req.session.illnesses = user.illnesses;
        req.session.allergies = user.allergies;
        input = "User's medications: ";
        for(let i = 0; i < req.session.medications.length; i++){
            input += req.session.medications[i].name + " ";
        }
        input += ". User's Illnesses: " + req.session.illnesses + ". User's Allergies: " +req.session.allergies+ ". Current time: " + date + ". User input: " + req.body.userInput;
    } else {
        input = req.body.userInput;
    }
    console.log(input);
    counter++;
    // console.log("in the post function");
    const processedData = `${input}`;
    const output = await runPrompt(input);
    const egg = JSON.parse(output).isEasterEgg;
    const time = JSON.parse(output).emailTime;
    const date = JSON.parse(output).emailDate;
    const issue = JSON.parse(output).emailIssue;
    const isSend = JSON.parse(output).sendEmail;
    // console.log("egg: " + egg);
    var eggNum;
    if(egg === "true"){
        // console.log("aaa");
        eggNum = Math.floor(Math.random() * 7) + 1;
    } else{
        eggNum = 0;
    }
    var data = { 
        processedData: processedData, 
        output: output, 
        eggNum: eggNum, 
        sendEmail: isSend,
        emailTime: time,
        emailDate: date,
        emailIssue: issue,
        // userName: req.session.firstName + " " + req.session.lastName,
        // userEmail: req.session.email
    }
    // Send the processed data back to the client

    // console.log(eggNum);
    switch (eggNum) {
        case 1:
            // console.log("in switch");
            assistantID = process.env.WHO_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 2:
            // console.log("in switch");
            assistantID = process.env.PHIL_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 3:
            // console.log("in switch");
            assistantID = process.env.DRE_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 4:
            // console.log("in switch");
            assistantID = process.env.PEPPER_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            ); 
            break;
        case 5:
            // console.log("in switch");
            assistantID = process.env.STRANGE_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            ); 
            break;
        case 6:
            // console.log("in switch");
            assistantID = process.env.HOUSE_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 7:
            // console.log("in switch");
            assistantID = process.env.ZOID_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        default:
            // console.log("default");
            break;
    }

    res.send(data);
});

const runPrompt = async (input) => {
    const prompt = input;

    if(!myThread){ // haven't tested
        return({"message": "error"});
    }

    const myThreadMessage = await openai.beta.threads.messages.create(
        myThread.id,
        {
            role: "user",
            content: prompt,
        }
    );
    console.log(assistantID);
    console.log(myThread.id);
    const myRun = await openai.beta.threads.runs.create(
        myThread.id,
        { assistant_id: assistantID }
    );

    const retrieveRun = async () => {
        let keepRetrievingRun;

        while (myRun.status === "queued" || myRun.status === "in_progress") {
            keepRetrievingRun = await openai.beta.threads.runs.retrieve(
                myThread.id,
                (run_id = myRun.id)
            );

            if (keepRetrievingRun.status === "completed") {

                const allMessages = await openai.beta.threads.messages.list(
                    myThread.id
                );

                // console.log("User: ", myThreadMessage.content[0].text.value);
                // console.log("User: ", myThreadMessage);
                console.log("Assistant: ", allMessages.data[0].content[0].text.value);

                return allMessages.data[0].content[0].text.value;
            } else if (
                keepRetrievingRun.status === "queued" ||
                keepRetrievingRun.status === "in_progress"
            ) {
                // pass
            } else {
                console.log(`Run status: ${keepRetrievingRun.status}`);
                break;
            }
        }
    };
    return await retrieveRun();
};

app.post('/submitEmail', async(req,res) => {
    var date = req.body.emailDate;
    var time = req.body.emailTime;
    var issue = req.body.emailIssue;
    var userName= req.session.firstName + " " + req.session.lastName;
    var userEmail=  req.session.email;
    // console.log();
    res.render('emailerPage', {emailDate: date, emailTime:time, emailIssue: issue,
         userName: userName, userEmail: userEmail });
});

app.post('/editPass', async (req, res) => {
    res.redirect('/getPassEdit');
});

app.post('/submitLogin', async (req, res) => {
    var email = req.body.loginPageEmailInput;
    var password = req.body.loginPagePasswordInput;

    const schema = Joi.object({
        email: Joi.string().max(40).required(),
        password: Joi.string().max(20).required()
    });

    const validationResult = schema.validate({ email, password });
    if (validationResult.error != null) {
        res.render("errorPage", { error: validationResult.error });
        return;
    }

    const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1 }).toArray();

    // Getting the userName info from the email
    let getUser = userCollection.findOne({ email: email }).then((user) => {
        if (!user) {
            //if user does not exist, the authentication failed
            res.render("errorPage", { prompt: "Invalid email account" });
            return;
        }
        //assign the user to getUser variable
        getUser = user;
    })

    if (result.length == 0) {
        res.render("errorPage", { error: "No user with that email found" });
        return;
    } else if (result.length != 1) {
        res.render("errorPage", { error: "More than one user found." });
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
            req.session.widgetSettings = getUser.widgetSettings;
            req.session.medications = getUser.medications;
            req.session.illnesses = getUser.illnesses;
            req.session.allergies = getUser.allergies;
            req.session.profile_pic = getUser.profile_pic;

            res.redirect('/');
            return;
        }
        else {
            res.render("errorPage", { error: "Invalid password." });
            return;
        }
    }
});

//post for Personal Info
app.post('/profile/personalInfo/edit', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const { firstName, lastName, birthDate, country, city } = req.body;
            await userCollection.updateOne(
                { email: req.session.email },
                { $set: { firstName, lastName, birthDate, country, city } }
            );
            
            req.session.firstName = firstName;
            req.session.lastName = lastName;
            req.session.birthDate = birthDate;
            req.session.country = country;
            req.session.city = city;
            
            res.redirect('/profile/personalInfo');
        } catch (err) {
            console.error("Error updating user data:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

// Post for Profile Picture
app.post('/uploadProfilePic', upload.single('image'), async (req, res) => {
    try {
        const user_id = req.body.user_id;
        const buf64 = req.file.buffer.toString('base64');
        const result = await cloudinary.uploader.upload("data:image/png;base64," + buf64, {
            public_id: `profile_pics/${user_id}`
        });

        // Update the user's profile with the image URL
        const success = await userCollection.updateOne(
            { "_id": new ObjectId(user_id) },
            { $set: { profile_pic: result.url } }
        );

        if (!success) {
            res.render('errorPage', { error: 'Error uploading profile picture. Please try again.' });
            console.log("Error uploading profile image");
        } else {
            req.session.profile_pic = result.url; // Update session
            res.redirect(`/profile`);
        }
    } catch (ex) {
        res.render('errorPage', { error: 'Error connecting to the database' });
        console.log("Error connecting to MongoDB");
        console.log(ex);
    }
});

//post for Medical History (meds)
app.post('/profile/medHistory/addMedication', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const medication = { 
                name: req.body.name,
                dosage: req.body.dosage,
                frequency: req.body.frequency,
                period: req.body.period
            };
            if (!medication.name.trim()) {
                res.render("errorPage", { error: "Couldn't find anything to add." });
                return;
            }
            await userCollection.updateOne(
                { email: req.session.email },
                { $push: { medications: medication } }
            );
            // Defaulting period to daily
            let periodSeconds = 86400;
            if (medication.period == "weekly") {
                periodSeconds = 604800;
            } else if (medication.period == "monthly") {
                periodSeconds = 2628000;
            }
            let freqSeconds = parseInt(medication.frequency.charAt(0));
            let reminderSeconds = periodSeconds / freqSeconds;
            
            // Retrieve the user's subscription from the database
            const user = await userCollection.findOne({ email: req.session.email });
            const subscription = user.subscription;

            if (subscription) {
                setInterval(() => {
                    const payload = JSON.stringify({
                        title: `MediKate - ${medication.name} Reminder`,
                        message: `${medication.name}\n${medication.dosage}`
                    });
                    webpush.sendNotification(subscription, payload)
                        .catch(error => console.error(error));
                }, reminderSeconds * 1000); // Converting seconds to milliseconds
            }

            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error adding medication:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

// Post for medication history edit
app.post('/editMedication', async (req, res) => {
    if (isValidSession(req)) {
        try {
            let oldName = req.body.oldName;
            const medication = { 
                name: req.body.newName,
                dosage: req.body.newDosage,
                frequency: req.body.newFrequency,
                period: req.body.newPeriod
            };
            
            if (!medication.name.trim()) {
                res.render("errorPage", { error: "Couldn't find anything to add." });
                return;
            }

            await userCollection.updateOne(
                { email: req.session.email, "medications.name": oldName },
                { $set: { "medications.$": medication } }
            );
            
            const user = await userCollection.findOne({ email: req.session.email });
            req.session.medications = user.medications;

            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error updating user data:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

// Post for medication history delete
app.post('/deleteMedication', async (req, res) => {
    if (isValidSession(req)) {
        try {
            let oldName = req.body.oldNameDelete;

            await userCollection.updateOne(
                { email: req.session.email },
                { $pull: { medications: { name: oldName } } }
            );

            const user = await userCollection.findOne({ email: req.session.email });
            req.session.medications = user.medications;
            
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error updating user data:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

//post for Medical History (illness)
app.post('/profile/medHistory/addIllness', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const { illness } = req.body;
            if (illness.length < 1 || !illness.trim()) {
                res.render("errorPage", { error: "Couldn't find anything to add." });
                return;
            }
            await userCollection.updateOne(
                { email: req.session.email },
                { $push: { illnesses: illness } }
            );
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error adding illness:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

//post for illness info edit
app.post('/profile/medHistory/editIllness', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const editLength = req.body.illnessEditLength;
            let newIllness = [];
            for (let i = 0; i < editLength; i++) {
                let newIllnessToAdd = i + "illnessEdit";
                newIllness.push(req.body[newIllnessToAdd])
            }

            await userCollection.updateOne(
                { email: req.session.email },
                { $set: { illnesses: newIllness } }
            );
            
            const user = await userCollection.findOne({ email: req.session.email });
            req.session.illnesses = user.illnesses;
            
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error updating user data:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

// Post for illness info delete
app.post('/profile/medHistory/deleteIllness', async (req, res) => {
    if (isValidSession(req)) {
        try {
            let user = await userCollection.findOne({ email: req.session.email });

            user.illnesses.splice(req.query.id, 1);

            await userCollection.updateOne(
                { email: req.session.email },
                { $set: { illnesses: user.illnesses } }
            );

            user = await userCollection.findOne({ email: req.session.email });
            req.session.illnesses = user.illnesses;
            
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Failed to delete info:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

//post for Medical History (allergy)
app.post('/profile/medHistory/addAllergy', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const { allergy } = req.body;
            if (allergy.length < 1 || !allergy.trim()) {
                res.render("errorPage", { error: "Couldn't find anything to add." });
                return;
            }
            await userCollection.updateOne(
                { email: req.session.email },
                { $push: { allergies: allergy } }
            );
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error adding allergy:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

//post for allergy info edit
app.post('/profile/medHistory/editAllergy', async (req, res) => {
    if (isValidSession(req)) {
        try {
            const editLength = req.body.allergyEditLength;
            let newAllergy = [];
            for (let i = 0; i < editLength; i++) {
                let newAllergyToAdd = i + "allergyEdit";
                newAllergy.push(req.body[newAllergyToAdd])
            }

            await userCollection.updateOne(
                { email: req.session.email },
                { $set: { allergies: newAllergy } }
            );
            
            const user = await userCollection.findOne({ email: req.session.email });
            req.session.allergies = user.allergies;
            
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error updating user data:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

// Post for allergy info delete
app.post('/profile/medHistory/deleteAllergy', async (req, res) => {
    if (isValidSession(req)) {
        try {
            let user = await userCollection.findOne({ email: req.session.email });

            user.allergies.splice(req.query.id, 1);

            await userCollection.updateOne(
                { email: req.session.email },
                { $set: { allergies: user.allergies } }
            );

            user = await userCollection.findOne({ email: req.session.email });
            req.session.allergies = user.allergies;
            
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Failed to delete info:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

// Post to update contact information
app.post('/profile/contactInfo', async (req, res) => {
    if (isValidSession(req)) {
        var email = req.body.email;

        const schema = Joi.object({
            email: Joi.string().email().required(),
            secondaryEmail: Joi.string().email(),
            phoneNumber: Joi.string().pattern(/^\d{10}$/),
            emergencyEmail: Joi.string().email(),
            emergencyPhoneNumber: Joi.string().pattern(/^\d{10}$/)
        });

        const validation = schema.validate({ email });
        if (validation.error) {
            res.render("errorPage", { error: validation.error.details[0].message });
            return;
        }

        try {
            const { email, secondaryEmail, phoneNumber, emergencyEmail, emergencyPhoneNumber } = req.body;
            await userCollection.updateOne(
                { email: req.session.email },
                { $set: { email, secondaryEmail, phoneNumber, emergencyEmail, emergencyPhoneNumber } }
            );
            res.redirect('/profile/contactInfo');
        } catch (err) {
            console.error("Error updating contact information:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/settings/widgets/update', async (req, res) => {
    try {
        const settings = req.body;
        
        await userCollection.updateOne(
            { email: req.session.email },
            { $set: { widgetSettings: settings } }
        );

        req.session.widgetSettings = settings;

        res.status(200).send('Settings updated successfully');
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).send('Internal server error');
    }
});

// Push notification subscription route
app.post('/subscribe', async (req, res) => {
    if (isValidSession(req)) {
        try {
            // Get push subscription object
            const subscription = req.body;
            const userEmail = req.session.email;
            // Update the user's document in the database
            await userCollection.updateOne(
                { email: userEmail },
                { $set: { subscription: subscription } },
                { upsert: true }
            );
            // Send 201 - resource created
            res.status(201).json({});
        }catch (err) {
            console.error("Error storing subscription:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect('/login');
    }
});

    // LISTENS

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 