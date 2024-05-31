require("./utils.js");
require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const webpush = require("web-push");
const bodyParser = require('body-parser');
const { database } = require('./databaseConnection');
const { MongoClient, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

const schedule = require('node-schedule');

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
    counter++;
    const processedData = `${input}`;
    const output = await runPrompt(input);
    const egg = JSON.parse(output).isEasterEgg;
    const time = JSON.parse(output).emailTime;
    const date = JSON.parse(output).emailDate;
    const issue = JSON.parse(output).emailIssue;
    const isSend = JSON.parse(output).sendEmail;
    var eggNum;
    if(egg === "true"){
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
    }
    // Send the processed data back to the client

    switch (eggNum) {
        case 1:
            assistantID = process.env.WHO_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 2:
            assistantID = process.env.PHIL_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 3:
            assistantID = process.env.DRE_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 4:
            assistantID = process.env.PEPPER_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            ); 
            break;
        case 5:
            assistantID = process.env.STRANGE_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            ); 
            break;
        case 6:
            assistantID = process.env.HOUSE_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        case 7:
            assistantID = process.env.ZOID_KEY;
            cancel = await openai.beta.threads.del(myThread.id);
            myThread = await openai.beta.threads.create();
            myRun = await openai.beta.threads.runs.create(
                myThread.id,
                { assistant_id: assistantID }
            );
            break;
        default:
            break;
    }

    res.send(data);
});

const runPrompt = async (input) => {
    const prompt = input;

    if(!myThread){
        return({"message": "error"});
    }

    const myThreadMessage = await openai.beta.threads.messages.create(
        myThread.id,
        {
            role: "user",
            content: prompt,
        }
    );
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
            res.render("errorPage", { error: "Invalid email account" });
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

            const schema = Joi.object({
                startTime: Joi.date().required(),
                endTime: Joi.date().required(),
                firstName: Joi.string().max(20).required(),
                lastName: Joi.string().max(20).required(),
                birthDate: Joi.date().required().min(Joi.ref('startTime')).max(Joi.ref('endTime')),
                country: Joi.string().max(20).required(),
                city: Joi.string().max(20).required(),
            });
            const validationResult = schema.validate({ startTime: '1900-01-01T00:00:00.000', endTime:'2054-01-01T00:00:00.000', firstName, lastName, birthDate, country, city});
            if (validationResult.error != null) {
                var err = validationResult.error.details[0];
                if (err.type.localeCompare('string.empty') == 0) {
                    res.render("errorPage", { error: `${err.path[0]} is empty.` });
                    return;
                } else if(err.type.localeCompare('date.max') == 0){
                    res.render("errorPage", { error: `Date is too large.` });
                    return;
                } else if(err.type.localeCompare('date.min') == 0){
                    res.render("errorPage", { error: `Date is too small.` });
                    return;
                }
                res.render("errorPage", { error: `${err.message}` });
                return;
            }


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

// Post for Medical History (meds)
app.post('/profile/medHistory/addMedication', async (req, res) => {
    if (isValidSession(req)) {
        try {
            // Get medication details from request body
            const medication = { 
                name: req.body.name,
                dosage: req.body.dosage,
                frequency: req.body.frequency,
                period: req.body.period
            };
            
            // Validate medication name
            if (!medication.name.trim()) {
                return res.render("errorPage", { error: "Medication name cannot be empty." });
            }
    
            // Update user's medication list in the database
            await userCollection.updateOne(
                { email: req.session.email },
                { $push: { medications: medication } }
            );
    
            // Schedule notification using Node-schedule based on medication frequency and period
            const cronSchedule = getCronSchedule(medication.frequency, medication.period);
            const cronJob = schedule.scheduleJob(medication.name, cronSchedule, () => {
                sendMedicationNotification(req.session.email, medication);
            });

            // Store the job name and medication details in the user's document
            await userCollection.updateOne(
                { email: req.session.email },
                { $push: { scheduledTasks: { taskName: medication.name, schedule: cronSchedule } } }
            );
    
            // Redirect to medication history page
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
            const oldName = req.body.oldName;
            const newName = req.body.newName;
            const newFrequency = req.body.newFrequency;
            const newPeriod = req.body.newPeriod;
            
            if (!newName.trim()) {
                res.render("errorPage", { error: "New medication name cannot be empty." });
                return;
            }

            // Retrieve the user document containing the scheduled tasks
            const user = await userCollection.findOne({ email: req.session.email });
            
            // Cancel the existing job
            schedule.cancelJob(oldName);

            // Get medication details from request body
            const updatedMedication = { 
                name: newName,
                dosage: req.body.newDosage,
                frequency: newFrequency,
                period: newPeriod
            };

            // Update medication details in the user's medication list
            await userCollection.updateOne(
                { email: req.session.email, "medications.name": oldName },
                { $set: { "medications.$": updatedMedication } }
            );
            
            // Schedule a new job with the updated medication details
            const newCronSchedule = getCronSchedule(newFrequency, newPeriod);
            const newJob = schedule.scheduleJob(newName, newCronSchedule, () => {
                sendMedicationNotification(req.session.email, updatedMedication);
            });

            // Store the new job name in the user's document
            await userCollection.updateOne(
                { email: req.session.email },
                { $push: { scheduledTasks: { taskName: newName, schedule: newCronSchedule } } }
            );

            // Redirect to medication history page
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
            const oldName = req.body.oldNameDelete;
    
            // Retrieve the user document containing the scheduled tasks
            const user = await userCollection.findOne({ email: req.session.email });
            
            // Retrieve the existing cron job instance associated with the deleted medication
            const task = user.scheduledTasks.find(task => task.taskName == oldName);
            // Cancel the job (if it exists)
            if (task) {
                // Stop the job using the stored task name
                schedule.cancelJob(task.taskName);
                
                // Remove the scheduled task from the user's document in the database
                await userCollection.updateOne(
                    { email: req.session.email },
                    { $pull: { medications: { name: oldName }, scheduledTasks: { taskName: oldName } } }
                );
            }

            // Redirect to medication history page
            res.redirect('/profile/medHistory');
        } catch (err) {
            console.error("Error deleting medication:", err);
            res.status(500);
            res.render("errorPage", { error: "Error deleting medication" });
        }
    } else {
        res.redirect('/login');
    }
});



/** Function to send medication notification
 * @param {string} email - The user's email address
 * @param {object} medication - The medication object containing name, dosage, frequency, and period
 */
async function sendMedicationNotification(email, medication) {
    try {
        // Retrieve the user's subscription from the database
        const user = await userCollection.findOne({ email });
        const subscription = user.subscription;

        if (subscription) {
            const payload = JSON.stringify({
                title: `MediKate - ${medication.name} Reminder`,
                message: `${medication.name}\n${medication.dosage}`
            });
            webpush.sendNotification(subscription, payload)
                .catch(error => console.error(error));
        }
    } catch (error) {
        console.error('Error sending medication notification:', error);
    }
}

/** Function to get the cron schedule based on the medication frequency and period
 * @param {string} frequency - The frequency of the medication
 * @param {string} period - The period of the medication
 */
function getCronSchedule(frequency, period) {
    const frequenciesPerDay = {
        "1x": "0 8 * * *", // Once daily at 8 AM
        "2x": "0 8,20 * * *", // Twice daily at 8 AM and 8 PM
        "3x": "0 8,14,20 * * *", // Three times daily at 8 AM, 2 PM, and 8 PM
        "4x": "0 6,12,18,22 * * *", // Four times daily at 6 AM, 12 PM, 6 PM, and 10 PM
        "8x": "0 */3 * * *", // Eight times daily (every 3 hours)
        "12x": "0 */2 * * *" // Twelve times daily (every 2 hours)
    };

    const frequenciesPerWeek = {
        "1x": "0 8 * * 1", // Once weekly on Monday at 8 AM
        "2x": "0 8 * * 1,4", // Twice weekly on Monday and Thursday at 8 AM
        "3x": "0 8 * * 1,3,5", // Three times weekly on Monday, Wednesday, and Friday at 8 AM
        "4x": "0 8 * * 1,2,4,5", // Four times weekly on Monday, Tuesday, Thursday, and Friday at 8 AM
        "8x": "0 8 * * 1,2,3,4,5,6,7", // Eight times weekly (every day) at 8 AM
        "12x": "0 */3 * * 1,2,3,4,5,6,7" // Twelve times weekly (every 8 hours) every day at 8 AM
    };

    const frequenciesPerMonth = {
        "1x": "0 8 1 * *", // Once monthly on the 1st day at 8 AM
        "2x": "0 8 1,15 * *", // Twice monthly on the 1st and 15th days at 8 AM
        "3x": "0 8 1,10,20 * *", // Three times monthly on the 1st, 10th, and 20th days at 8 AM
        "4x": "0 8 1,8,15,22 * *", // Four times monthly on the 1st, 8th, 15th, and 22nd days at 8 AM
        "8x": "0 8 1,4,8,11,15,18,22,25 * *", // Eight times monthly (every 3 days) at 8 AM
        "12x": "0 */2 1,5,9,13,17,21,25,29 * *" // Twelve times monthly (every 2 days) on specific days at 8 AM
    };

    // Choose the appropriate schedule based on the period
    let cronSchedule;
    if (period === 'daily') {
        cronSchedule = frequenciesPerDay[frequency];
    } else if (period === 'weekly') {
        cronSchedule = frequenciesPerWeek[frequency];
    } else if (period === 'monthly') {
        cronSchedule = frequenciesPerMonth[frequency];
    }

    return cronSchedule;
}


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